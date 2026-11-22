#!/usr/bin/env bash
# E9 : une veille --reprendre (après boucle.sh --arreter du réveil de garde) tuée pendant sa préparation, ou dont la
# préparation échoue : le fichier d'arrêt posé par la garde reste, et --etat dit « arrêt demandé » (la garde ne fait rien).
# usage : e9-reprise-tuee.sh <veille.sh> <boucle.sh réel>. Ne tue que les veilles qu'il lance (pid noté) ; leurs
# `sleep` orphelins (pause de 3 s) finissent seuls.
V=$1; B=$2
ICI=$(cd "$(dirname "$0")" && pwd)
E=$TMPDIR/e9.$$; rm -rf "$E"
"$ICI/jouet.sh" "$E" "$V" 'sleep 4' >/dev/null
source "$ICI/env.sh" "$E"
cd "$E/clone"
attendre() { for _ in $(seq 150); do grep -q "$2" "$1" 2>/dev/null && return 0; sleep 0.2; done; return 1; }
bash "$E/veille.sh" --pause 3 --duree 5 > "$E/a.log" 2>&1 & a=$!
attendre "$E/a.log" 'préparation réussie'; sleep 0.5
kill -9 "$a"; wait "$a" 2>/dev/null
echo "1) veille tuée pendant sa pause :"; etat
echo "2) réveil de garde, point 3 : boucle.sh --arreter"; env -u CAPITAINE_ID bash "$B" --arreter; echo "   [sortie $?]"
echo boot-2 > "$E/boot"   # machine recyclée : la préparation se rejoue
bash "$E/veille.sh" --pause 3 --duree 5 --reprendre > "$E/b.log" 2>&1 & b=$!
attendre "$E/b.log" 'préparation ('; sleep 0.5
kill -9 "$b"; wait "$b" 2>/dev/null; sleep 4.5
echo "3) la veille relancée avec --reprendre, tuée pendant sa préparation :"; etat
echo "   arguments de la boucle : $(cut -d' ' -f1-2 "$E/arguments" 2>/dev/null | tr '\n' ';')"
echo "4) variante : la veille relancée avec --reprendre, préparation en échec (sortie 13)"
echo boot-3 > "$E/boot"
printf '{"preparerCapitaine": "exit 1"}\n' > .claude/chaine.json && git commit -qam echec && git push -q origin HEAD:develop
bash "$E/veille.sh" --pause 3 --duree 5 --reprendre > "$E/c.log" 2>&1; echo "   veille : [sortie $?] $(tail -1 "$E/c.log" | cut -c1-90)"
etat
echo "5) la suite de la sortie 13 : « relancer la veille » (sans --reprendre), préparation réparée"
printf '{}\n' > .claude/chaine.json && git commit -qam ok && git push -q origin HEAD:develop
bash "$E/veille.sh" --pause 0.1 --duree 1 --sondes 0 > "$E/d.log" 2>&1; echo "   veille : [sortie $?] $(tail -1 "$E/d.log")"
etat
sleep 3.5
rm -rf "$E"
