#!/bin/bash
. <dossier du contre-relecteur>/bin/matrice.sh
mkdir -p $R/docs/.git
cas "s53 .git vide dans docs, docs déclaré, cwd = docs" "$SD$R/docs\n" "" - $R/docs
rmdir $R/docs/.git
