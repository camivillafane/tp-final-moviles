import axios from "axios";

export const cliente = axios.create({
    baseURL: "api.villaguay.gob.ar",
    timeout: 1000,
});