import type { ReactNode } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";

type Status = "loading" | "ok" | "empty" | "error";

interface ScreenProps {
  status?: Status;
  errorMessage?: string;
  emptyMessage?: string;
  onRetry?: () => void;
  children: ReactNode;
}

/**
 * La coquille de tout écran de premier niveau : zone sûre, chargement, erreur
 * avec réessai, état vide — décidés UNE fois ici. Un écran de feature ne rend
 * que son contenu et passe son statut (apps/mobile/CLAUDE.md, Screens).
 */
export function Screen({
  status = "ok",
  errorMessage,
  emptyMessage,
  onRetry,
  children,
}: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={["top"]}>
      {status === "loading" && (
        <View className="flex-1 items-center justify-center" accessibilityRole="progressbar">
          <ActivityIndicator size="large" color="#0f62fe" />
        </View>
      )}
      {status === "error" && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-2 text-lg font-semibold text-neutral-900">
            Une erreur est survenue
          </Text>
          <Text className="mb-6 text-center text-base text-neutral-900/70">
            {errorMessage ?? "Vérifie ta connexion et réessaie."}
          </Text>
          {onRetry ? <Button label="Réessayer" onPress={onRetry} /> : null}
        </View>
      )}
      {status === "empty" && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base text-neutral-900/70">
            {emptyMessage ?? "Rien à afficher."}
          </Text>
        </View>
      )}
      {status === "ok" && (
        <ScrollView contentContainerClassName="px-4 py-4" keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
