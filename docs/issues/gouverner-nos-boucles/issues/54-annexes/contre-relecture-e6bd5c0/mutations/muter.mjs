// Mutations du second contre-relecteur (PR 138), jouées sur l'arbre <dossier du contre-relecteur>/mut, une à la fois.
// Usage : node muter.mjs <id> [cible|complet]   — applique la mutation, lance le banc, remet le fichier.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const MUT = "<dossier du contre-relecteur>/mut";
const F = "skills/chaine/fusionner/scripts";
const REGLES = "skills/chaine/socle-chaine-de-production/references/agent";
const BANC_F = `${F}/fusionner.test.mjs`;
const REFUS = "fusion refusée durablement|refus de fusion 405";
const M = {
  M1: { nom: "passer.sh n'écrit plus le message exact du refus de GitHub", f: [[`${F}/passer.sh`, `  printf '%s\\n' "$message" >&2\n  # La branche ou develop`, "  # La branche ou develop"]], banc: BANC_F, cible: REFUS },
  M2: { nom: "passer.sh ne masque plus l'URL dans le message du refus", f: [[`${F}/passer.sh`, '  message=$(masquer_url <"$refus_fusion")', '  message=$(cat "$refus_fusion")']], banc: BANC_F, cible: REFUS },
  M3: { nom: "passer.sh saute encore (7) une PR qui porte le commentaire d'attente de l'ancienne version", f: [[`${F}/passer.sh`, 'case "$labels" in *,fusion-bloquée,*) sortir 7 "label fusion-bloquée" ;; esac\n', 'case "$labels" in *,fusion-bloquée,*) sortir 7 "label fusion-bloquée" ;; esac\n! gh api --paginate "$DEPOT/issues/$N/comments?per_page=100" --jq \'.[].body\' 2>/dev/null | grep -qF "<!-- attente-revue-capitaine -->" || sortir 7 "attend un humain"\n']], banc: BANC_F, cible: "que passer.sh rend en 7|file ordinaire|boucle.sh" },
  M4: { nom: "github.sh garde refus_pour_revue et passer.sh met un refus faute de revue en pause (5)", f: [
    [`${F}/github.sh`, "MARQUE_RENVOI='<!-- renvoi-capitaine -->'\n", "MARQUE_RENVOI='<!-- renvoi-capitaine -->'\nrefus_pour_revue() { grep -qiE 'code owner|approving review|review is required|reviews? required' <<<\"$1\"; }\n"],
    [`${F}/passer.sh`, "  if grep -qiE 'HTTP (409|5[0-9]{2})", "  if refus_pour_revue \"$message\" || grep -qiE 'HTTP (409|5[0-9]{2})"]], banc: BANC_F, cible: REFUS },
  M5: { nom: "file.sh montre encore « attend un propriétaire » une PR dont un relecteur est demandé", f: [
    [`${F}/file.sh`, "labels: [.labels[].name]}]' <<<\"$prs\")", "labels: [.labels[].name], dem: ((.requested_reviewers // []) + (.requested_teams // []) | length)}]' <<<\"$prs\")"],
    [`${F}/file.sh`, "    any(.labels[]; . == \"hors-sujet\"),\n", "    any(.labels[]; . == \"hors-sujet\"),\n    .dem,\n"],
    [`${F}/file.sh`, "read -r prio n sommet base brouillon bloquee hors_sujet tete titre; do", "read -r prio n sommet base brouillon bloquee hors_sujet dem tete titre; do"],
    [`${F}/file.sh`, "  elif [ \"$base\" = develop ]; then\n", "  elif [ \"$base\" = develop ] && [ \"$dem\" -gt 0 ]; then\n    etat='attend un propriétaire'\n  elif [ \"$base\" = develop ]; then\n"]], banc: BANC_F, cible: "file.sh" },
  M6: { nom: "file.sh lit encore la colonne `demandes` retirée (colonnes décalées)", f: [[`${F}/file.sh`, "read -r prio n sommet base brouillon bloquee hors_sujet tete titre; do", "read -r prio n sommet base brouillon bloquee hors_sujet demandes tete titre; do"]], banc: BANC_F, cible: "file.sh" },
  M7: { nom: "boucle.sh met de côté (sans arrêt) un refus durable dont la sortie de passer.sh nomme une revue", f: [[`${F}/boucle.sh`, '      elif [[ "$derniere" == *"CI non déclenchée"* ]]; then', '      elif grep -qiE "approving review|code owner review" "$sortie"; then\n        echo "[#$n] attend une revue : de côté"; attente_fusion="$attente_fusion$n "\n      elif [[ "$derniere" == *"CI non déclenchée"* ]]; then']], banc: BANC_F, cible: REFUS + "|boucle.sh" },
  M8: { nom: "boucle.sh met une sortie 7 en attente de la prochaine fusion au lieu de la sauter", f: [[`${F}/boucle.sh`, '    7) sautees="$sautees$n " ;;', '    7) attente_fusion="$attente_fusion$n " ;;']], banc: BANC_F, cible: "que passer.sh rend en 7|sautée|saute" },
  M9: { nom: "refusEdition ne résout plus les `..` (seuls `//` et `/./` normalisés)", f: [[`${REGLES}/regles.mjs`, "  const c = posix.normalize(chemin.replace(/\\\\/g, '/')).replace(/^(\\.\\/)+/, '');", "  const c = chemin.replace(/\\\\/g, '/').replace(/\\/(\\.\\/)+/g, '/').replace(/\\/+/g, '/').replace(/^(\\.\\/)+/, '');"]], banc: `${REGLES}/regles.test.mjs`, cible: null },
  M10: { nom: "renvois_de compte aussi le commentaire d'attente laissé par l'ancienne version", f: [[`${F}/github.sh`, '(.body | contains(\\"<!-- renvoi-capitaine -->\\"))', '((.body | contains(\\"<!-- renvoi-capitaine -->\\")) or (.body | contains(\\"<!-- attente-revue-capitaine -->\\")))']], banc: BANC_F, cible: "renvoi|plafond|humain" },
};
const [id, mode = "cible"] = process.argv.slice(2);
const m = M[id];
if (!m) { console.log("ids : " + Object.keys(M).join(" ")); process.exit(64); }
const sauves = [];
try {
  for (const [fichier, ancien, nouveau] of m.f) {
    const p = join(MUT, fichier);
    const texte = readFileSync(p, "utf8");
    if (texte.split(ancien).length !== 2) { console.log(`${id} INAPPLICABLE : ${fichier} (${texte.split(ancien).length - 1} occurrences)`); process.exit(2); }
    if (!sauves.some(([q]) => q === p)) sauves.push([p, texte]);
    writeFileSync(p, texte.replace(ancien, () => nouveau));
  }
  const args = ["--test", ...(mode === "cible" && m.cible ? [`--test-name-pattern=${m.cible}`] : []), m.banc];
  const env = { ...Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== "NODE_TEST_CONTEXT")), TMPDIR: "<dossier du contre-relecteur>/tmp" };
  const debut = Date.now();
  const r = spawnSync(process.execPath, args, { cwd: MUT, env, encoding: "utf8", timeout: 1_500_000, maxBuffer: 1 << 28 });
  const sortie = (r.stdout ?? "") + (r.stderr ?? "");
  const compte = (k) => (sortie.match(new RegExp(`^# ${k} (\\d+)`, "m")) ?? [])[1];
  const echecs = [...sortie.matchAll(/^not ok \d+ - (.*)$/gm)].map((x) => x[1]);
  console.log(`${id} [${mode}] ${m.nom}\n  banc : node ${args.join(" ")}\n  statut ${r.status} en ${Math.round((Date.now() - debut) / 1000)} s ; tests ${compte("tests")} pass ${compte("pass")} fail ${compte("fail")}\n  verdict : ${r.status === 0 ? "VERT (survit)" : r.status === null ? "SANS VERDICT" : "rouge"}${echecs.length ? "\n  échecs : " + echecs.slice(0, 6).join(" | ") : ""}`);
  writeFileSync(`<dossier du contre-relecteur>/essais/mutations/${id}-${mode}.log`, sortie);
} finally {
  for (const [p, texte] of sauves) writeFileSync(p, texte);
}
