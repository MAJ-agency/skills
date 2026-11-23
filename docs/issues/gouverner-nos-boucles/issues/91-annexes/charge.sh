#!/bin/sh
# Pose une charge de N processus qui tournent à vide (N boucles node), le temps de la commande, puis les tue.
# Usage : sh charge.sh <N> <commande…>
N=$1; shift
pids=''
for i in $(seq 1 "$N"); do node -e 'for(;;){}' & pids="$pids $!"; done
sleep 20
uptime
"$@"; rc=$?
uptime
kill $pids 2>/dev/null
exit $rc
