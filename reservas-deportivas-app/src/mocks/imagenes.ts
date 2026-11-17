import { Asset } from "expo-asset";

const local = (modulo: number): string => Asset.fromModule(modulo).uri;

export const imagenesEspacio: Record<string, string[]> = {
  "espacio-01": [
    local(require("../../assets/espacios/fotos/espacio-futbol5-cancha1-01.jpg")),
    local(require("../../assets/espacios/fotos/espacio-futbol5-cancha1-02.jpg")),
    local(require("../../assets/espacios/fotos/espacio-futbol5-cancha1-03.jpg")),
  ],

  "espacio-02": [
    local(require("../../assets/espacios/fotos/espacio-futbol5-cancha2-02.jpg")),
    local(require("../../assets/espacios/fotos/espacio-futbol5-cancha2-01.jpg")),
    local(require("../../assets/espacios/fotos/espacio-futbol5-cancha2-03.jpg")),
  ],

  "espacio-03": [
    local(require("../../assets/espacios/fotos/espacio-basquet-cancha1-01.jpg")),
    local(require("../../assets/espacios/fotos/espacio-basquet-cancha1-02.jpg")),
    local(require("../../assets/espacios/fotos/espacio-basquet-cancha1-03.jpg")),
  ],

  "espacio-04": [
    local(require("../../assets/espacios/fotos/espacio-voley-cancha-01.jpg")),
    local(require("../../assets/espacios/fotos/espacio-voley-cancha-02.jpg")),
    local(require("../../assets/espacios/fotos/espacio-voley-cancha-03.jpg")),
  ],

  "espacio-06": [
    local(require("../../assets/espacios/fotos/espacio-gimnasio-01.jpg")),
    local(require("../../assets/espacios/fotos/espacio-gimnasio-02.jpg")),
    local(require("../../assets/espacios/fotos/espacio-gimnasio-03.jpg")),
  ],

  "espacio-07": [
    local(require("../../assets/espacios/fotos/espacio-futbol11-cancha1-01.jpg")),
    local(require("../../assets/espacios/fotos/espacio-futbol11-cancha1-02.jpg")),
    local(require("../../assets/espacios/fotos/espacio-futbol11-cancha1-03.jpg")),
  ],

  "espacio-08": [
    local(require("../../assets/espacios/fotos/espacio-tenis-cancha1-02.jpg")),
    local(require("../../assets/espacios/fotos/espacio-tenis-cancha1-01.jpg")),
    local(require("../../assets/espacios/fotos/espacio-tenis-cancha1-03.jpg")),
  ],

  "espacio-09": [
    local(require("../../assets/espacios/fotos/espacio-tenis-cancha2-01.jpg")),
    local(require("../../assets/espacios/fotos/espacio-tenis-cancha2-02.jpg")),
    local(require("../../assets/espacios/fotos/espacio-tenis-cancha2-03.jpg")),
  ],

  "espacio-12": [
    local(require("../../assets/espacios/fotos/espacio-basquet-cancha1-02.jpg")),
    local(require("../../assets/espacios/fotos/espacio-basquet-cancha1-01.jpg")),
    local(require("../../assets/espacios/fotos/espacio-basquet-cancha1-03.jpg")),
  ],

  "espacio-13": [
    local(require("../../assets/espacios/fotos/espacio-basquet-cancha1-03.jpg")),
    local(require("../../assets/espacios/fotos/espacio-basquet-cancha1-02.jpg")),
    local(require("../../assets/espacios/fotos/espacio-basquet-cancha1-01.jpg")),
  ],

  "espacio-14": [
    local(require("../../assets/espacios/fotos/espacio-voley-cancha-01.jpg")),
    local(require("../../assets/espacios/fotos/espacio-voley-cancha-02.jpg")),
    local(require("../../assets/espacios/fotos/espacio-voley-cancha-03.jpg")),
  ],
};
