import React, { useEffect, useState} from "react";
import { Stack } from "expo-router";
import { FavoritosProvider } from "@/contextos/Favoritos";
import { SesionProvider } from "@/contextos/Sesion";
import { inicializarBaseDeDatos } from "@/servicios/dbServicios";
import { crearEncargadoDePrueba } from "@/servicios/autenticacion";


export default function RootLayout() {
  const [dbLista, setDbLista] = useState(false);

useEffect(() => {
  inicializarBaseDeDatos()
    .then(() => crearEncargadoDePrueba())
    .then(() => setDbLista(true))
    .catch((error) =>
      console.error("Error al inicializar SQLite:", error)
    );
}, []);

if (!dbLista) {
  return null;
}

  return (
    <SesionProvider>
      <FavoritosProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#e9e9eb" },
          }}
        />
      </FavoritosProvider>
    </SesionProvider>
  );
}