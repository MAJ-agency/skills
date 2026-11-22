#!/usr/bin/env bash
# Tour 3 : le cas « un poste sans `jq` » du banc du Relecteur joué seul, sous quatre postes simulés, dans un arbre donné.
# Usage : bash e9-e11.sh <arbre> [G1]   (G1 : retire `sansOutil('github.sh', r)` de relecteur.mjs le temps du jeu)
#  E9  : `node` copié dans un dossier où `jq` est en lien (la forme du tour 2), joué par ce `node`, PATH du poste inchangé ;
#  E9b : le même dossier mis en tête du PATH (le poste réel : `node` et `jq` de Homebrew, ou de /usr/bin) ;
#  E11 : un PATH de deux dossiers seulement, « brew » (node, jq, flock) puis « système » (/usr/bin et /bin sans jq, node,
#        flock) : `flock` n'existe que hors des dossiers système, comme sous macOS avec Homebrew ;
#  E0  : le `node` et le PATH du poste.
set -u
arbre=$1; mut=${2:-}
br=skills/chaine/relecteur/scripts/relecteur.test.mjs
r=skills/chaine/relecteur/scripts/relecteur.mjs
lab=$(mktemp -d)
mkdir -p "$lab/node-et-jq" "$lab/brew" "$lab/systeme"
cp "$(command -v node)" "$lab/node-et-jq/node"; ln -s "$(command -v jq)" "$lab/node-et-jq/jq"
cp "$(command -v node)" "$lab/brew/node"; ln -s "$(command -v jq)" "$lab/brew/jq"; ln -s "$(command -v flock)" "$lab/brew/flock"
for s in /usr/bin /bin; do for f in "$s"/*; do n=${f##*/}; case $n in jq|node|flock) continue;; esac; [ -e "$lab/systeme/$n" ] || ln -s "$f" "$lab/systeme/$n"; done; done
cd "$arbre"
echo "arbre : $(git rev-parse --short HEAD) ; mutation : ${mut:-aucune} ; $(uptime)"
if [ "$mut" = G1 ]; then
  node -e 'const fs=require("fs");const f=process.argv[1];const t=fs.readFileSync(f,"utf8");const a="  sansOutil(\x27github.sh\x27, r);\n";if(t.split(a).length!==2)process.exit(3);fs.writeFileSync(f,t.replace(a,""))' "$r" || { echo INTROUVABLE; exit 3; }
fi
motif='un poste sans `jq`'
filtre() { grep -E '^# (tests|pass|fail) |^(not )?ok |^ *(error|expected|actual): ' | grep -v '# SKIP' | sed "s#$lab#<lab>#g"; }
echo "## E0 : node et PATH du poste"; node --test --test-reporter=tap --test-name-pattern="$motif" "$br" 2>&1 | filtre
echo "## E9 : node copié à côté de jq, PATH du poste"; "$lab/node-et-jq/node" --test --test-reporter=tap --test-name-pattern="$motif" "$br" 2>&1 | filtre
echo "## E9b : le dossier node+jq en tête du PATH"; PATH="$lab/node-et-jq:$PATH" "$lab/node-et-jq/node" --test --test-reporter=tap --test-name-pattern="$motif" "$br" 2>&1 | filtre
echo "## E11 : PATH = brew (node, jq, flock) : système (sans jq, node, flock)"
PATH="$lab/brew:$lab/systeme" "$lab/brew/node" -e 'const {spawnSync}=require("child_process");for (const o of ["jq","flock","node","git","bash"]) console.log("#  "+o+" -> "+spawnSync("sh",["-c","command -v "+o]).stdout.toString().trim().replace(process.argv[1],"<lab>"))' "$lab"
PATH="$lab/brew:$lab/systeme" "$lab/brew/node" --test --test-reporter=tap --test-name-pattern="$motif" "$br" 2>&1 | filtre
[ "$mut" = G1 ] && git checkout -q -- "$r"
echo "arbre après : $(git status --short | wc -l) fichier(s) modifié(s) ; $(uptime)"
rm -rf "$lab"
