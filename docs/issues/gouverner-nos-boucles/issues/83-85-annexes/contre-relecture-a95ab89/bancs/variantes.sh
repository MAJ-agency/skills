#!/usr/bin/env bash
# Variantes de l'index et du régime sur une copie d'Anchorpost (worktree jetable $1), gate de main ($2) et de la PR ($3).
# Chaque variante : l'arbre remis à l'état du commit avant, la variante posée (fichiers non suivis ou modifiés), les
# deux gates joués, la sortie et la différence.
set -u
AP=$1; MAIN=$2; PR=$3
B=$(dirname "$0")
remettre() { git -C "$AP" checkout -q -- . && git -C "$AP" clean -qfd -- scripts/chaine >/dev/null 2>&1; }
index() { node -e '
const fs=require("fs");const p=process.argv[1];const j=JSON.parse(fs.readFileSync(p,"utf8"));
const f=new Function("j",process.argv[2]);f(j);fs.writeFileSync(p,JSON.stringify(j,null,2)+"\n");' "$AP/anchorpost/anchorpost.json" "$1"; }
regime8() {
  node -e 'const fs=require("fs");const p=process.argv[1];const c=JSON.parse(fs.readFileSync(p,"utf8"));c.relecture={};fs.writeFileSync(p,JSON.stringify(c,null,2)+"\n")' "$AP/.claude/chaine.json"
  mkdir -p "$AP/scripts/chaine" && cp "$PR/skills/chaine/fusionner/scripts/double-relecture.mjs" "$AP/scripts/chaine/"
}
jouer() {
  local nom=$1; shift
  echo "## $nom"
  "$B/gate.sh" "$MAIN" "$AP" "$@" > "$TMPDIR/v-main.txt" 2>&1
  "$B/gate.sh" "$PR" "$AP" "$@" > "$TMPDIR/v-pr.txt" 2>&1
  echo "### main"; cut -c1-260 "$TMPDIR/v-main.txt"
  if cmp -s "$TMPDIR/v-main.txt" "$TMPDIR/v-pr.txt"; then echo "### PR : identique à main, octet pour octet"; else echo "### PR"; cut -c1-260 "$TMPDIR/v-pr.txt"; fi
  echo
}
remettre; jouer "develop tel quel (pivot 3, observe)"
remettre; index 'j.project.sufficiency="enforce"'; jouer "sufficiency enforce"
remettre; index 'delete j.project.sufficiency'; jouer "sufficiency absente"
remettre; index 'j.schema="2"'; jouer 'schema "2"'
remettre; index 'j.schema=3'; jouer "schema 3 (nombre)"
remettre; rm "$AP/anchorpost/anchorpost.json"; jouer "index absent"
remettre; printf '{ "schema": "3",\n<<<<<<< HEAD\n' > "$AP/anchorpost/anchorpost.json"; jouer "index qui n'est pas du JSON (marqueurs de conflit)"
remettre; printf '{ cassé' > "$AP/anchorpost/anchorpost.json"; git -C "$AP" add anchorpost/anchorpost.json; jouer "index illisible, --elaguer" --elaguer; git -C "$AP" reset -q
remettre; printf '{ cassé' > "$AP/anchorpost/anchorpost.json"; jouer "index illisible, --geler-types" --geler-types
remettre; printf 'null\n' > "$AP/anchorpost/anchorpost.json"; jouer "index JSON null"
remettre; index 'delete j.rules'; jouer "pivot 3 sans rules"
remettre; regime8; jouer "régime 8 (clé relecture, double-relecture.mjs du plugin)"
remettre; regime8; index 'j.project.sufficiency="enforce"'; jouer "régime 8, enforce"
remettre; regime8; printf '{ cassé' > "$AP/anchorpost/anchorpost.json"; jouer "régime 8, index illisible"
remettre
git -C "$AP" status --short
