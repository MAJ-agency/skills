import { Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { useEtatSante } from "@/features/sante/hooks/use-sante";
import { messageErreurApi } from "@/lib/api-error";

/**
 * Feature d'exemple — PLACEHOLDER. Elle montre la forme d'une feature
 * (api/ → hooks/ → components/, barrel index.ts) et la coquille `Screen` sur
 * le seul endpoint que l'API expose. Elle disparaît avec la première feature métier.
 */
export function SanteEcran() {
  const { data, error, isPending, refetch } = useEtatSante();
  const statut = isPending ? "chargement" : error ? "erreur" : "ok";

  return (
    <Screen
      statut={statut}
      messageErreur={error ? messageErreurApi(error, "L'API ne répond pas.") : undefined}
      onReessayer={() => void refetch()}
    >
      <View className="rounded-lg border border-neutral-900/10 bg-white p-6">
        <Text className="text-2xl font-semibold text-neutral-900">{{TITRE}}</Text>
        <Text className="mt-1 text-sm text-neutral-900/70">{{DESCRIPTION}}</Text>
        <Text className="mt-6 text-lg font-medium text-neutral-900" accessibilityRole="header">
          État de l&apos;API
        </Text>
        {data ? (
          <Text className="mt-2 text-success-500" accessibilityLiveRegion="polite">
            {data.service} — {data.status}
          </Text>
        ) : null}
        <View className="mt-4">
          <Button libelle="Réinterroger" variante="secondaire" taille="sm" onPress={() => void refetch()} />
        </View>
      </View>
    </Screen>
  );
}
