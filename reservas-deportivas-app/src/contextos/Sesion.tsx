import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Usuario } from "@/tipos/usuario";
import {
  guardarSesion,
  recuperarSesion,
  eliminarSesion,
} from "@/servicios/sesion";
import { iniciarSesion as autenticarUsuario } from "@/servicios/autenticacion";

interface SesionContexto {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (email: string, clave: string) => Promise<void>;
  iniciarSesionConUsuario: (usuario: Usuario) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const SesionContext = createContext<SesionContexto | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarSesion = async () => {
      try {
        const usuarioGuardado = await recuperarSesion();
        setUsuario(usuarioGuardado);
      } catch (error) {
        console.error("Error al recuperar sesión:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarSesion();
  }, []);

  const iniciarSesion = async (email: string, clave: string) => {
    const usuarioAutenticado = await autenticarUsuario({ email, clave });
    await guardarSesion(usuarioAutenticado);
    setUsuario(usuarioAutenticado);
  };

  const iniciarSesionConUsuario = async (usuario: Usuario) => {
    await guardarSesion(usuario);
    setUsuario(usuario);
  };

  const cerrarSesion = async () => {
    await eliminarSesion();
    setUsuario(null);
  };

  return (
    <SesionContext.Provider
      value={{ usuario, cargando, iniciarSesion, iniciarSesionConUsuario, cerrarSesion }}
    >
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