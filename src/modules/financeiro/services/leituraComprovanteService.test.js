import test from "node:test";
import assert from "node:assert/strict";
import { mensagemErroLeitura } from "./leituraComprovanteService.js";

test("traduz timeout sem perder a possibilidade de edição", () => {
  assert.match(mensagemErroLeitura({ code: "functions/deadline-exceeded" }), /demorou demais/i);
});

test("traduz indisponibilidade e orienta preenchimento manual", () => {
  assert.match(mensagemErroLeitura({ code: "functions/unavailable" }), /salvar manualmente/i);
});

test("trata falha genérica do OCR como arquivo possivelmente ilegível", () => {
  assert.match(mensagemErroLeitura(new Error("ocr failed")), /legível|manualmente/i);
});
