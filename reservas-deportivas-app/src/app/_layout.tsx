import { Stack } from "expo-router";
import { FavoritosProvider } from "@/contextos/Favoritos";
import { SesionProvider } from "@/contextos/Sesion";

export default function RootLayout() {
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
