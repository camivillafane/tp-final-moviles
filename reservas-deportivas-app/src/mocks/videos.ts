import { Asset } from "expo-asset";

const local = (modulo: number): string => Asset.fromModule(modulo).uri;

export const videosEspacio: Record<string, string> = {
  "espacio-01": local(
    require("../../assets/espacios/espacio-futbol5-cancha1.mp4")
  ),
  "espacio-03": local(
    require("../../assets/espacios/espacio-basquet-cancha.mp4")
  ),
};
