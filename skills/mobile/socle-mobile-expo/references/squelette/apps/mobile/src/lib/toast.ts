import { Alert } from "react-native";

/**
 * Retour utilisateur minimal, sans module natif : `Alert` fonctionne dans Expo
 * Go comme dans un build. Le jour où un vrai toast natif est voulu (burnt,
 * sonner-native…), il exige un dev client : ce fichier reste la seule API à
 * changer.
 */
export const toast = {
  succes(message: string): void {
    Alert.alert("OK", message);
  },
  erreur(message: string): void {
    Alert.alert("Erreur", message);
  },
};
