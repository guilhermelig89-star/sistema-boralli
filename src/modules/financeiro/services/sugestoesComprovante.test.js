import test from "node:test";
import assert from "node:assert/strict";
import { aplicarSugestoes, encontrarCategoria } from "./sugestoesComprovante.js";

const categorias = [{ nome: "Material" }, { nome: "Transporte" }];

test("baixa confiança preserva a categoria atual", () => {
  assert.equal(encontrarCategoria("Transporte", categorias, 0.4), null);
});

test("categoria só é sugerida quando há correspondência confiável", () => {
  assert.equal(encontrarCategoria("transpórte", categorias, 0.9), "Transporte");
  assert.equal(encontrarCategoria("Alimentação", categorias, 0.9), null);
});

test("preserva campos digitados e preenche apenas os encontrados", () => {
  const original = { data: "2026-08-10", valor: "10", descricao: "Digitado", categoria: "Material", formaPagamento: "Pix" };
  const leitura = { data: "2026-08-09", valor: "88.30", descricao: "OCR", categoriaSugerida: "Transporte", confianca: 0.95 };
  const resultado = aplicarSugestoes(original, leitura, new Set(["descricao", "valor"]), categorias);
  assert.deepEqual(resultado.despesa, {
    ...original,
    data: "2026-08-09",
    categoria: "Transporte",
  });
  assert.deepEqual(resultado.camposSugeridos, ["data", "categoria"]);
});

test("resposta vazia de falha de reconhecimento não altera formulário", () => {
  const original = { descricao: "Mantida", categoria: "Material" };
  assert.deepEqual(aplicarSugestoes(original, {}, new Set(), categorias).despesa, original);
});
