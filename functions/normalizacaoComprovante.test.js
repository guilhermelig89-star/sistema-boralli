import test from "node:test";
import assert from "node:assert/strict";
import { extrairCampos, normalizarData, normalizarValor } from "./normalizacaoComprovante.js";

test("normaliza datas brasileiras válidas", () => {
  assert.equal(normalizarData("Pagamento em 9/08/2026"), "2026-08-09");
  assert.equal(normalizarData("31/02/2026"), null);
});

test("normaliza valores monetários brasileiros", () => {
  assert.equal(normalizarValor("R$ 1.234,56"), "1234.56");
  assert.equal(normalizarValor("Total 48,90"), "48.90");
});

test("devolve somente campos encontrados em respostas parciais", () => {
  const resultado = extrairCampos("COMPROVANTE PIX\nTOTAL: R$ 82,30", 0.91);
  assert.deepEqual(resultado, { valor: "82.30", formaPagamento: "Pix", confianca: 0.91 });
  assert.equal("descricao" in resultado, false);
});
