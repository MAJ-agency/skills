#!/bin/bash
. <dossier du contre-relecteur>/bin/matrice.sh
printf "$SD$R\n" > $D/inc.gitconfig; printf "${SD}\n" > $D/raz.gitconfig; printf "${SB}explicit\n" > $D/expl.gitconfig
ln -sfn $R $D/lien
cas "s01 aucune déclaration" - "" - $R
cas "s02 globale exacte" "$SD$R\n" "" - $R
cas "s03 globale *" "$SD*\n" "" - $R
cas "s04 globale barre finale" "$SD$R/\n" "" - $R
cas "s05 globale parent/*" "$SD$D/*\n" "" - $R
cas "s06 globale autre dépôt" "$SD/ailleurs\n" "" - $R
cas "s07 système exacte" - "$SD$R\n" - $R
cas "s08 système exacte, NOSYSTEM=1" - "$SD$R\n" - $R GIT_CONFIG_NOSYSTEM=1
for v in 0 false no "" abc yes; do cas "s09 système exacte, NOSYSTEM='$v'" - "$SD$R\n" - $R "GIT_CONFIG_NOSYSTEM=$v"; done
cas "s10 système exacte, globale vide" "$SD\n" "$SD$R\n" - $R
cas "s11 globale vide puis exacte" "$SD\n$SD$R\n" "" - $R
cas "s12 globale exacte puis vide" "$SD$R\n$SD\n" "" - $R
cas "s13 système *, globale vide" "$SD\n" "$SD*\n" - $R
cas "s14 GIT_CONFIG_COUNT déclare" - "" - $R GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.directory GIT_CONFIG_VALUE_0=$R
cas "s15 globale exacte, COUNT remet à zéro" "$SD$R\n" "" - $R GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.directory GIT_CONFIG_VALUE_0=
cas "s16 globale exacte, COUNT=0" "$SD$R\n" "" - $R GIT_CONFIG_COUNT=0
cas "s17 globale exacte, PARAMETERS remet à zéro" "$SD$R\n" "" - $R "GIT_CONFIG_PARAMETERS='safe.directory='"
cas "s18 PARAMETERS déclare" - "" - $R "GIT_CONFIG_PARAMETERS='safe.directory=$R'"
printf "$SD$R\n" > $D/autre.gitconfig
cas "s19 GIT_CONFIG_GLOBAL ailleurs déclare" - "" - $R GIT_CONFIG_GLOBAL=$D/autre.gitconfig
cas "s20 GIT_CONFIG_GLOBAL vide, ~/.gitconfig déclare" "$SD$R\n" "" - $R GIT_CONFIG_GLOBAL=/dev/null
cas "s21 include qui déclare" "[include]\n\tpath = $D/inc.gitconfig\n" "" - $R
cas "s22 exacte puis include d'une remise à zéro" "$SD$R\n[include]\n\tpath = $D/raz.gitconfig\n" "" - $R
cas "s23 exacte puis includeIf gitdir remise à zéro" "$SD$R\n[includeIf \"gitdir:$R/\"]\n\tpath = $D/raz.gitconfig\n" "" - $R
cas "s24 includeIf gitdir qui déclare" "[includeIf \"gitdir:$R/\"]\n\tpath = $D/inc.gitconfig\n" "" - $R
cas "s25 exacte puis includeIf onbranch:main remise à zéro" "$SD$R\n[includeIf \"onbranch:main\"]\n\tpath = $D/raz.gitconfig\n" "" - $R
cas "s26 globale ~/../depot" "$SD~/../depot\n" "" - $R
cas "s27 globale lien symbolique" "$SD$D/lien\n" "" - $R
cas "s28 exacte, cwd = lien" "$SD$R\n" "" - $D/lien
cas "s29 lien, cwd = lien" "$SD$D/lien\n" "" - $D/lien PWD=$D/lien
cas "s30 exacte, cwd = sous-dossier" "$SD$R\n" "" - $R/docs
cas "s31 exacte, cwd = .git" "$SD$R\n" "" - $R/.git
cas "s32 .git déclaré, cwd = .git" "$SD$R/.git\n" "" - $R/.git
cas "s33 exacte en majuscules" "$SD$(echo $R | tr a-z A-Z)\n" "" - $R
cas "s34 XDG déclare, pas de ~/.gitconfig" - "" "$SD$R\n" $R
cas "s35 XDG déclare, ~/.gitconfig sans safe" "[user]\n\tname = x\n" "" "$SD$R\n" $R
cas "s36 système exacte, XDG remet à zéro, ~/.gitconfig existe" "[user]\n\tname = x\n" "$SD$R\n" "$SD\n" $R
cas "s37 système exacte, XDG remet à zéro, pas de ~/.gitconfig" - "$SD$R\n" "$SD\n" $R
cas "s38 ~inconnu puis exacte" "$SD~nosuchuser42/x\n$SD$R\n" "" - $R
cas "s39 exacte puis ~inconnu" "$SD$R\n$SD~nosuchuser42/x\n" "" - $R
cas "s40 * puis ~inconnu (système)" "$SD~nosuchuser42/x\n" "$SD*\n" - $R
cas "s41 sans = (NULL) puis exacte" "[safe]\n\tdirectory\n$SD$R\n" "" - $R
cas "s42 exacte puis sans = (NULL)" "$SD$R\n[safe]\n\tdirectory\n" "" - $R
cas "s43 valeur à saut de ligne" "$SD\"$R\\\\n/x\"\n" "" - $R
cas "s44 valeur à saut de ligne puis exacte" "$SD\"/x\\\\n$R\"\n" "" - $R
cas "s45 . et .." "$SD.\n$SD..\n" "" - $R
mkdir -p $R/docs/sous; chown 65534 $R/docs/sous 2>/dev/null
cas "s46 exacte, cwd = sous-dossier profond" "$SD$R\n" "" - $R/docs/sous
cas "s47 exacte, CEILING borne au-dessus" "$SD$R\n" "" - $R/docs GIT_CEILING_DIRECTORIES=$R
cas "s48 exacte, espace finale entre guillemets" "$SD\"$R \"\n" "" - $R
cas "s49 système déclare par include" - "[include]\n\tpath = $D/inc.gitconfig\n" - $R
cas "s50 système exacte, NOSYSTEM=1 et GIT_CONFIG_SYSTEM ailleurs" - "" - $R GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_SYSTEM=$D/inc.gitconfig
cas "s51 GIT_CONFIG_GLOBAL relatif (remise à zéro dans cwd), système exacte" - "$SD$R\n" - $D GIT_CONFIG_GLOBAL=raz.gitconfig
