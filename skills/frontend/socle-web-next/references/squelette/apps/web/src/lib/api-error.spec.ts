import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { apiErrorCode, apiErrorMessage, readApiError } from "./api-error";

function axiosError(data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("refus", "ERR_BAD_REQUEST", config, undefined, {
    data,
    status: 400,
    statusText: "Bad Request",
    headers: {},
    config,
  });
}

describe("readApiError", () => {
  it("lit un corps conforme au contrat ErrorDto", () => {
    const e = axiosError({ code: "REQUEST_NOT_FOUND", message: "Vérifie l'identifiant." });
    expect(readApiError(e)).toEqual({
      code: "REQUEST_NOT_FOUND",
      message: "Vérifie l'identifiant.",
    });
    expect(apiErrorCode(e)).toBe("REQUEST_NOT_FOUND");
    expect(apiErrorMessage(e, "repli")).toBe("Vérifie l'identifiant.");
  });

  it("ignore un corps qui n'est pas un ErrorDto", () => {
    expect(readApiError(axiosError({ statusCode: 500 }))).toBeUndefined();
    expect(apiErrorMessage(axiosError("html"), "repli")).toBe("repli");
  });

  it("ignore une erreur qui ne vient pas d'axios", () => {
    expect(readApiError(new Error("réseau"))).toBeUndefined();
    expect(apiErrorCode(undefined)).toBeUndefined();
  });
});
