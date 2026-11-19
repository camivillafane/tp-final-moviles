export interface Paleta {
  verdePrincipal: string;
  verdeSecundario: string;
  verdeGrisaceo: string;
  fondo: string;
  blanco: string;
  borde: string;
  textoOscuro: string;
  magentaPrincipal: string;
  magentaSecundario: string;

  superficie: string;
  superficieAlt: string;
  bordeSuave: string;
  textoInvertido: string;
  verdeBoton: string;
  magentaBoton: string;
  botonDeshabilitado: string;
  textoDeshabilitado: string;
  badgeInactivoFondo: string;
  badgeInactivoTexto: string;
  exitoFondo: string;
  exitoTexto: string;
  avisoFondo: string;
  avisoTexto: string;
  errorFondo: string;
  errorTexto: string;
  overlay: string;
  esqueleto: string;
  estadoFijoFondo: string;
  estadoPasadoFondo: string;
}

export const paletaClara: Paleta = {
  verdePrincipal: "#486f56",
  verdeSecundario: "#6a8674",
  verdeGrisaceo: "#91a197",

  fondo: "#e9e9eb",
  blanco: "#ffffff",
  borde: "#bec4c1",
  textoOscuro: "#18181b",

  magentaPrincipal: "#7a2b6c",
  magentaSecundario: "#a38fa5",

  superficie: "#ffffff",
  superficieAlt: "#f4f5f4",
  bordeSuave: "#d8dcda",
  textoInvertido: "#ffffff",
  verdeBoton: "#486f56",
  magentaBoton: "#7a2b6c",
  botonDeshabilitado: "#c4b6c1",
  textoDeshabilitado: "#ffffff",
  badgeInactivoFondo: "#f3e1e1",
  badgeInactivoTexto: "#8a2f2f",
  exitoFondo: "#e8f5e9",
  exitoTexto: "#1f5130",
  avisoFondo: "#fff3e0",
  avisoTexto: "#6b3e00",
  errorFondo: "#fdecea",
  errorTexto: "#8a2f2f",
  overlay: "rgba(0, 0, 0, 0.45)",
  esqueleto: "#d6dad8",
  estadoFijoFondo: "#eee5f2",
  estadoPasadoFondo: "#eceff1",
};

export const paletaOscura: Paleta = {
  verdePrincipal: "#9ad3ae",
  verdeSecundario: "#b7d6c3",
  verdeGrisaceo: "#a9bbb0",

  fondo: "#0e1311",
  blanco: "#ffffff",
  borde: "#39483f",
  textoOscuro: "#f1f5f2",

  magentaPrincipal: "#efa3df",
  magentaSecundario: "#c79bbe",

  superficie: "#18201b",
  superficieAlt: "#202a24",
  bordeSuave: "#2c3831",
  textoInvertido: "#ffffff",
  verdeBoton: "#3f6b51",
  magentaBoton: "#8e347d",
  botonDeshabilitado: "#5a4b57",
  textoDeshabilitado: "#e6dde3",
  badgeInactivoFondo: "#3a2222",
  badgeInactivoTexto: "#f0b4b4",
  exitoFondo: "#17301f",
  exitoTexto: "#b7e4c3",
  avisoFondo: "#3a2b16",
  avisoTexto: "#f3d19b",
  errorFondo: "#3a1e1e",
  errorTexto: "#f3b4b4",
  overlay: "rgba(0, 0, 0, 0.65)",
  esqueleto: "#2a342e",
  estadoFijoFondo: "#2c2230",
  estadoPasadoFondo: "#242c27",
};
