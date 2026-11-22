// Rapporteur node:test : une ligne JSON par test terminé (fichier, nom, niveau, issue, saut, todo).
export default async function* rapporteur(source) {
  for await (const { type, data } of source) {
    if (type !== 'test:pass' && type !== 'test:fail') continue;
    if (data.details?.type === 'suite') continue;
    yield `${JSON.stringify({ file: data.file, name: data.name, nesting: data.nesting, ok: type === 'test:pass', skip: data.skip !== undefined && data.skip !== false, todo: data.todo !== undefined && data.todo !== false })}\n`;
  }
}
