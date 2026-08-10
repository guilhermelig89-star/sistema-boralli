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

test("ordena os movimentos da data mais recente para a mais antiga", () => {
  const movimentos = [
    { id: "1", data: "2026-08-10", origem: "despesa_manual" },
    { id: "2", data: "2026-08-07", origem: "despesa_manual" },
    { id: "3", data: "2026-08-10", origem: "despesa_manual" },
    { id: "4", data: "2026-08-01", origem: "despesa_manual" },
  ];

  const resultado = aplicarFiltrosFinanceiros(movimentos, { pesquisa: "", origem: "todos" });

  assert.deepEqual(resultado.map((movimento) => movimento.id), ["3", "1", "2", "4"]);
  assert.deepEqual(movimentos.map((movimento) => movimento.id), ["1", "2", "3", "4"]);
});
