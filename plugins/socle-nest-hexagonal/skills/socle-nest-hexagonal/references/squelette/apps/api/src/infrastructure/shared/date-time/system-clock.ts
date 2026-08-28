import { Injectable } from "@nestjs/common";
import type { IClock } from "@domain/shared/spi/clock.spi";

@Injectable()
export class SystemClock implements IClock {
  now(): Date {
    return new Date();
  }
}
