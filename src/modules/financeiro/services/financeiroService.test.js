import assert from "node:assert/strict";
import test from "node:test";

import { aplicarFiltrosFinanceiros, prepararDespesaManual } from "./financeiroService.js";

test("mantém o fornecedor informado na despesa manual", () => {
  const despesa = prepararDespesaManual({
    valor: "125.90",
    fornecedor: "Distribuidora Bella",
  });

  assert.equal(despesa.fornecedor, "Distribuidora Bella");
});

test("permite pesquisar um movimento pelo fornecedor", () => {
  const movimentos = [{ id: "1", fornecedor: "Distribuidora Bella", status: "pago", origem: "despesa_manual" }];
  const filtros = { pesquisa: "bella", origem: "todos" };

  assert.deepEqual(aplicarFiltrosFinanceiros(movimentos, filtros), movimentos);
});
