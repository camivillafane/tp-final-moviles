import { Asset } from "expo-asset";

const local = (modulo: number): string => Asset.fromModule(modulo).uri;

export const imagenesEspacio: Record<string, string[]> = {
  "espacio-01": [
    local(require("../../assets/espacios/espacio-futbol5-cancha1-01.jpg")),
    local(require("../../assets/espacios/espacio-futbol5-cancha1-02.jpg")),
    local(require("../../assets/espacios/espacio-futbol5-cancha1-03.jpg")),
  ],

  "espacio-03": [
    local(require("../../assets/espacios/espacio-basquet-cancha1-01.jpg")),
    local(require("../../assets/espacios/espacio-basquet-cancha1-02.jpg")),
    local(require("../../assets/espacios/espacio-basquet-cancha1-03.jpg")),
  ],

  "espacio-04": [
    local(require("../../assets/espacios/espacio-voley-cancha-01.jpg")),
    local(require("../../assets/espacios/espacio-voley-cancha-02.jpg")),
    local(require("../../assets/espacios/espacio-voley-cancha-03.jpg")),
  ],

  "espacio-05": [
    local(require("../../assets/espacios/espacio-natacion-pileta-01.jpg")),
    local(require("../../assets/espacios/espacio-natacion-pileta-02.jpg")),
    local(require("../../assets/espacios/espacio-natacion-pileta-03.jpg")),
  ],

  "espacio-07": [
    local(require("../../assets/espacios/espacio-futbol11-cancha1-01.jpg")),
    local(require("../../assets/espacios/espacio-futbol11-cancha1-02.jpg")),
    local(require("../../assets/espacios/espacio-futbol11-cancha1-03.jpg")),
  ],
};
