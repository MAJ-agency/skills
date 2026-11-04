import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

type Variant = "primary" | "secondary";
type Size = "md" | "sm";

interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const container: Record<Variant, string> = {
  primary: "bg-primary-500 active:bg-primary-600",
  secondary: "bg-white border border-neutral-900/20 active:bg-neutral-50",
};
const text: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-neutral-900",
};
const sizes: Record<Size, string> = { md: "h-12 px-4", sm: "h-10 px-3" };

/**
 * Le bouton standard : cible tactile ≥ 44 pt, état accessible, chargement qui
 * remplace le libellé. Stylé en NativeWind — jamais un `StyleSheet`
 * (apps/mobile/CLAUDE.md, Components).
 */
export function Button({
  label,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  ...rest
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      className={`flex-row items-center justify-center rounded-md ${container[variant]} ${sizes[size]} ${inactive ? "opacity-60" : ""}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#ffffff" : "#0f62fe"} />
      ) : (
        <Text className={`text-base font-semibold ${text[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
