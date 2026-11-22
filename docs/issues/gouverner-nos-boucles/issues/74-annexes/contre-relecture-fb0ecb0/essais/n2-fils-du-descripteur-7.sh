#!/usr/bin/env bash
# N2 : quels fils de la veille héritent de son verrou (descripteur 7 sur veille.verrou) ? Chaque commande externe que la
# veille ou ses fils appellent par le PATH passe par un témoin, qui note si le descripteur 7 vise veille.verrou, puis
# exécute la vraie commande. Trois veilles : A (--reprendre, préparation, un fetch raté puis le sommeil entre deux essais,
# deux sondes, une relance), B (fin à l'échéance), C (boucle sortie en 10). usage : n2-fils-du-descripteur-7.sh <veille.sh>
V=$1; ICI=$(cd "$(dirname "$0")" && pwd)
J=$TMPDIR/n2.$$; rm -rf "$J"; "$ICI/jouet-contre.sh" "$J" "$V" "" 'sleep 0.3' >/dev/null; source "$ICI/env-contre.sh" "$J"; cd "$J/clone"
W=$J/temoins; mkdir -p "$W"
export JOURNAL_TEMOIN=$J/temoins.log VERROU_TEMOIN=$J/clone/.git/veille.verrou
for c in date git flock rm cat tr awk sed sort jq mktemp sleep tee comm mv bash sh wc dirname ps cut; do
  vrai=$(command -v "$c")
  cat > "$W/$c" <<T
#!/bin/bash
if [ "\$(/usr/bin/readlink /proc/\$\$/fd/7 2>/dev/null)" = "\$VERROU_TEMOIN" ]; then s=OUVERT; else s=fermé; fi
a=\${1-}; case "\$a" in */*) a=\${a##*/} ;; esac
[ "$c" != git ] || [ "\$a" != fetch ] || [ ! -s "$J/fetch-echecs" ] || { echo "\$s $c fetch(raté)" >> "\$JOURNAL_TEMOIN"; : > "$J/fetch-echecs"; exit 1; }
echo "\$s $c \$a" >> "\$JOURNAL_TEMOIN"
exec $vrai "\$@"
T
  chmod +x "$W/$c"
done
export PATH="$W:$PATH"
printf '31\tprête\t\n' > "$J/file-etat.plus-tard"
date +%FT%T > .git/boucle-arret; echo 1 > "$J/fetch-echecs"; echo boot-2 > "$J/boot"
( /bin/sleep 1.2; mv "$J/file-etat.plus-tard" "$J/file-etat" ) &
/bin/bash "$J/veille.sh" --pause 0.4 --duree 1 --sondes 3 --reprendre > "$J/a.log" 2>&1; echo "A : sortie $? ; $(tail -1 "$J/a.log")"
rm -f "$J/file-etat"
VEILLE_LIMITE=0.05 BOUCLE_SLEEP=3.5 /bin/bash "$J/veille.sh" --pause 0.2 --duree 1 --marge 0 > "$J/b.log" 2>&1; echo "B : sortie $? ; $(tail -1 "$J/b.log")"
date +%FT%T > .git/boucle-arret
/bin/bash "$J/veille.sh" --pause 0.2 --duree 1 --sondes 1 > "$J/c.log" 2>&1; echo "C : sortie $? ; $(tail -1 "$J/c.log")"
echo "Commandes externes vues (état du descripteur 7, commande, premier argument) :"
sort "$JOURNAL_TEMOIN" | uniq -c | sort -k2,2 -k3,3 | sed 's/^/  /'
cd / && rm -rf "$J"
