import assert from "node:assert/strict";
import test from "node:test";

import { prepararFechamentoFinanceiro } from "./fechamentoFinanceiroService.js";

test("registra o valor integral no Pix como pago", () => {
  const fechamento = prepararFechamentoFinanceiro({
    valorOriginal: 150,
    valorFinalManual: 150,
    pagamentos: [{ forma: "Pix", valor: 150 }],
  });

  assert.equal(fechamento.statusFinanceiro, "pago");
  assert.equal(fechamento.valorRecebido, 150);
  assert.equal(fechamento.valorPendente, 0);
  assert.equal(fechamento.formaPagamento, "Pix");
});

test("só registra pendência quando a forma selecionada é Pendente", () => {
  const fechamento = prepararFechamentoFinanceiro({
    valorOriginal: 150,
    valorFinalManual: 150,
    pagamentos: [{ forma: "Pendente", valor: 0 }],
  });

  assert.equal(fechamento.statusFinanceiro, "pendente");
  assert.equal(fechamento.valorRecebido, 0);
  assert.equal(fechamento.valorPendente, 150);
  assert.equal(fechamento.formaPagamento, "Pendente");
});
