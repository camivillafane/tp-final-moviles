import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Sesion as SesionApi } from "@/tipos/api";
import type { Usuario } from "@/tipos/usuario";
import {
  guardarSesion,
  recuperarSesion,
  eliminarSesion,
  guardarToken,
  recuperarToken,
  recuperarTokenBiometrico,
  eliminarToken,
  actualizarCredencialesBiometricas,
} from "@/servicios/sesion";
import {
  iniciarSesion as autenticarUsuario,
  registrarUsuario as registrarUsuarioApi,
  type DatosRegistro,
} from "@/servicios/autenticacion";
import { getUno } from "@/servicios/cliente";

interface SesionContexto {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (email: string, clave: string) => Promise<void>;
  registrarUsuario: (datos: DatosRegistro) => Promise<void>;
  iniciarSesionConUsuario: (usuario: Usuario) => Promise<void>;
  actualizarUsuario: () => Promise<void>;
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
        const token = await recuperarToken();

        if (usuarioGuardado && token) {
          setUsuario(usuarioGuardado);
        } else if (usuarioGuardado) {
          await eliminarSesion();
        }
      } catch (error) {
        console.error("Error al recuperar sesión:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarSesion();
  }, []);

  const completarInicioSesion = async (sesion: SesionApi) => {
    await guardarToken(sesion.token);
    await guardarSesion(sesion.usuario);
    await actualizarCredencialesBiometricas(sesion.token, sesion.usuario);
    setUsuario(sesion.usuario);
  };

  const iniciarSesion = async (email: string, clave: string) => {
    const sesion = await autenticarUsuario({ email, clave });
    await completarInicioSesion(sesion);
  };

  const registrarUsuario = async (datos: DatosRegistro) => {
    const sesion = await registrarUsuarioApi(datos);
    await completarInicioSesion(sesion);
  };

  const iniciarSesionConUsuario = async (usuario: Usuario) => {
    const token = await recuperarTokenBiometrico();

    if (!token) {
      throw new Error("Iniciá sesión con tu correo y contraseña para reactivar el acceso biométrico.");
    }

    await guardarToken(token);

    try {
      const usuarioAutenticado = await getUno<Usuario>("/yo");

      if (usuarioAutenticado.id !== usuario.id) {
        throw new Error("La sesión biométrica no coincide con esta cuenta.");
      }

      await guardarSesion(usuarioAutenticado);
      setUsuario(usuarioAutenticado);
    } catch (error) {
      await eliminarToken();
      throw error;
    }
  };

  const actualizarUsuario = useCallback(async () => {
    const token = await recuperarToken();
    if (!token) throw new Error("La sesión ya no está activa.");

    const usuarioActualizado = await getUno<Usuario>("/yo");
    await guardarSesion(usuarioActualizado);
    await actualizarCredencialesBiometricas(token, usuarioActualizado);
    setUsuario(usuarioActualizado);
  }, []);

  const cerrarSesion = async () => {
    await eliminarSesion();
    await eliminarToken();
    setUsuario(null);
  };

  return (
    <SesionContext.Provider
      value={{
        usuario,
        cargando,
        iniciarSesion,
        registrarUsuario,
        iniciarSesionConUsuario,
        actualizarUsuario,
        cerrarSesion,
      }}
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
