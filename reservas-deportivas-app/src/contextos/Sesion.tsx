import { createContext, useContext, useState, type ReactNode } from "react";
import { sesionMock } from "@/mocks/sesionUsuario";
import { Usuario } from "@/tipos/usuario";

interface SesionContexto {
  usuario: Usuario | null;
  cerrarSesion: () => void;
}

const SesionContext = createContext<SesionContexto | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(sesionMock);

  const cerrarSesion = () => setUsuario(null);

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
