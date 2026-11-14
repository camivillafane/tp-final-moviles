import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { agregarFavorito, listarFavoritos, quitarFavorito } from "@/servicios/favoritos";
import { useSesion } from "./Sesion";

interface FavoritosContexto {
  favoritos: string[];
  esFavorito: (espacioId: string) => boolean;
  cambiarFavorito: (espacioId: string) => void;
}

const FavoritosContext = createContext<FavoritosContexto | null>(null);

export function FavoritosProvider({ children }: { children: ReactNode }) {
  const { usuario } = useSesion();
  const usuarioId = usuario?.id;
  const [favoritos, setFavoritos] = useState<string[]>([]);

    useEffect(() => {
    if (!usuarioId) return;

    listarFavoritos(usuarioId)
      .then(({ datos }) => setFavoritos(datos.map((espacio) => espacio.id)))
      .catch(() => setFavoritos([]));
  }, [usuarioId]);

  const favoritosVisibles = usuarioId ? favoritos : [];

  const esFavorito = (espacioId: string) =>
    favoritosVisibles.includes(espacioId);

  const cambiarFavorito = (espacioId: string) => {
  if (!usuarioId) return;

  const yaEstaba = favoritos.includes(espacioId);

    setFavoritos((actuales) =>
      yaEstaba
        ? actuales.filter((id) => id !== espacioId)
        : [...actuales, espacioId]
    );

    const accion = yaEstaba ? quitarFavorito : agregarFavorito;

    accion(usuarioId, espacioId).catch(() => {
      setFavoritos((actuales) =>
        yaEstaba
          ? [...actuales, espacioId]
          : actuales.filter((id) => id !== espacioId)
      );
    });
  };

  return (
    <FavoritosContext.Provider value={{ favoritos: favoritosVisibles, esFavorito, cambiarFavorito }}>
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
