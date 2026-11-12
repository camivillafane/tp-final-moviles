import { createContext, useContext, useState, type ReactNode } from "react";
import { sesionMock } from "@/mocks/sesionUsuario";

interface FavoritosContexto {
  favoritos: string[];
  esFavorito: (espacioId: string) => boolean;
  cambiarFavorito: (espacioId: string) => void;
}

const FavoritosContext = createContext<FavoritosContexto | null>(null);

export function FavoritosProvider({ children }: { children: ReactNode }) {
  const [favoritos, setFavoritos] = useState<string[]>(
    sesionMock?.espaciosFavoritos ?? []
  );

  const esFavorito = (espacioId: string) => favoritos.includes(espacioId);

  const cambiarFavorito = (espacioId: string) => {
    setFavoritos((actuales) =>
      actuales.includes(espacioId)
        ? actuales.filter((id) => id !== espacioId)
        : [...actuales, espacioId]
    );
  };

  return (
    <FavoritosContext.Provider
      value={{ favoritos, esFavorito, cambiarFavorito }}
    >
      {children}
    </FavoritosContext.Provider>
  );
}

export function useFavoritos() {
  const contexto = useContext(FavoritosContext);

  if (!contexto) {
    throw new Error("useFavoritos tiene que usarse dentro de FavoritosProvider");
  }

  return contexto;
}
