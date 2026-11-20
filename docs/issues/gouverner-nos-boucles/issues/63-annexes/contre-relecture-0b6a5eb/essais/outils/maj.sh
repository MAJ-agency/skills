# Bibliothèque des essais de la contre-relecture 143 : une PR de mise à jour jouet, bâtie sur jouet.sh du ticket.
# L'essai définit `ecrire <phase>` (commune, sujet, develop, resolu, retouche), qui écrit ses fichiers sous $AU.
. "$(dirname "${BASH_SOURCE[0]}")/../../annexes/outils/jouet.sh"
lignes_de() { local p=$1 n=$2; seq 1 "$n" | sed "s/^/export const ${p}/;s/\$/ = 1;/"; }
vers() { mkdir -p "$(dirname "$AU/$1")"; cat > "$AU/$1"; } # vers <chemin> : écrit l'entrée standard
binaire() { printf '\x00\x01%s\x00\xff' "$1"; }
maj() { # maj <n> [retouche] : la PR de mise à jour, le clone, etape2, liste
  git -C "$AU" switch -q develop; ecrire commune; co "feat: commune" > /dev/null; git -C "$AU" push -q origin develop
  git -C "$AU" switch -q sujet/facture; git -C "$AU" merge -q --no-edit develop; ecrire sujet; co "feat(facture): sujet" > /dev/null; git -C "$AU" push -q origin sujet/facture
  git -C "$AU" switch -q develop; ecrire develop; co "fix: develop" > /dev/null; git -C "$AU" push -q origin develop
  git -C "$AU" switch -q -c maj/facture sujet/facture
  git -C "$AU" merge -q --no-edit develop > /dev/null 2>&1 && echo "fusion sans conflit ?!"
  ecrire resolu; git -C "$AU" add -A; git -C "$AU" -c core.editor=true commit -q --no-edit
  if [ "${2:-}" = retouche ]; then ecrire retouche; co "fix(facture): une retouche après la fusion" > /dev/null; fi
  S1=$(git -C "$AU" rev-parse HEAD); git -C "$AU" push -q origin maj/facture
  cloner sujet/facture; br "$1"
  g etape2 sujet/facture maj/facture "$S1" | tail -2 | head -1
  g liste | grep -E 'sortie|refus|hors'
}
# Lignes par fichier d'un patch.
par_fichier() { awk '/^diff --git /{h=$0} {n[h]++} END{for(k in n) print n[k], k}' "$1" | sort -k2; }
