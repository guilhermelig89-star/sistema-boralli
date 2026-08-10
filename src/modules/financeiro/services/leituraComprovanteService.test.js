import test from "node:test";
import assert from "node:assert/strict";
import { mensagemErroLeitura } from "./leituraComprovanteService.js";

test("traduz timeout sem perder a possibilidade de edição", () => {
  assert.match(mensagemErroLeitura({ code: "functions/deadline-exceeded" }), /demorou demais/i);
});

test("traduz indisponibilidade e orienta preenchimento manual", () => {
  assert.match(mensagemErroLeitura({ code: "functions/unavailable" }), /salvar manualmente/i);
});

test("distingue serviço ainda não configurado de indisponibilidade temporária", () => {
  assert.match(mensagemErroLeitura({ code: "functions/failed-precondition" }), /não foi configurada/i);
});

test("explica quando a função de leitura ainda não foi publicada", () => {
  assert.match(mensagemErroLeitura({ code: "functions/not-found" }), /não foi publicada/i);
});

test("trata falha genérica do OCR como arquivo possivelmente ilegível", () => {
  assert.match(mensagemErroLeitura(new Error("ocr failed")), /legível|manualmente/i);
});
