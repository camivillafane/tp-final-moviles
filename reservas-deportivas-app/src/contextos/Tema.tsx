import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as SystemUI from "expo-system-ui";
import Storage from "expo-sqlite/kv-store";

import { paletaClara, paletaOscura, type Paleta } from "@/constantes/colores";

export type ModoTema = "claro" | "oscuro";

const CLAVE_TEMA = "tema_preferido";

interface TemaContexto {
  modo: ModoTema;
  paleta: Paleta;
  cambiarModo: (modo: ModoTema) => Promise<void>;
  alternarModo: () => Promise<void>;
}

const TemaContext = createContext<TemaContexto | null>(null);

export function TemaProvider({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<ModoTema>("claro");

  useEffect(() => {
    let activo = true;

    Storage.getItemAsync(CLAVE_TEMA)
      .then((guardado) => {
        if (activo && (guardado === "claro" || guardado === "oscuro")) {
          setModo(guardado);
        }
      })
      .catch((error) => {
        console.error("No se pudo leer el tema guardado:", error);
      });

    return () => {
      activo = false;
    };
  }, []);

  const paleta = modo === "oscuro" ? paletaOscura : paletaClara;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(paleta.fondo).catch(() => {
      // El color de fondo del sistema es solo una mejora visual.
    });
  }, [paleta.fondo]);

  const cambiarModo = useCallback(async (nuevoModo: ModoTema) => {
    setModo(nuevoModo);

    try {
      await Storage.setItemAsync(CLAVE_TEMA, nuevoModo);
    } catch (error) {
      console.error("No se pudo guardar el tema elegido:", error);
    }
  }, []);

  const alternarModo = useCallback(async () => {
    await cambiarModo(modo === "claro" ? "oscuro" : "claro");
  }, [cambiarModo, modo]);

  const valor = useMemo(
    () => ({ modo, paleta, cambiarModo, alternarModo }),
    [alternarModo, cambiarModo, modo, paleta]
  );

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

export function useTema(): TemaContexto {
  const contexto = useContext(TemaContext);

  if (!contexto) {
    throw new Error("useTema tiene que usarse dentro de TemaProvider");
  }

  return contexto;
}

export function usePaleta(): Paleta {
  return useTema().paleta;
}
