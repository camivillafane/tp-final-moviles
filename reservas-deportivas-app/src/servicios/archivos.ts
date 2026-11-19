import { File } from "expo-file-system";

import type { ArchivoSubido } from "@/tipos/api";
import { postFormulario } from "./cliente";

const MB = 1024 * 1024;

export const LIMITE_IMAGEN_BYTES = 5 * MB;
export const LIMITE_VIDEO_BYTES = 30 * MB;

const MIMES_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
const MIMES_VIDEO = ["video/mp4"];

export type TipoArchivoSeleccionado = "imagen" | "video";

export interface ArchivoSeleccionado {
  uri: string;
  nombre: string;
  mimeType: string;
  tamano: number;
}

function mimePorExtension(nombre: string): string {
  const extension = nombre.split(".").pop()?.toLowerCase() ?? "";

  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "mp4":
      return "video/mp4";
    default:
      return "";
  }
}

export function tamanoDeArchivo(
  uri: string,
  tamanoReportado?: number | null
): number {
  if (typeof tamanoReportado === "number" && tamanoReportado > 0) {
    return tamanoReportado;
  }

  try {
    return new File(uri).size;
  } catch {
    return 0;
  }
}

export function validarArchivoSeleccionado(
  archivo: ArchivoSeleccionado,
  tipo: TipoArchivoSeleccionado
): string | null {
  const limite = tipo === "imagen" ? LIMITE_IMAGEN_BYTES : LIMITE_VIDEO_BYTES;

  if (archivo.tamano > limite) {
    return `"${archivo.nombre}" supera el máximo de ${limite / MB} MB.`;
  }

  const permitidos = tipo === "imagen" ? MIMES_IMAGEN : MIMES_VIDEO;
  const mime = archivo.mimeType || mimePorExtension(archivo.nombre);

  if (!permitidos.includes(mime)) {
    return tipo === "imagen"
      ? `"${archivo.nombre}" no es una imagen JPEG, PNG o WebP.`
      : `"${archivo.nombre}" no es un video MP4.`;
  }

  return null;
}

export function subirArchivo(
  archivo: ArchivoSeleccionado
): Promise<ArchivoSubido> {
  const formulario = new FormData();

  formulario.append(
    "archivo",
    {
      uri: archivo.uri,
      name: archivo.nombre,
      type: archivo.mimeType,
    } as unknown as Blob
  );

  return postFormulario<ArchivoSubido>("/archivos", formulario);
}
