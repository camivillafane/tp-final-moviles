import { Asset } from "expo-asset";

const local = (modulo: number): string => Asset.fromModule(modulo).uri;

export const videosEspacio: Record<string, string> = {
  "espacio-01": local(
    require("../../assets/espacios/videos/espacio-futbol5-cancha1.mp4")
  ),
  //"espacio-02": local(
    //require("../../assets/espacios/videos/espacio-futbol5-cancha2.mp4")
  //),
  "espacio-03": local(
    require("../../assets/espacios/videos/espacio-basquet-cancha.mp4")
  ),

  "espacio-04": local(
    require("../../assets/espacios/videos/espacio-voley-cancha.mp4")
  ),

  "espacio-05": local(
    require("../../assets/espacios/videos/espacio-pileta.mp4")
  ),

  "espacio-07": local(
    require("../../assets/espacios/videos/espacio-futbol11.mp4")
  ),

  //"espacio-08": local(
    //require("../../assets/espacios/videos/espacio-tenis-cancha1.mp4")
  //),

  "espacio-09": local(
    require("../../assets/espacios/videos/espacio-tenis-cancha2.mp4")
  ),

  "espacio-10": local(
    require("../../assets/espacios/videos/espacio-padel.mp4")
  ),

  "espacio-11": local(
    require("../../assets/espacios/videos/espacio-atletismo.mp4")
  ),
};
