import assert from "node:assert/strict";
import test from "node:test";

import { NAVIGATION_STORAGE_KEY, carregarTelaSalva, normalizarTela, salvarTela } from "./navigationState.js";
import { DEFAULT_SCREEN, SCREENS } from "./screens.js";

function criarStorage(valorInicial = null) {
  let valor = valorInicial;
  return {
    getItem(chave) { assert.equal(chave, NAVIGATION_STORAGE_KEY); return valor; },
    setItem(chave, novoValor) { assert.equal(chave, NAVIGATION_STORAGE_KEY); valor = novoValor; },
  };
}

test("normaliza telas desconhecidas para o painel", () => {
  assert.equal(normalizarTela("tela-removida"), DEFAULT_SCREEN);
  assert.equal(normalizarTela(SCREENS.CLIENTES), SCREENS.CLIENTES);
});

test("recupera a última tela válida sem acessar dados operacionais", () => {
  assert.equal(carregarTelaSalva(criarStorage(SCREENS.AGENDA)), SCREENS.AGENDA);
  assert.equal(carregarTelaSalva(criarStorage("inválida")), DEFAULT_SCREEN);
});

test("salva apenas valores de tela válidos", () => {
  const storage = criarStorage();
  assert.equal(salvarTela(SCREENS.FINANCEIRO, storage), SCREENS.FINANCEIRO);
  assert.equal(carregarTelaSalva(storage), SCREENS.FINANCEIRO);
  assert.equal(salvarTela("antiga", storage), DEFAULT_SCREEN);
  assert.equal(carregarTelaSalva(storage), DEFAULT_SCREEN);
});

test("mantém o painel disponível quando o armazenamento está bloqueado", () => {
  const storageComErro = {
    getItem() { throw new Error("bloqueado"); },
    setItem() { throw new Error("bloqueado"); },
  };
  assert.equal(carregarTelaSalva(storageComErro), DEFAULT_SCREEN);
  assert.equal(salvarTela(SCREENS.CLIENTES, storageComErro), SCREENS.CLIENTES);
});
