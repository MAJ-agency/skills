#!/usr/bin/env node
// =============================================================================
// Faux `gh` du dépôt jouet (depot-jouet.mjs) : placé en tête de PATH, il répond à `gh api`
// comme l'API REST de GitHub, sans réseau. État dans $FAUX_GH/etat.json :
//   pulls       PR { number, title, body, draft, state, labels: [noms], base, head, merged_at }
//   checks      états par PR (« #12 ») ou pour tout commit (« * ») : { nom: SUCCESS | FAILURE | IN_PROGRESS… }
//   exiges      checks exigés de develop ; runs : workflow_runs par PR (« #12 »)
// Le sommet d'une PR est lu dans le dépôt nu ($FAUX_GH_ORIGINE), comme GitHub. Chaque écriture
// (méthode autre que GET) est appliquée à l'état et journalisée dans $FAUX_GH/journal.jsonl.
// =============================================================================
import { execFileSync, spawnSync } from "node:child_process";
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const DOSSIER = process.env.FAUX_GH;
const ORIGINE = process.env.FAUX_GH_ORIGINE;
const FICHIER = join(DOSSIER, "etat.json");

// Un seul appel à la fois. Chaque appel lit l'état au début et le réécrit à la fin, lectures
// comprises : sans verrou, deux appels concurrents se marchent dessus. `boucle.sh` lance
// `file.sh | while …`, dont le producteur lit l'état pendant que le corps de boucle (renvoyer.sh)
// y pose un label : l'écriture du second était perdue (le label `fusion-bloquée` manquait), ou la
// lecture tombait sur un fichier à moitié écrit (SyntaxError). GitHub, lui, est atomique : le
// défaut était celui du faux, pas des scripts. Verrou = création d'un dossier (atomique), libéré à
// la sortie du processus qui l'a pris. Pas de reprise d'un verrou « périmé » : elle serait elle-même
// une course (deux appelants qui le jugent périmé, ou un détenteur lent dont on supprimerait le
// verrou neuf). Chaque banc a son dossier d'état ; un appel tué en laisse le verrou, et l'appel
// suivant échoue au bout de 30 s plutôt que de lire un état qu'il ne tient pas.
const VERROU = join(DOSSIER, "etat.verrou");
const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
for (let essais = 0; ; essais++) {
  try {
    mkdirSync(VERROU);
    break;
  } catch (erreur) {
    if (erreur.code !== "EEXIST") throw erreur;
    if (essais > 6000) throw new Error("faux gh : verrou de l'état jamais obtenu en 30 s");
    pause(5);
  }
}
process.on("exit", () => rmSync(VERROU, { recursive: true, force: true }));

const etat = JSON.parse(readFileSync(FICHIER, "utf8"));

const args = process.argv.slice(2);
if (args.shift() !== "api")
  echec(
    `faux gh : seul « gh api » est simulé (${process.argv.slice(2).join(" ")})`,
  );
let methode = "GET";
let jqExpr = null;
let entree = null;
let chemin = null;
const champs = {};
while (args.length) {
  const a = args.shift();
  if (a === "-X") methode = args.shift();
  else if (a === "--jq") jqExpr = args.shift();
  else if (a === "--paginate") continue;
  else if (a === "--input") {
    const source = args.shift();
    entree = readFileSync(source === "-" ? 0 : source, "utf8");
  } else if (a === "-f") {
    const [cle, ...valeur] = args.shift().split("=");
    champs[cle] = valeur.join("=");
  } else chemin = a;
}

function echec(message, code = 1) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}
function git(...a) {
  return execFileSync("git", ["--git-dir", ORIGINE, ...a], {
    encoding: "utf8",
  }).trim();
}
function ref(branche) {
  const r = spawnSync(
    "git",
    [
      "--git-dir",
      ORIGINE,
      "rev-parse",
      "-q",
      "--verify",
      `refs/heads/${branche}^{commit}`,
    ],
    {
      encoding: "utf8",
    },
  );
  return r.status === 0 ? r.stdout.trim() : null;
}
function versRest(pr) {
  return {
    number: pr.number,
    title: pr.title,
    body: pr.body ?? "",
    draft: pr.draft ?? false,
    state: pr.state ?? "open",
    merged_at: pr.merged_at ?? null,
    labels: (pr.labels ?? []).map((name) => ({ name })),
    base: { ref: pr.base },
    head: { ref: pr.head, sha: pr.sha ?? ref(pr.head) ?? "0".repeat(40) },
  };
}
function pr(n) {
  return (
    etat.pulls.find((p) => p.number === Number(n)) ??
    echec(`gh: Not Found (HTTP 404) pulls/${n}`)
  );
}
function checksDe(sha) {
  const p = etat.pulls.find((x) => versRest(x).head.sha === sha);
  return (p && etat.checks?.[`#${p.number}`]) ?? etat.checks?.["*"] ?? {};
}
const TERMINES = new Set([
  "SUCCESS",
  "FAILURE",
  "CANCELLED",
  "SKIPPED",
  "NEUTRAL",
  "TIMED_OUT",
  "ACTION_REQUIRED",
  "STARTUP_FAILURE",
]);

function repondre() {
  const [route, requete = ""] = chemin
    .replace(/^repos\/\{owner\}\/\{repo\}\//, "")
    .split("?");
  const q = new URLSearchParams(requete);
  let m;
  if (methode !== "GET") {
    appendFileSync(
      join(DOSSIER, "journal.jsonl"),
      `${JSON.stringify({ methode, route, champs, entree })}\n`,
    );
  }
  if (methode === "GET" && route === "pulls") {
    const etatVoulu = q.get("state") ?? "open";
    const tete = q.get("head")?.replace(/^\{owner\}:/, "");
    return etat.pulls
      .filter((p) => etatVoulu === "all" || (p.state ?? "open") === etatVoulu)
      .filter((p) => !q.get("base") || p.base === q.get("base"))
      .filter((p) => !tete || p.head === tete)
      .sort((a, b) => b.number - a.number)
      .map(versRest);
  }
  if (methode === "POST" && route === "pulls") {
    const n = Math.max(0, ...etat.pulls.map((p) => p.number)) + 1;
    etat.pulls.push({
      number: n,
      title: champs.title,
      body: champs.body,
      base: champs.base,
      head: champs.head,
      labels: [],
    });
    return versRest(pr(n));
  }
  if ((m = route.match(/^pulls\/(\d+)$/))) {
    if (methode === "PATCH")
      Object.assign(pr(m[1]), champs.base ? { base: champs.base } : {});
    return versRest(pr(m[1]));
  }
  if ((m = route.match(/^pulls\/(\d+)\/merge$/)) && methode === "PUT")
    return fusionner(pr(m[1]), JSON.parse(entree));
  if ((m = route.match(/^issues\/(\d+)\/labels$/)) && methode === "POST") {
    const p = pr(m[1]);
    p.labels = [...new Set([...(p.labels ?? []), champs["labels[]"]])];
    return p.labels.map((name) => ({ name }));
  }
  if (
    (m = route.match(/^issues\/(\d+)\/labels\/(.+)$/)) &&
    methode === "DELETE"
  ) {
    const p = pr(m[1]);
    const nom = decodeURIComponent(m[2]);
    if (!(p.labels ?? []).includes(nom))
      echec("gh: Label does not exist (HTTP 404)");
    p.labels = p.labels.filter((l) => l !== nom);
    return [];
  }
  if ((m = route.match(/^issues\/(\d+)\/comments$/)) && methode === "POST") {
    (pr(m[1]).commentaires ??= []).push(champs.body);
    return { id: 1 };
  }
  if ((m = route.match(/^commits\/([0-9a-f]+)\/check-runs$/))) {
    const runs = Object.entries(checksDe(m[1])).map(([name, e], i) =>
      TERMINES.has(e)
        ? { id: i + 1, name, status: "completed", conclusion: e.toLowerCase() }
        : { id: i + 1, name, status: e.toLowerCase(), conclusion: null },
    );
    return { total_count: runs.length, check_runs: runs };
  }
  if (route.match(/^commits\/[0-9a-f]+\/status$/)) return { statuses: [] };
  // Checks exigés : par ruleset (le cas nominal), ou par l'ancienne protection de branche quand
  // le dépôt jouet le déclare (`protectionClassique`) — l'autre forme répond alors comme GitHub.
  if (route === "rules/branches/develop")
    return etat.protectionClassique
      ? []
      : [
          {
            type: "required_status_checks",
            parameters: {
              required_status_checks: (etat.exiges ?? []).map((context) => ({
                context,
              })),
            },
          },
        ];
  if (route === "branches/develop/protection/required_status_checks")
    return etat.protectionClassique
      ? { contexts: etat.exiges ?? [] }
      : echec("gh: Branch not protected (HTTP 404)");
  if ((m = route.match(/^branches\/([^/]+)$/))) {
    return ref(decodeURIComponent(m[1]))
      ? { name: decodeURIComponent(m[1]) }
      : echec("gh: Branch not found (HTTP 404)");
  }
  if (route.match(/^branches\/[^/]+\/protection$/))
    echec("gh: Upgrade to GitHub Pro (HTTP 403)");
  if (route === "actions/runs") {
    const p = etat.pulls.find(
      (x) => versRest(x).head.sha === q.get("head_sha"),
    );
    return { workflow_runs: (p && etat.runs?.[`#${p.number}`]) ?? [] };
  }
  if (route.match(/^actions\/runs\/\d+\/rerun-failed-jobs$/)) return {};
  echec(`faux gh : route non simulée ${methode} ${chemin}`);
}

// Fusion dans le dépôt nu, comme GitHub : refusée si le sommet n'est plus `sha`.
function fusionner(
  p,
  {
    merge_method: methodeFusion,
    sha,
    commit_title: titre,
    commit_message: corps,
  },
) {
  if (ref(p.head) !== sha) echec("gh: Head branch was modified (HTTP 409)");
  const base = ref(p.base);
  const parents =
    methodeFusion === "merge" ? ["-p", base, "-p", sha] : ["-p", base];
  const commit = git(
    "commit-tree",
    `${sha}^{tree}`,
    ...parents,
    "-m",
    `${titre}\n\n${corps}`,
  );
  git("update-ref", `refs/heads/${p.base}`, commit, base);
  Object.assign(p, { state: "closed", merged_at: "2026-10-20T00:00:00Z" });
  return { merged: true, sha: commit };
}

const reponse = repondre();
// Écriture atomique : un lecteur qui n'est pas un appel du faux (les bancs lisent etat.json pour
// leurs assertions) ne voit jamais un état tronqué.
writeFileSync(`${FICHIER}.${process.pid}`, JSON.stringify(etat, null, 2));
renameSync(`${FICHIER}.${process.pid}`, FICHIER);
const json = JSON.stringify(reponse);
if (jqExpr === null) process.stdout.write(`${json}\n`);
else {
  const r = spawnSync("jq", ["-r", jqExpr], { input: json, encoding: "utf8" });
  process.stdout.write(r.stdout);
  process.stderr.write(r.stderr);
  process.exit(r.status ?? 1);
}
