import { DEFAULT_SCREEN, SCREENS } from "./screens.js";

export const NAVIGATION_STORAGE_KEY = "boralli:tela-atual";

const TELAS_VALIDAS = new Set(Object.values(SCREENS));

export function normalizarTela(tela) {
  return TELAS_VALIDAS.has(tela) ? tela : DEFAULT_SCREEN;
}

export function carregarTelaSalva(storage = globalThis.localStorage) {
  try {
    return normalizarTela(storage?.getItem(NAVIGATION_STORAGE_KEY));
  } catch {
    return DEFAULT_SCREEN;
  }
}

export function salvarTela(tela, storage = globalThis.localStorage) {
  const telaNormalizada = normalizarTela(tela);

  try {
    storage?.setItem(NAVIGATION_STORAGE_KEY, telaNormalizada);
  } catch {
    // A navegação continua funcionando mesmo com armazenamento indisponível.
  }

  return telaNormalizada;
}
