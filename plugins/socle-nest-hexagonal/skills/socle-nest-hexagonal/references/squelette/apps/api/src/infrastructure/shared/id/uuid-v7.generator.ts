import { Injectable } from "@nestjs/common";
import { uuidv7 } from "uuidv7";
import type { IIdGenerator } from "@domain/shared/spi/id-generator.spi";

// UUID v7 généré côté application : préfixe temporel quasi monotone,
// donc bonne localité d'insertion en index B-Tree (pas de fragmentation).
@Injectable()
export class UuidV7Generator implements IIdGenerator {
  nouvelId(): string {
    return uuidv7();
  }
}
