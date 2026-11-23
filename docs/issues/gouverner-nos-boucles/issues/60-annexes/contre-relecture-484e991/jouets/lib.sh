# Montages de dépôts jouets pour le calcul entier, en ligne de commande, sur du vrai git.
# À jouer hors du dépôt : MODULE=<chemin de double-relecture.mjs, dans un clone du plugin> TRAVAIL=<dossier privé> bash jouets/s1.sh
: "${MODULE:?MODULE : le chemin du double-relecture.mjs à jouer}" "${TRAVAIL:?TRAVAIL : un dossier privé où créer les dépôts jouets}"
J=$TRAVAIL/depots; mkdir -p $J
M=$MODULE
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 GIT_AUTHOR_NAME=x GIT_AUTHOR_EMAIL=a@b.c GIT_COMMITTER_NAME=x GIT_COMMITTER_EMAIL=a@b.c
R16=docs/metier/regles/all/RULE_ALL_FAC-16.md; R17=docs/metier/regles/all/RULE_ALL_FAC-17.md
CODE=apps/api/src/facture/total.ts
T03=docs/features/facture/all/issues/SPEC_ALL_FAC-1-facture.03.issue.md
T04=docs/features/facture/all/issues/SPEC_ALL_FAC-1-facture.04.issue.md
SPEC=docs/features/facture/all/SPEC_ALL_FAC-1-facture.spec.md
INDEX=anchorpost/anchorpost.json
nouveau() { rm -rf $J/$1; git init -q -b develop $J/$1; cd $J/$1; }
ecrire() { mkdir -p "$(dirname "$1")"; printf "%b" "$2" > "$1"; }
valider() { git add -A; git commit -qm "${1:-c}" --allow-empty; }
ref() { git update-ref refs/remotes/origin/$1 ${2:-HEAD}; }
# regle <id> <lignes criticality> <lignes code> [statut]
regle() { printf -- "---\nid: %s\ntitle: Le total d'une facture\nvalidation:\n  status: %s\n  date: 2026-11-16\n%b%bsources:\n  - { ref: \"réunion, point 3\", path: docs/r.md }\n---\n\nLe total est la somme des lignes.\n" "$1" "${4:-validated}" "$2" "$3"; }
ticket() { printf "# Total\n\nStatus: ready-for-agent\nType: task\n%bBlocked by: —\n\n## Le besoin\n\nUn besoin.\n" "$1"; }
spec() { printf "# Facture\n\nStatus: en cours\n%b\n## Les tickets\n\nUn.\n" "$1"; }
entree() { # clé niveau [statut] [code json]
  local crit=""; [ -n "$2" ] && crit=", \"criticality\": { \"level\": \"$2\", \"origin\": \"declared\" }"
  printf '{ "key": "%s", "context": "all", "title": "t", "validation": { "status": "%s" }, "code": %s%s }' "$1" "${3:-validated}" "${4:-[]}" "$crit"; }
index() { printf '{ "schema": "3", "rules": [ %s ] }\n' "$1"; }
# socle : develop avec R16 (critère $1), R17 moyenne, le code, un README
socle() { nouveau $1; regle RULE_ALL_FAC-16 "${2-criticality: high\n}" "code:\n  - $CODE\n" > /dev/null; mkdir -p $(dirname $R16) $(dirname $CODE); regle RULE_ALL_FAC-16 "${2-criticality: high\n}" "code:\n  - $CODE\n" > $R16; regle RULE_ALL_FAC-17 "criticality: medium\n" "" > $R17; echo "export const total = 1;" > $CODE; echo lisez > README.md; valider socle; ref develop; }
# calcul <nom> <attendu> <base> <tete> [titre] [branche] ; le diff vient de git, comme l'usage le dit
calcul() { local nom="$1" attendu="$2" base="$3" tete="$4" titre="${5:-}" branche="${6:-}"
  local depart; depart=$(git merge-base refs/remotes/origin/$base $tete 2>/dev/null)
  local sortie code
  sortie=$(git -c core.quotePath=false diff --no-renames --name-only ${depart:-$tete} $tete 2>/dev/null | node $M --base "$base" --tete "$tete" --titre "$titre" --branche "$branche" 2>$J/err.txt); code=$?
  local verdict; verdict=$(printf "%s" "$sortie" | tail -1)
  local marque=ok; [ "$verdict" != "$attendu" ] && marque="<<< ÉCART (attendu : $attendu)"
  printf "%-92s %-11s %2s  %s\n" "$nom" "$verdict" "$code" "$marque"
  if [ -n "$DETAIL" ] || [ "$marque" != ok ]; then printf "%s\n" "$sortie" | sed '$d' | sed 's/^/      /' | cut -c1-230; sed 's/^/      [err] /' $J/err.txt | cut -c1-230; fi
}
