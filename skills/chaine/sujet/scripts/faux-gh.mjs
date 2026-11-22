#!/usr/bin/env node
// =============================================================================
// Faux `gh` du dépôt jouet (depot-jouet.mjs) : placé en tête de PATH, il répond à `gh api`
// comme l'API REST de GitHub, sans réseau. État dans $FAUX_GH/etat.json :
//   pulls       PR { number, title, body, draft, state, labels: [noms], base, head, merged_at, created_at, commentaires }
//               `created_at` : la date d'ouverture, ISO 8601 (défaut 2026-11-17T11:00:00Z), lue par le Relecteur (régime)
//               `fourche` : le dépôt de la tête (`head.repo.full_name`), « maj/jouet » par défaut, celui de la base
//   maintenant  ISO 8601 : la date que reçoit tout commentaire posé (`POST issues/<n>/comments`), à la place de la date
//               de son rang ; le banc l'avance, comme l'horloge de GitHub. Sans la clé, la date du rang
//               `commentaires` : [corps], écrits par le compte du capitaine, ou { auteur, body } d'un autre compte
//               `evenements` : les poses et retraits d'étiquettes, [{ event: labeled | unlabeled, label: <nom>,
//               created_at }], que `GET issues/<n>/events` rend comme GitHub ({ event, label: { name }, created_at }) ;
//               une pose (`POST issues/<n>/labels`) d'une étiquette absente y ajoute `labeled`, un retrait `unlabeled`,
//               datés de `maintenant` (sans la clé, l'heure de la machine)
//   capitaine   compte que rend `gh api user` (défaut « capitaine ») ; compteIllisible : `user` répond 403
//   refusPost   message d'un refus du `POST pulls` (`gh: … (HTTP 422)`), code 1
//   brancheParDefaut  branche par défaut du dépôt (défaut « main »), dans `base.repo.default_branch`
//   checks      états par commit (clé = sha complet), par PR (« #12 », la tête courante de la PR seule) ou pour
//               tout commit (« * »), dans cet ordre de priorité : { nom: SUCCESS | FAILURE | IN_PROGRESS… }. Un état
//               peut être une liste (`["IN_PROGRESS", "SUCCESS"]`), consommée par sha : le faux compte les lectures
//               des `check-runs` de chaque commit (`lectures[<sha>]`) et rend l'élément de ce rang, le dernier une
//               fois la liste épuisée ; deux sommets qui lisent la même entrée « * » ont chacun leur compte
//   strict      branches où GitHub exige une PR à jour (« Require branches to be up to date ») : la fusion d'une PR
//               dont la base n'est pas ancêtre de `sha` répond 405 « Head branch is not up to date with the base
//               branch ». Sans la clé, aucune branche n'est stricte. Aucun script ne lit ce réglage
//   pendantCi   déplacements de branche pendant la CI, joués dans l'ordre : [{ lectures, branche, vers }]. À la
//               `lectures`-ième lecture des `check-runs` (tous commits) depuis le déplacement précédent, le faux
//               joue `update-ref refs/heads/<branche> <vers>` dans le dépôt nu, puis retire le déplacement. Une entrée
//               `{ lectures, pr, commentaire }` ajoute à la place un commentaire (corps ou objet) à la PR `pr`, et
//               `{ lectures, pr, labels }` lui donne ces étiquettes : un verdict ou une étiquette du Relecteur tombés
//               pendant la CI d'une mise à jour du capitaine (lot 5a)
//   avantFusion { branche, vers } : joué au `PUT pulls/<n>/merge` avant le contrôle « strict » et le calcul de
//               l'arbre, puis retiré : une fusion concurrente que GitHub a acceptée
//   exiges      checks exigés de develop ; runs : workflow_runs par PR (« #12 »)
//   PR.relecteurs / PR.equipes  relecteurs demandés (`requested_reviewers` logins, `requested_teams` slugs), comme GitHub
//               les rend : plus rien de la chaîne ne les lit, un banc vérifie qu'ils ne font rien attendre
//   commentairesRefuses  `true` : tout commentaire posé est refusé (403) ; une chaîne : ceux dont le corps correspond à
//               cette expression rationnelle seulement (un commentaire refusé, celui du verrou du passage posé)
//   PR.refusFusion  message d'un refus de fusion (`gh: … (HTTP 405)`) : le `PUT pulls/<n>/merge` le rend, code 1, après
//               `avantFusion` (une fusion concurrente, puis le refus)
//   origineCasseeAuRefus  au refus de `PR.refusFusion`, le dépôt nu est renommé : la relecture de develop échoue
//   PR.commentaires  un corps seul reçoit un `created_at` d'office, croissant avec son rang ; un objet { body, auteur,
//               association, created_at, updated_at } porte les siens (`association` : `author_association`, OWNER
//               par défaut, NONE pour un compte hors de l'organisation). Id = numéro × 1000 + rang + 1 (unique dans le
//               dépôt, comme GitHub). `POST issues/<n>/comments` rend { id, created_at, author_association… } ;
//               `PATCH issues/comments/<id>` réécrit le corps et date `updated_at` (`PR.editions`, rang → date) ;
//               `DELETE issues/comments/<id>` le retire des lectures (`PR.supprimes`, les rangs) ; les deux journalisés
//   concurrent  un commentaire (corps ou objet) d'un autre capitaine, inséré juste AVANT le prochain commentaire posé
//               (un id plus petit), puis retiré : deux capitaines arrivés à la même seconde
//   apresCommentaire  { state, labels… } assigné à la PR qui reçoit le prochain commentaire posé, puis retiré (jouée une
//               fois) : un autre passage finit pendant que le capitaine pose son verrou
//   pannes      GitHub en panne pour des lectures : [{ route, fois, sortie, erreur, code }]. `route` est une expression
//               rationnelle sur le chemin sans `repos/{owner}/{repo}/` (requête comprise) ; `sortie` ce que `gh` écrit
//               sur la sortie standard (défaut : rien), `erreur` sur la sortie d'erreur (défaut « gh: Bad Gateway
//               (HTTP 502) »), `code` le code de sortie (défaut 1). Une lecture (`GET`) dont le chemin correspond à la
//               première panne restante qui le prend y répond, puis décompte `fois` (défaut 1) ; à zéro, la panne sort
//               de l'état. `brute: true` écrit `erreur` sans fin de ligne. Les écritures ne sont jamais en panne
// Le sommet d'une PR est lu dans le dépôt nu ($FAUX_GH_ORIGINE), comme GitHub. Chaque écriture
// (méthode autre que GET) est appliquée à l'état et journalisée dans $FAUX_GH/journal.jsonl.
// `mergeable_state` sur la seule lecture d'une PR (`GET`/`PATCH pulls/<n>`), jamais dans la liste `GET pulls` (comme
// GitHub) : `dirty` si `git merge-tree --write-tree <base> <tête>` est en conflit dans le dépôt nu, `clean` sinon,
// `null` si la base ou la tête manque, ou si `git merge-tree --write-tree` est en échec (un banc remplace `git`). `PR.mergeableState` (dont `null` ou `"unknown"`, l'état que GitHub n'a pas
// encore calculé) prime sur ce calcul.
// Fusion (`PUT pulls/<n>/merge`), comme GitHub : refusée si la tête n'est plus `sha` (409) ; l'arbre du commit de
// squash ou de merge est celui de `git merge-tree --write-tree <base> <sha>` (l'arbre du sommet quand la base en est
// ancêtre) ; en conflit, 405 « Pull Request is not mergeable ». La réponse est `{ merged: true, sha }`.
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

// Un refus garde ce que l'appel a déjà joué (un `avantFusion` consommé, des lectures comptées), comme GitHub.
function echec(message, code = 1) {
  sauver();
  process.stderr.write(`${message}\n`);
  process.exit(code);
}
function sauver() {
  // Écriture atomique : un lecteur qui n'est pas un appel du faux (les bancs lisent etat.json pour
  // leurs assertions) ne voit jamais un état tronqué.
  writeFileSync(`${FICHIER}.${process.pid}`, JSON.stringify(etat, null, 2));
  renameSync(`${FICHIER}.${process.pid}`, FICHIER);
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
    created_at: pr.created_at ?? "2026-11-17T11:00:00Z",
    labels: (pr.labels ?? []).map((name) => ({ name })),
    base: { ref: pr.base, repo: { full_name: "maj/jouet", default_branch: etat.brancheParDefaut ?? "main" } },
    head: { ref: pr.head, sha: pr.sha ?? ref(pr.head) ?? "0".repeat(40), repo: { full_name: pr.fourche ?? "maj/jouet" } },
    requested_reviewers: (pr.relecteurs ?? []).map((login) => ({ login })),
    requested_teams: (pr.equipes ?? []).map((slug) => ({ slug })),
  };
}
// Une pose ou un retrait d'étiquette, daté comme un commentaire posé : `maintenant`, sinon l'heure de la machine.
function evenement(p, event, label) {
  p.evenements ??= [];
  p.evenements.push({ event, label, created_at: etat.maintenant ?? new Date().toISOString().replace(/\.\d{3}Z$/, "Z") });
}
// Date d'un commentaire sans date, par son rang : 2026-11-17T12:00:00Z, puis une seconde de plus par rang.
const dateDuRang = (i) => new Date(Date.UTC(2026, 10, 17, 12, 0, i)).toISOString().replace(/\.000Z$/, "Z");
// Commentaire `i` de la PR `p`, comme GitHub le rend. Id unique dans le dépôt (numéro × 1000 + rang + 1), croissant
// avec le rang ; `updated_at` = `created_at` sauf édition ; `author_association` OWNER sauf celle de l'objet.
function commentaireRest(p, i) {
  const c = p.commentaires[i];
  const o = typeof c === "string" ? { body: c } : c;
  const created_at = o.created_at ?? dateDuRang(i);
  return {
    id: p.number * 1000 + i + 1,
    body: o.body,
    user: { login: o.auteur ?? etat.capitaine ?? "capitaine" },
    author_association: o.association ?? "OWNER",
    created_at,
    updated_at: p.editions?.[i] ?? o.updated_at ?? created_at,
  };
}
function commentaireParId(id) {
  const p = etat.pulls.find((x) => x.number === Math.floor((id - 1) / 1000));
  const i = (id - 1) % 1000;
  if (!p || i >= (p.commentaires ?? []).length || (p.supprimes ?? []).includes(i)) echec("gh: Not Found (HTTP 404)");
  return { p, i };
}
function pr(n) {
  return (
    etat.pulls.find((p) => p.number === Number(n)) ??
    echec(`gh: Not Found (HTTP 404) pulls/${n}`)
  );
}
// Checks d'un commit : sa clé (sha complet), sinon celle de la PR dont il est la tête, sinon « * ». Une liste se lit
// au rang de la lecture de ce commit (le dernier élément une fois la liste épuisée).
function checksDe(sha) {
  const p = etat.pulls.find((x) => versRest(x).head.sha === sha);
  const entree = etat.checks?.[sha] ?? (p && etat.checks?.[`#${p.number}`]) ?? etat.checks?.["*"] ?? {};
  etat.lectures ??= {};
  const rang = etat.lectures[sha] ?? 0;
  etat.lectures[sha] = rang + 1;
  return Object.fromEntries(
    Object.entries(entree).map(([nom, e]) => [nom, Array.isArray(e) ? e[Math.min(rang, e.length - 1)] : e]),
  );
}
// Cible qui bouge pendant la CI : le premier déplacement de `pendantCi` se joue à sa `lectures`-ième lecture des
// check-runs depuis le déplacement précédent.
function deplacerPendantCi() {
  const suivant = etat.pendantCi?.[0];
  if (!suivant) return;
  etat.lecturesPendantCi = (etat.lecturesPendantCi ?? 0) + 1;
  if (etat.lecturesPendantCi < suivant.lectures) return;
  const cible = suivant.pr === undefined ? null : etat.pulls.find((x) => x.number === suivant.pr);
  if (suivant.commentaire !== undefined) cible.commentaires = [...(cible.commentaires ?? []), suivant.commentaire];
  else if (suivant.labels !== undefined) cible.labels = [...suivant.labels];
  else git("update-ref", `refs/heads/${suivant.branche}`, suivant.vers);
  etat.pendantCi.shift();
  etat.lecturesPendantCi = 0;
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

// Panne de GitHub sur une lecture : la réponse de la panne, telle quelle (aucun filtre `--jq`, comme `gh` sur une
// erreur HTTP), décomptée.
function panne() {
  if (methode !== "GET" || !Array.isArray(etat.pannes)) return;
  const relatif = chemin.replace(/^repos\/\{owner\}\/\{repo\}\//, "");
  const i = etat.pannes.findIndex((p) => new RegExp(p.route).test(relatif));
  if (i < 0) return;
  const p = etat.pannes[i];
  p.fois = (p.fois ?? 1) - 1;
  if (p.fois <= 0) etat.pannes.splice(i, 1);
  sauver();
  process.stdout.write(p.sortie ?? "");
  process.stderr.write(`${p.erreur ?? "gh: Bad Gateway (HTTP 502)"}${p.brute ? "" : "\n"}`);
  process.exit(p.code ?? 1);
}

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
    if (etat.refusPost) return echec(etat.refusPost);
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
      Object.assign(pr(m[1]), champs.base ? { base: champs.base } : {}, champs.state ? { state: champs.state } : {});
    return { ...versRest(pr(m[1])), mergeable_state: etatDeFusion(pr(m[1])) };
  }
  if ((m = route.match(/^pulls\/(\d+)\/merge$/)) && methode === "PUT")
    return fusionner(pr(m[1]), JSON.parse(entree));
  if ((m = route.match(/^issues\/(\d+)\/labels$/)) && methode === "POST") {
    const p = pr(m[1]);
    if (!(p.labels ?? []).includes(champs["labels[]"])) evenement(p, "labeled", champs["labels[]"]);
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
    evenement(p, "unlabeled", nom);
    return [];
  }
  // Les événements d'étiquette de la PR, comme GitHub les rend (le Relecteur les lit pour une étiquette déjà posée).
  if ((m = route.match(/^issues\/(\d+)\/events$/)) && methode === "GET")
    return (pr(m[1]).evenements ?? []).map((e) => ({ event: e.event, label: { name: e.label }, created_at: e.created_at }));
  if ((m = route.match(/^issues\/(\d+)\/comments$/)) && methode === "POST") {
    const refus = etat.commentairesRefuses;
    if (refus === true || (typeof refus === "string" && new RegExp(refus).test(champs.body ?? "")))
      echec("gh: Resource not accessible by integration (HTTP 403)");
    const p = pr(m[1]);
    p.commentaires ??= [];
    // Un autre capitaine arrivé à la même seconde : son commentaire passe juste avant le nôtre (un id plus petit).
    if (etat.concurrent) {
      p.commentaires.push(etat.concurrent);
      delete etat.concurrent;
    }
    p.commentaires.push(etat.maintenant ? { body: champs.body, created_at: etat.maintenant } : champs.body);
    const i = p.commentaires.length - 1;
    // Jouée une fois, au commentaire posé : la PR change sous le capitaine (un autre passage vient de finir).
    if (etat.apresCommentaire) {
      Object.assign(p, etat.apresCommentaire);
      delete etat.apresCommentaire;
    }
    return commentaireRest(p, i);
  }
  // Lecture des commentaires, comme GitHub les rend : un corps seul est du compte du capitaine. Les supprimés n'y sont plus.
  if ((m = route.match(/^issues\/(\d+)\/comments$/)) && methode === "GET") {
    const p = pr(m[1]);
    return (p.commentaires ?? []).map((_, i) => i).filter((i) => !(p.supprimes ?? []).includes(i)).map((i) => commentaireRest(p, i));
  }
  if ((m = route.match(/^issues\/comments\/(\d+)$/)) && (methode === "PATCH" || methode === "DELETE")) {
    const { p, i } = commentaireParId(Number(m[1]));
    if (methode === "DELETE") {
      (p.supprimes ??= []).push(i);
      return {};
    }
    const c = p.commentaires[i];
    if (typeof c === "string") p.commentaires[i] = champs.body;
    else c.body = champs.body;
    etat.horloge = (etat.horloge ?? 600) + 1;
    (p.editions ??= {})[i] = dateDuRang(etat.horloge);
    return commentaireRest(p, i);
  }
  if (route === "user" && methode === "GET")
    return etat.compteIllisible
      ? echec("gh: Resource not accessible by integration (HTTP 403)")
      : { login: etat.capitaine ?? "capitaine" };
  if ((m = route.match(/^commits\/([0-9a-f]+)\/check-runs$/))) {
    const lus = checksDe(m[1]);
    deplacerPendantCi();
    const runs = Object.entries(lus).map(([name, e], i) =>
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

// Arbre de la fusion de `base` et `sha` dans le dépôt nu (`git merge-tree --write-tree`) : `{ conflit, arbre }`.
function fusionEssayee(base, sha) {
  const essai = spawnSync("git", ["--git-dir", ORIGINE, "merge-tree", "--write-tree", "--no-messages", base, sha], {
    encoding: "utf8",
  });
  if (essai.status === 1) return { conflit: true, arbre: null };
  if (essai.status !== 0) throw new Error(`faux gh : git merge-tree en échec : ${essai.stderr}`);
  return { conflit: false, arbre: essai.stdout.split("\n")[0].trim() };
}
// `mergeable_state` d'une PR, comme GitHub le rend sur sa lecture (voir l'en-tête).
function etatDeFusion(p) {
  if (Object.hasOwn(p, "mergeableState")) return p.mergeableState;
  const base = ref(p.base);
  const sha = versRest(p).head.sha;
  if (!base || !ref(p.head)) return null;
  // Un calcul impossible (un banc remplace `git` par un git sans `merge-tree --write-tree`) se lit comme GitHub qui
  // n'a pas encore calculé l'état : `null`, jamais un faux en échec sur une simple lecture.
  try {
    return fusionEssayee(base, sha).conflit ? "dirty" : "clean";
  } catch {
    return null;
  }
}

// Fusion dans le dépôt nu, comme GitHub : refusée si le sommet n'est plus `sha`, si la base est stricte et pas
// ancêtre de `sha`, ou en conflit ; l'arbre est celui de la fusion de la base et du sommet.
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
  if (etat.avantFusion) {
    git("update-ref", `refs/heads/${etat.avantFusion.branche}`, etat.avantFusion.vers);
    delete etat.avantFusion;
  }
  if (p.refusFusion) {
    // Le dépôt nu devient injoignable : la relecture de develop qui suit le refus échoue (une coupure).
    if (etat.origineCasseeAuRefus) renameSync(ORIGINE, `${ORIGINE}.casse`);
    echec(p.refusFusion);
  }
  const base = ref(p.base);
  const ancetre = spawnSync("git", ["--git-dir", ORIGINE, "merge-base", "--is-ancestor", base, sha]).status === 0;
  if ((etat.strict ?? []).includes(p.base) && !ancetre)
    echec("gh: Head branch is not up to date with the base branch (HTTP 405)");
  const { conflit, arbre } = fusionEssayee(base, sha);
  if (conflit) echec("gh: Pull Request is not mergeable (HTTP 405)");
  const parents =
    methodeFusion === "merge" ? ["-p", base, "-p", sha] : ["-p", base];
  const commit = git(
    "commit-tree",
    arbre,
    ...parents,
    "-m",
    `${titre}\n\n${corps}`,
  );
  git("update-ref", `refs/heads/${p.base}`, commit, base);
  Object.assign(p, { state: "closed", merged_at: "2026-10-20T00:00:00Z" });
  return { merged: true, sha: commit };
}

panne();
const reponse = repondre();
sauver();
const json = JSON.stringify(reponse);
if (jqExpr === null) process.stdout.write(`${json}\n`);
else {
  const r = spawnSync("jq", ["-r", jqExpr], { input: json, encoding: "utf8" });
  process.stdout.write(r.stdout);
  process.stderr.write(r.stderr);
  process.exit(r.status ?? 1);
}
