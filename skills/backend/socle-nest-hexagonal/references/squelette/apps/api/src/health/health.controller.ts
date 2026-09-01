import { Controller, Get } from "@nestjs/common";

/**
 * Sonde de vie — route délibérément anonyme (l'hébergeur l'appelle sans
 * session). Le jour où les gardes globales existeront, elle portera `@Public()`,
 * et tout nouveau `@Public()` sera un point de revue.
 *
 * Elle ne dit RIEN de l'état interne : ni version, ni base, ni dépendances.
 * Une sonde bavarde est une surface de reconnaissance.
 */
@Controller("health")
export class HealthController {
  @Get()
  check(): { status: string; service: string } {
    return { status: "ok", service: "{{PROJET}}-api" };
  }
}
