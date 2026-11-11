#!/usr/bin/env node
/**
 * Tableau d'avancement d'un chantier.
 *
 * Pourquoi. L'humain demandait l'avancement « en % » plusieurs fois par jour ; chaque réponse coûtait
 * un tour d'architecte sur un contexte de plusieurs centaines de milliers de tokens. L'état existe
 * déjà : lignes `Status:` des tickets, PR et leurs labels. Ce script les croise en une commande.
 *
 * Tickets du chantier :
 *   - `sujet/<nom>` : sur la branche du sujet (develop s'il est livré), les tickets qui déclarent
 *     `Sujet: sujet/<nom>` et tous ceux d'une spec qui le déclare ;
 *   - `<spec>` (ex. `SPEC_ALL_SOC-1`) : les tickets de la spec, lus sur son sujet s'il en a un ouvert.
 * PR : ouvertes et fermées (`gh api`, REST), rattachées par l'identifiant dans le titre ou le slug
 * dans la branche (comme `ticket-libre.mjs`) ; CI = check-runs du dernier commit d'une PR ouverte.
 * Sans `gh` : avancement sans PR ni CI, avec la recherche `search_pull_requests` à faire par
 * l'outil GitHub MCP, sortie 3.
 *
 * Usage : node scripts/docs/avancement.mjs <sujet/nom|SPEC> [--json]
 */
import { execFileSync } from "node:child_process";
import {
  avancement,
  enMarkdown,
  lireTicket,
  prDuTicket,
} from "./avancement-regles.mjs";
import {
  estArchive,
  estSpec,
  identifiantDeLaSpec,
  specDuTicket,
} from "./identifiants.mjs";

const arg = process.argv[2] ?? "";
const json = process.argv.includes("--json");
if (!/^sujet\/[a-z0-9-]+$/.test(arg) && !estSpec(arg)) {
  console.error(
    "Usage : node scripts/docs/avancement.mjs <sujet/nom|SPEC> [--json]   (ex. sujet/socle, SPEC_ALL_SOC-1)",
  );
  process.exit(2);
}

const git = (...args) =>
  execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
try {
  git(
    "fetch",
    "-q",
    "origin",
    "develop",
    "+refs/heads/sujet/*:refs/remotes/origin/sujet/*",
  );
} catch {
  console.warn(
    "! fetch impossible : lecture des copies locales de origin/develop et origin/sujet/*",
  );
}
const existe = (ref) => {
  try {
    git("rev-parse", "--verify", "-q", ref);
    return true;
  } catch {
    return false;
  }
};
const fichiers = (ref) =>
  git("ls-tree", "-r", "--name-only", ref, "docs")
    .split("\n")
    .filter((f) => f && !estArchive(f));
const lireSur = (ref, f) => git("show", `${ref}:${f}`);
const SUJET = /^(?:- )?\**Sujet\**\s*:\**\s*(sujet\/[a-z0-9-]+)/m;
const specDe = (f) => identifiantDeLaSpec(f.split("/").pop());
const specDuFichier = (f) => specDuTicket(f.split("/").pop());

let ref = "origin/develop";
let chemins;
if (arg.startsWith("sujet/")) {
  if (existe(`origin/${arg}`)) ref = `origin/${arg}`;
  const tous = fichiers(ref);
  const specs = new Set(
    tous
      .filter((f) => specDe(f) && SUJET.exec(lireSur(ref, f))?.[1] === arg)
      .map(specDe),
  );
  chemins = tous.filter((f) => {
    if (!f.endsWith(".issue.md")) return false;
    if (specs.has(specDuFichier(f))) return true;
    return SUJET.exec(lireSur(ref, f))?.[1] === arg;
  });
} else {
  const spec = fichiers(ref).find((f) => specDe(f) === arg.toUpperCase());
  const sujet = spec && SUJET.exec(lireSur(ref, spec))?.[1];
  if (sujet && existe(`origin/${sujet}`)) ref = `origin/${sujet}`;
  chemins = fichiers(ref).filter(
    (f) => f.endsWith(".issue.md") && specDuFichier(f) === arg.toUpperCase(),
  );
}
if (!chemins.length) {
  console.error(
    `Aucun ticket pour ${arg} sur ${ref.replace(/^origin\//, "")}.`,
  );
  process.exit(2);
}
const tickets = chemins.map((f) => lireTicket(f, lireSur(ref, f)));

/** PR du dépôt (REST, pagination à la main : `--paginate` suit des liens que le proxy des sessions cloud refuse). */
function lirePrs() {
  const champs =
    '.[] | [.number, .head.ref, .head.sha, .draft, .state, (.merged_at != null), .title, ([.labels[].name] | join(","))] | @tsv';
  const prs = [];
  try {
    for (let page = 1; page <= 50; page++) {
      const sortie = execFileSync(
        "gh",
        [
          "api",
          `repos/{owner}/{repo}/pulls?state=all&per_page=100&page=${page}`,
          "--jq",
          champs,
        ],
        {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
          maxBuffer: 16 * 1024 * 1024,
        },
      );
      const lignes = sortie.split("\n").filter(Boolean);
      for (const l of lignes) {
        const [numero, branche, sha, draft, state, merged, titre, labels] =
          l.split("\t");
        const etat =
          merged === "true"
            ? "fusionnée"
            : state === "closed"
              ? "fermée"
              : draft === "true"
                ? "brouillon"
                : "ouverte";
        if (etat !== "fermée")
          prs.push({
            numero: Number(numero),
            branche,
            sha,
            titre,
            etat,
            labels: labels ? labels.split(",") : [],
          });
      }
      if (lignes.length < 100) break;
    }
    return prs;
  } catch {
    return null;
  }
}

/**
 * CI du dernier commit d'une PR ouverte : verte, rouge (n), en cours, sautée. Un job `skipped`
 * n'a rien prouvé (PR brouillon, condition de job) : le dire, plutôt que le compter vert.
 */
function ci(sha) {
  try {
    const conclusions = execFileSync(
      "gh",
      [
        "api",
        `repos/{owner}/{repo}/commits/${sha}/check-runs?per_page=100`,
        "--jq",
        '.check_runs[] | .conclusion // "en cours"',
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    )
      .split("\n")
      .filter(Boolean);
    if (!conclusions.length) return "aucune";
    const rouges = conclusions.filter((c) =>
      ["failure", "timed_out", "cancelled", "action_required"].includes(c),
    ).length;
    if (rouges) return `rouge (${rouges})`;
    if (conclusions.includes("en cours")) return "en cours";
    return conclusions.every((c) => c === "skipped") ? "sautée" : "verte";
  } catch {
    return "non lue";
  }
}

const prs = lirePrs();
if (prs) {
  for (const t of tickets) {
    const pr = prDuTicket(t.id, prs);
    if (pr && pr.etat !== "fusionnée") pr.ci = ci(pr.sha);
  }
}
const a = avancement(tickets, prs);
const nom = `${arg} (lu sur ${ref.replace(/^origin\//, "")})`;
if (json)
  console.log(
    JSON.stringify(
      { chantier: arg, lu_sur: ref.replace(/^origin\//, ""), ...a },
      null,
      2,
    ),
  );
else process.stdout.write(enMarkdown(nom, a));
if (!prs) {
  const depot = git("remote", "get-url", "origin")
    .trim()
    .replace(/\.git$/, "")
    .split("/")
    .slice(-2);
  const requete = `${arg.startsWith("sujet/") ? `base:${arg}` : arg} is:pr`;
  console.error(
    `\nPR et CI non lues (\`gh api\` indisponible) : \`search_pull_requests\` par l'outil GitHub MCP, requête \`${requete}\` (owner: "${depot[0]}", repo: "${depot[1]}").`,
  );
  process.exit(3);
}
