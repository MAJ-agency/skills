import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Primitive shadcn/ui « vendored » : le composant vit dans le dépôt, il se lit
 * et se modifie comme du code à nous. Toute nouvelle primitive suit cette forme
 * (variants via cva, classes fusionnées via cn) — jamais une autre bibliothèque
 * de composants (apps/web/CLAUDE.md, Components).
 */
const variantesBouton = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variante: {
        primaire: "bg-primary-500 text-white hover:bg-primary-600",
        secondaire: "border border-neutral-900/20 bg-white hover:bg-neutral-50",
      },
      taille: {
        md: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
      },
    },
    defaultVariants: { variante: "primaire", taille: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof variantesBouton> {}

export function Button({ className, variante, taille, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(variantesBouton({ variante, taille }), className)} {...props} />;
}
