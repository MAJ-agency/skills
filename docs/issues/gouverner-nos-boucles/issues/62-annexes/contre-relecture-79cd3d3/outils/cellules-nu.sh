#!/bin/bash
. <dossier du contre-relecteur>/bin/matrice.sh
NA=$D/nu-autre M=$D/mien
printf "${SB}explicit\n" > $D/expl.gitconfig
cas "b01 nu, rien" - "" - $N
cas "b02 nu, globale explicit" "${SB}explicit\n" "" - $N
cas "b03 nu, globale all" "${SB}all\n" "" - $N
cas "b04 nu, système explicit, globale all" "${SB}all\n" "${SB}explicit\n" - $N
cas "b05 nu, système all, globale explicit" "${SB}explicit\n" "${SB}all\n" - $N
cas "b06 nu, globale vide (dernière)" "${SB}\n" "" - $N
cas "b07 nu, globale inconnue (dernière)" "${SB}bogus\n" "" - $N
cas "b08 nu, globale bogus puis all" "${SB}bogus\n${SB}all\n" "" - $N
cas "b09 nu, système vide, globale all" "${SB}all\n" "${SB}\n" - $N
cas "b10 nu, système sans = (NULL), globale all" "${SB}all\n" "[safe]\n\tbareRepository\n" - $N
cas "b11 nu, système Explicit (casse), globale all" "${SB}all\n" "${SB}Explicit\n" - $N
cas "b12 nu, globale explicit puis bogus puis all" "${SB}explicit\n${SB}bogus\n${SB}all\n" "" - $N
cas "b13 nu, COUNT explicit" - "" - $N GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.bareRepository GIT_CONFIG_VALUE_0=explicit
cas "b14 nu, globale explicit, COUNT all" "${SB}explicit\n" "" - $N GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.bareRepository GIT_CONFIG_VALUE_0=all
cas "b15 nu, PARAMETERS explicit" - "" - $N "GIT_CONFIG_PARAMETERS='safe.bareRepository=explicit'"
cas "b16 nu, GIT_CONFIG_GLOBAL ailleurs explicit" - "" - $N GIT_CONFIG_GLOBAL=$D/expl.gitconfig
cas "b17 nu, XDG explicit, ~/.gitconfig existe" "[user]\n\tname = x\n" "" "${SB}explicit\n" $N
cas "b18 nu, XDG explicit, ~/.gitconfig all" "${SB}all\n" "" "${SB}explicit\n" $N
cas "b19 nu, include explicit" "[include]\n\tpath = $D/expl.gitconfig\n" "" - $N
cas "b20 nu, includeIf gitdir explicit" "[includeIf \"gitdir:$N\"]\n\tpath = $D/expl.gitconfig\n" "" - $N
cas "b21 nu, explicit, GIT_DIR donné (--git-dir)" "${SB}explicit\n" "" - $N GIT_DIR=$N
cas "b22 mien/.git, explicit (implicite)" "${SB}explicit\n" "" - $M/.git
cas "b23 mien/.git, bogus puis all" "${SB}bogus\n${SB}all\n" "" - $M/.git
cas "b24 nu/refs (sous-dossier), explicit" "${SB}explicit\n" "" - $N/refs
cas "b25 nu, système explicit, NOSYSTEM=1" - "${SB}explicit\n" - $N GIT_CONFIG_NOSYSTEM=1
cas "b26 nu, GIT_CONFIG_GLOBAL relatif explicit" - "" - $N GIT_CONFIG_GLOBAL=expl.gitconfig
cas "b27 nu, valeur à saut de ligne" "${SB}\"explicit\\\\nall\"\n" "" - $N
cas "b28 nu, clé en majuscules" "[SAFE]\n\tBAREREPOSITORY = explicit\n" "" - $N
cas "b29 nu-autre, safe.directory exacte" "[safe]\n\tdirectory = $NA\n" "" - $NA
cas "b30 nu-autre, safe.directory *" "[safe]\n\tdirectory = *\n" "" - $NA
cas "b31 nu-autre, * et explicit" "[safe]\n\tdirectory = *\n${SB}explicit\n" "" - $NA
cas "b32 mien (arbre), explicit" "${SB}explicit\n" "" - $M
cas "b33 mien (arbre), bogus" "${SB}bogus\n" "" - $M
cas "b34 nu, HOME relatif explicit" - "" - $N HOME=relatif-inexistant
