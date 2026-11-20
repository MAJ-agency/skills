export async function resolve(specifier, context, next) {
  if (specifier === "node:test" || specifier === "test") return { url: new URL("./test-stub.mjs", import.meta.url).href, shortCircuit: true };
  return next(specifier, context);
}
