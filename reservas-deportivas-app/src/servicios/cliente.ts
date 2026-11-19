import axios from "axios";
import { SIMULAR, URL_API } from "./config";
import { ErrorServicio } from "./errores";
import { recuperarToken } from "./sesion";
import type {
  CodigoError,
  RespuestaError,
  RespuestaLista,
  RespuestaUno,
} from "@/tipos/api";

const http=axios.create({
  baseURL: URL_API,
  timeout:60000,
  headers:SIMULAR ? {"X-Simular": SIMULAR} : {},
});

if (__DEV__) {
  console.log("Base URL de la API:", URL_API ?? "NO CONFIGURADA");
}

http.interceptors.request.use(async (config) => {
  const token = await recuperarToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function traducir(error: unknown): ErrorServicio {
  if (error instanceof ErrorServicio) return error;

  if (axios.isAxiosError(error)) {
    
    const cuerpo = error.response?.data;

    if (cuerpo && typeof cuerpo === "object" && "error" in cuerpo) {
      const { codigo, mensaje } = (cuerpo as RespuestaError).error;
      return new ErrorServicio(codigo as CodigoError, mensaje);
    }

    if (error.code === "ECONNABORTED") {
      return new ErrorServicio("ERROR_RED" as CodigoError, "La conexión tardó demasiado. Probá nuevamente.");
    }

    if (!error.response) {
      return new ErrorServicio("ERROR_RED" as CodigoError, "No pudimos conectarnos. Revisá tu internet.");
    }

    return new ErrorServicio("ERROR_INTERNO" as CodigoError, "Ocurrió un error inesperado.");
  }

  return new ErrorServicio("ERROR_INTERNO" as CodigoError, "Ocurrió un error inesperado.");
}

export async function getUno<T>(
  url:string,
  params?: Record<string,unknown>
): Promise<T> {
    try{
      const {data}= await http.get<RespuestaUno<T>>(url,{params});
      return data.datos;
    } catch (error){
      throw traducir(error);
    }
  }

export async function getLista<T>(
  url:string,
  params?:Record<string,unknown>
): Promise<RespuestaLista<T>> {
  try {
    const {data}= await http.get<RespuestaLista<T>>(url,{params});
    return data;
  } catch(error){
    throw traducir(error);
  }
};

export async function post<T>(url:string,cuerpo?:unknown):Promise<T>{
  try {
    const {data}= await http.post<RespuestaUno<T>>(url,cuerpo);
    return data.datos;
  } catch (error) {
    throw traducir(error);
  }
}

export async function postLista<T>(
  url: string,
  cuerpo?: unknown
): Promise<RespuestaLista<T>> {
  try {
    const { data } = await http.post<RespuestaLista<T>>(url, cuerpo);
    return data;
  } catch (error) {
    throw traducir(error);
  }
}

export async function postFormulario<T>(
  url: string,
  formulario: FormData
): Promise<T> {
  try {
    const { data } = await http.post<RespuestaUno<T>>(url, formulario, {
      timeout: 120000,
    });
    return data.datos;
  } catch (error) {
    throw traducir(error);
  }
}

export async function put<T>(url:string): Promise<T>{
  try{
    const {data}=await http.put<RespuestaUno<T>>(url);
    return data.datos;
  } catch (error){
    throw traducir(error);
  }
}

export async function patch<T>(url: string, cuerpo: unknown): Promise<T> {
  try {
    const { data } = await http.patch<RespuestaUno<T>>(url, cuerpo);
    return data.datos;
  } catch (error) {
    throw traducir(error);
  }
}

export async function borrar(url:string):Promise<void>{
  try{
    await http.delete(url);
  } catch(error){
    throw traducir(error);
  }
}
