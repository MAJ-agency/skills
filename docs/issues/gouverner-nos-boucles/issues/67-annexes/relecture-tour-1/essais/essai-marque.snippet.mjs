
// --- Essais du relecteur neuf (tour unique sur les tickets 67 à 70), ajoutés à une copie du banc du Relecteur -------

test('relecture — C11, A-183 point 6 : une marque plus récente que la pose (une demande refaite sans push) fait repartir les lignes', () => {
  const d = monter();
  const sha = pr(d, { labels: ['à-relire', 'à-reprendre'] });
  // Le tour refusé (minute 3), `à-reprendre` posée par le Relecteur après lui (minute 4), puis l'auteur redemande la
  // relecture du même sommet (minute 5) sans retirer `à-reprendre` : la marque la plus récente est sa demande.
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3], [DEMANDE(sha), 5]);
  d.github({ pulls: [{ ...d.etat().pulls[0], evenements: [{ event: 'labeled', label: 'à-reprendre', created_at: minute(4) }] }] });
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.regle, g.geste, g.marque], [4, 'etiqueter', minute(5)], JSON.stringify(g));
  assert.deepEqual(g.lignes.map((l) => l.a), ['auteur', 'conducteur'], 'posée avant la marque la plus récente : les lignes partent');
});

