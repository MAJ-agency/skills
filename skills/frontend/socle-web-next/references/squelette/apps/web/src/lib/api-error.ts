import { isAxiosError } from "axios";
import { ErrorDto } from "@{{SCOPE}}/{{PROJET}}-contracts";

/**
 * Lecture du corps d'erreur de l'API — la forme `ErrorDto` du contrat, celle
 * que le `DomainErrorFilter` rend pour tout refus. Le schéma vient de
 * packages/contracts : il n'est jamais redéclaré ici.
 */
export function readApiError(error: unknown): ErrorDto | undefined {
  if (!isAxiosError(error)) return undefined;
  const body = ErrorDto.safeParse(error.response?.data);
  return body.success ? body.data : undefined;
}

/** Le message à montrer à l'utilisateur : celui de l'API (prescriptif), sinon le repli. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  return readApiError(error)?.message ?? fallback;
}

/** Le code stable de l'erreur de domaine, pour brancher un comportement dessus. */
export function apiErrorCode(error: unknown): string | undefined {
  return readApiError(error)?.code;
}
