import { isAxiosError } from "axios";
import { ErreurDto } from "@{{SCOPE}}/{{PROJET}}-contracts";

/**
 * Lecture du corps d'erreur de l'API — la forme `ErreurDto` du contrat, celle
 * que le `DomainErrorFilter` rend pour tout refus. Le schéma vient de
 * packages/contracts : il n'est jamais redéclaré ici.
 */
export function lireErreurApi(erreur: unknown): ErreurDto | undefined {
  if (!isAxiosError(erreur)) return undefined;
  const corps = ErreurDto.safeParse(erreur.response?.data);
  return corps.success ? corps.data : undefined;
}

/** Le message à montrer à l'utilisateur : celui de l'API (prescriptif), sinon le repli. */
export function messageErreurApi(erreur: unknown, repli: string): string {
  return lireErreurApi(erreur)?.message ?? repli;
}

/** Le code stable de l'erreur de domaine, pour brancher un comportement dessus. */
export function codeErreurApi(erreur: unknown): string | undefined {
  return lireErreurApi(erreur)?.code;
}
