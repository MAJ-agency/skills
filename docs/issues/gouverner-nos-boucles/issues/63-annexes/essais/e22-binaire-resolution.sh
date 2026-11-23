# e22 (ticket 63, défaut 4) : un binaire dans la seule résolution. VARIANTE=neuf | ours | ajout
. "$(dirname "$0")/../outils/jouet.sh"
V=${VARIANTE:-neuf}
jouet "e22-$V"
F=apps/api/src/auth/cle.bin
bin() { printf '\x00\x01%s\x00\xff' "$1" > "$AU/$2"; }
git -C "$AU" switch -q develop; bin develop "$F"; co "feat: la clé de develop" > /dev/null; git -C "$AU" push -q origin develop
git -C "$AU" switch -q sujet/facture; bin sujet "$F"; co "feat(facture): la clé du sujet" > /dev/null; git -C "$AU" push -q origin sujet/facture
git -C "$AU" switch -q -c maj/facture sujet/facture
git -C "$AU" merge -q --no-edit origin/develop > /dev/null 2>&1 && echo "fusion sans conflit ?!"
case $V in
  neuf) bin resolution "$F" ;;
  ours) git -C "$AU" checkout -q --ours -- "$F" ;;
  ajout) git -C "$AU" checkout -q --ours -- "$F"; mkdir -p "$AU/apps/api/src/auth"; printf '\x00\x02ajout\x00' > "$AU/apps/api/src/auth/ajout.bin" ;;
esac
git -C "$AU" add -A; git -C "$AU" -c core.editor=true commit -q --no-edit
S1=$(git -C "$AU" rev-parse HEAD); git -C "$AU" push -q origin maj/facture
cloner sujet/facture; br 22
g etape2 sujet/facture maj/facture "$S1" | tail -1
g liste | grep -E 'sortie|mise à jour|refus|motif'
echo "--- fichiers.txt :"; cat "$BR/fichiers.txt"
g diff | grep -vE '^\[outil'
for f in resolution.txt binaires.txt illisibles.txt attendus.txt sans-ecart.txt; do echo "--- $f :"; cat "$BR/$f" 2>/dev/null; done
echo "--- resolution.patch :"; cat "$BR/resolution.patch"
printf '%s\n' "chore(facture): reçoit develop" > "$BR/titre.txt"
g axes | grep -vE '^\[outil'
echo "--- binaires-sensibles.txt :"; cat "$BR/binaires-sensibles.txt" 2>/dev/null
g c1 | tail -2
echo "--- empreinte, lignes qui nomment la résolution ou la clé :"; grep -E 'resolution|cle\.bin|ajout\.bin' "$BR/c1/avant.txt"
{ echo "aucun écart"; echo "Fichiers du diff lus :"; } > "$BR/axe-1-lot-resolution.txt"; g lus 1 resolution | grep -vE '^\[outil'
