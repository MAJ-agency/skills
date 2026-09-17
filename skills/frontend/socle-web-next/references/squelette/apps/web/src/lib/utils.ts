import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusion de classes Tailwind sans conflit — la convention shadcn/ui. */
export function cn(...entrees: ClassValue[]): string {
  return twMerge(clsx(entrees));
}
