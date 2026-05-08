import assert from "node:assert/strict";
import test from "node:test";

import {
  calcularSaldoPacote,
  calcularSaldoServicoPacote,
  consumirServicoDoPacote,
  montarPacoteCliente,
} from "./pacotesDomain.js";

test("monta pacote de combo com saldo separado por serviço", () => {
  const pacote = montarPacoteCliente({
    clienteId: "cliente-1",
    clienteNome: "Maria",
    comboId: "combo-1",
    comboNome: "2 mãos + 2 pés",
    nome: "2 mãos + 2 pés",
    itens: [
      { servicoId: "mao", servicoNome: "Mão", quantidade: 2 },
      { servicoId: "pe", servicoNome: "Pé", quantidade: 2 },
    ],
  });

  assert.equal(pacote.quantidadeTotal, 4);
  assert.equal(calcularSaldoPacote(pacote), 4);
  assert.equal(calcularSaldoServicoPacote(pacote, "mao"), 2);
  assert.equal(calcularSaldoServicoPacote(pacote, "pe"), 2);
});

test("consome apenas o item do serviço agendado", () => {
  const pacote = montarPacoteCliente({
    clienteId: "cliente-1",
    clienteNome: "Maria",
    comboId: "combo-1",
    comboNome: "2 mãos + 2 pés",
    nome: "2 mãos + 2 pés",
    itens: [
      { servicoId: "mao", servicoNome: "Mão", quantidade: 2 },
      { servicoId: "pe", servicoNome: "Pé", quantidade: 2 },
    ],
  });

  const resultado = consumirServicoDoPacote(pacote, "mao");
  const pacoteAtualizado = { ...pacote, ...resultado.atualizacao };

  assert.equal(resultado.consumoPacote.servicoNome, "Mão");
  assert.equal(calcularSaldoServicoPacote(pacoteAtualizado, "mao"), 1);
  assert.equal(calcularSaldoServicoPacote(pacoteAtualizado, "pe"), 2);
  assert.equal(calcularSaldoPacote(pacoteAtualizado), 3);
});

test("impede consumo de serviço sem saldo no combo", () => {
  const pacote = montarPacoteCliente({
    clienteId: "cliente-1",
    clienteNome: "Maria",
    comboId: "combo-1",
    comboNome: "2 mãos",
    nome: "2 mãos",
    itens: [{ servicoId: "mao", servicoNome: "Mão", quantidade: 2 }],
  });

  assert.throws(() => consumirServicoDoPacote(pacote, "pe"), /não possui saldo/);
});

test("mantém compatibilidade com pacote antigo de um serviço", () => {
  const pacoteAntigo = {
    id: "pacote-antigo",
    clienteId: "cliente-1",
    clienteNome: "Maria",
    servicoId: "mao",
    servicoNome: "Mão",
    nome: "4 mãos",
    quantidadeTotal: 4,
    quantidadeUtilizada: 1,
    saldoRestante: 3,
    status: "ativo",
  };

  const resultado = consumirServicoDoPacote(pacoteAntigo, "mao");

  assert.equal(resultado.atualizacao.quantidadeUtilizada, 2);
  assert.equal(resultado.atualizacao.saldoRestante, 2);
});
