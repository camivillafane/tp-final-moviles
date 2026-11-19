import { Asset } from "expo-asset";

const local = (modulo: number): string => Asset.fromModule(modulo).uri;

export const videosEspacio: Record<string, string> = {
  "espacio-01": local(
    require("../../assets/espacios/videos/espacio-futbol5-cancha1.mp4")
  ),
  "espacio-02": local(
    require("../../assets/espacios/videos/espacio-futbol5-cancha2.mp4")
  ),
  "espacio-03": local(
    require("../../assets/espacios/videos/espacio-basquet-cancha.mp4")
  ),

  "espacio-04": local(
    require("../../assets/espacios/videos/espacio-voley-cancha.mp4")
  ),

  "espacio-06": local(
    require("../../assets/espacios/videos/espacio-gimnasio.mp4")
  ),

  "espacio-07": local(
    require("../../assets/espacios/videos/espacio-futbol11.mp4")
  ),

  "espacio-08": local(
    require("../../assets/espacios/videos/espacio-tenis-cancha1.mp4")
  ),

  "espacio-09": local(
    require("../../assets/espacios/videos/espacio-tenis-cancha2.mp4")
  ),

  "espacio-12": local(
    require("../../assets/espacios/videos/espacio-basquet-cancha.mp4")
  ),

  "espacio-13": local(
    require("../../assets/espacios/videos/espacio-basquet-cancha.mp4")
  ),

  "espacio-14": local(
    require("../../assets/espacios/videos/espacio-voley-cancha.mp4")
  ),
};
