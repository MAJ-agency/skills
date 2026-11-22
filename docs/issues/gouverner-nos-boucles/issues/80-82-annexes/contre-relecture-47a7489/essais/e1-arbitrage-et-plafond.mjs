// Essai E1 (constat 1) : après un arbitrage ou une décision de plafond, rien ne bouge tant que l'auteur ne redemande
// pas la relecture ; et une demande faite avant l'arbitrage repart en `à-reprendre`. Joue la vraie décision du
// Relecteur (`decider` de `decision-relecteur.mjs`), sur l'arbre de la PR.
// Usage : node e1-arbitrage-et-plafond.mjs <racine d'un clone de skills>
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const racine = process.argv[2];
const m = await import(pathToFileURL(join(racine, 'skills/chaine/fusionner/scripts/decision-relecteur.mjs')).href);
const { ecrireVerdict } = await import(pathToFileURL(join(racine, 'skills/chaine/fusionner/scripts/verdict.mjs')).href);
const [V1, V2, V3, V4] = ['a', 'b', 'c', 'd'].map((c) => c.repeat(40));
const DEBUT = Date.UTC(2026, 10, 22, 10, 0);
const fil = (...corps) => corps.map((c, i) => {
  const date = new Date(DEBUT + i * 60_000).toISOString();
  return { id: 100 + i, body: c, author_association: 'MEMBER', created_at: date, updated_at: date };
});
const D = (tour, sommet, sessions, mention = null) => m.ecrireDistribution({ tour, sommet, sessions, mention, cible: null });
const verdict = (tour, session, mot, sommet) => `${ecrireVerdict({ sommet, tour, verdict: mot, bloquants: mot === 'refusé' ? 1 : 0, session, securite: null })}\n\n- R3, src/a.ts:12 — constat`;
const DEMANDE = (s) => `À relire — sommet ${s} — Session: session_fille — Conducteur: session_conducteur`;
const pr = (etiquettes, tete, commentaires) => ({ numero: 12, etiquettes, branche: 'feat/x', commentaires, tete, exiges: 1, sensible: false, memeContenu: {}, maintenant: DEBUT + 600 * 60_000, delaiMs: 120 * 60_000, sessions: {} });
const montrer = (titre, etat) => { const g = m.decider(etat); console.log(`${titre}\n  -> ${JSON.stringify({ regle: g.regle, geste: g.geste, raison: g.raison, poser: g.poser, mention: g.mention, tour: g.tour })}`); };

const refuse = [DEMANDE(V1), D(1, V1, ['r1']), verdict(1, 'r1', 'refusé', V1)];
const conteste = [...refuse, 'Contesté — R3, src/a.ts:12 — le filtre est posé par le garde'];
montrer('E1a. Refusé, contesté, relecture redemandée au même sommet AVANT l’arbitrage (à-relire posée) :', pr(['à-relire'], V1, fil(...conteste, DEMANDE(V1))));
const ecarte = [...conteste, 'Arbitrage — R3, src/a.ts:12 — écarté — le filtre est posé par le garde'];
montrer('E1b. Arbitrage « écarté » écrit, la PR garde à-reprendre seule (personne ne redemande) :', pr(['à-reprendre'], V1, fil(...ecarte)));
montrer('E1c. Le même, l’auteur ayant redemandé la relecture (à-relire) au même sommet :', pr(['à-relire'], V1, fil(...ecarte, DEMANDE(V1))));

const trois = [DEMANDE(V1), D(1, V1, ['r1']), verdict(1, 'r1', 'refusé', V1), DEMANDE(V2), D(2, V2, ['r1']), verdict(2, 'r1', 'refusé', V2), DEMANDE(V3), D(3, V3, ['r1']), verdict(3, 'r1', 'refusé', V3), m.TEXTE_PLAFOND];
const decide = [...trois, 'Décision de plafond — désaccord tranché : le bloquant R3 est écarté', 'Arbitrage — R3, src/a.ts:12 — écarté — le filtre est posé par le garde'];
montrer('E2a. Plafond, puis Décision de plafond écrite, la PR garde à-reprendre seule :', pr(['à-reprendre'], V3, fil(...decide)));
montrer('E2b. Le même, l’auteur ayant poussé V4 et redemandé la relecture (à-relire) :', pr(['à-relire'], V4, fil(...decide, DEMANDE(V4))));
