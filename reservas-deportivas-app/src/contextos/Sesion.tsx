import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSesion } from "@/servicios/sesion";
import type { Usuario } from "@/tipos/usuario";

interface SesionContexto {
  usuario: Usuario | null;
  cerrarSesion: () => void;
}

const SesionContext = createContext<SesionContexto | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    getSesion().then(setUsuario).catch(() => setUsuario(null));
  }, []);

  const cerrarSesion = () => {
    setUsuario(null);
    // Integrante 4: acá va borrarToken().
  };

  return (
    <SesionContext.Provider value={{ usuario, cerrarSesion }}>
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion() {
  const contexto = useContext(SesionContext);

  if (!contexto) {
    throw new Error("useSesion tiene que usarse dentro de SesionProvider");
  }

  return contexto;
}
