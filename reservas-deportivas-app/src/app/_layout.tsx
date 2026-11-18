import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { FavoritosProvider } from "@/contextos/Favoritos";
import { SesionProvider } from "@/contextos/Sesion";
import { TemaProvider, usePaleta, useTema } from "@/contextos/Tema";
import { inicializarBaseDeDatos } from "@/servicios/dbServicios";

function Navegacion() {
  const paleta = usePaleta();
  const { modo } = useTema();

  return (
    <>
      <StatusBar style={modo === "oscuro" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: paleta.fondo },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    inicializarBaseDeDatos().catch((error) => {
      console.error("Error al inicializar SQLite:", error);
    });
  }, []);

  return (
    <TemaProvider>
      <SesionProvider>
        <FavoritosProvider>
          <Navegacion />
        </FavoritosProvider>
      </SesionProvider>
    </TemaProvider>
  );
}
