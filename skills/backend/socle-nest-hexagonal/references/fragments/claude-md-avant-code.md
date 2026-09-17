**Avant d'écrire la moindre ligne de code back, lire [`apps/api/CLAUDE.md`](apps/api/CLAUDE.md) en entier.**

Architecture back : **hexagonale (ports & adapters)**, travail **domain-first**. Stack : **NestJS** · **Kysely** (jamais un ORM) · **Zod / `nestjs-zod`** (jamais `class-validator`) · **PostgreSQL** · **Vitest** · **pnpm** · Node ≥ 22.
