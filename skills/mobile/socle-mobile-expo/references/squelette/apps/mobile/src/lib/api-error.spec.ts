import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { codeErreurApi, lireErreurApi, messageErreurApi } from "./api-error";

function erreurAxios(data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("refus", "ERR_BAD_REQUEST", config, undefined, {
    data,
    status: 400,
    statusText: "Bad Request",
    headers: {},
    config,
  });
}

describe("lireErreurApi", () => {
  it("lit un corps conforme au contrat ErreurDto", () => {
    const e = erreurAxios({ code: "DEMANDE_INTROUVABLE", message: "Vérifie l'identifiant." });
    expect(lireErreurApi(e)).toEqual({ code: "DEMANDE_INTROUVABLE", message: "Vérifie l'identifiant." });
    expect(codeErreurApi(e)).toBe("DEMANDE_INTROUVABLE");
    expect(messageErreurApi(e, "repli")).toBe("Vérifie l'identifiant.");
  });

  it("ignore un corps qui n'est pas un ErreurDto", () => {
    expect(lireErreurApi(erreurAxios({ statusCode: 500 }))).toBeUndefined();
    expect(messageErreurApi(erreurAxios("html"), "repli")).toBe("repli");
  });

  it("ignore une erreur qui ne vient pas d'axios", () => {
    expect(lireErreurApi(new Error("réseau"))).toBeUndefined();
    expect(codeErreurApi(undefined)).toBeUndefined();
  });
});
