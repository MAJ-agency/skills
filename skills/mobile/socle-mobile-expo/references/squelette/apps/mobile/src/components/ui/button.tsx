import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

type Variante = "primaire" | "secondaire";
type Taille = "md" | "sm";

interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
  libelle: string;
  variante?: Variante;
  taille?: Taille;
  enCours?: boolean;
}

const conteneur: Record<Variante, string> = {
  primaire: "bg-primary-500 active:bg-primary-600",
  secondaire: "bg-white border border-neutral-900/20 active:bg-neutral-50",
};
const texte: Record<Variante, string> = {
  primaire: "text-white",
  secondaire: "text-neutral-900",
};
const tailles: Record<Taille, string> = { md: "h-12 px-4", sm: "h-10 px-3" };

/**
 * Le bouton standard : cible tactile ≥ 44 pt, état accessible, chargement qui
 * remplace le libellé. Stylé en NativeWind — jamais un `StyleSheet`
 * (apps/mobile/CLAUDE.md, Components).
 */
export function Button({ libelle, variante = "primaire", taille = "md", enCours, disabled, ...rest }: ButtonProps) {
  const inactif = disabled || enCours;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityState={{ disabled: !!inactif, busy: !!enCours }}
      disabled={inactif}
      className={`flex-row items-center justify-center rounded-md ${conteneur[variante]} ${tailles[taille]} ${inactif ? "opacity-60" : ""}`}
      {...rest}
    >
      {enCours ? (
        <ActivityIndicator color={variante === "primaire" ? "#ffffff" : "#0f62fe"} />
      ) : (
        <Text className={`text-base font-semibold ${texte[variante]}`}>{libelle}</Text>
      )}
    </Pressable>
  );
}
