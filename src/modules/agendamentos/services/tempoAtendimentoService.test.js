import assert from "node:assert/strict";
import test from "node:test";

import {
  calcularSugestaoDuracao,
  calcularTempoFinalizacao,
  obterHistoricoTempoServico,
} from "./tempoAtendimentoService.js";

const servico = { id: "servico-1", duracaoMinutos: 60 };

test("não usa finalização feita menos de 15 minutos após o início na inteligência", () => {
  const resultado = calcularTempoFinalizacao(
    {
      atendimentoIniciadoEm: "2026-09-09T10:00:00.000Z",
      tempoPrevistoMinutos: 60,
    },
    new Date("2026-09-09T10:01:00.000Z")
  );

  assert.equal(resultado.tempoRealMinutos, 1);
  assert.equal(resultado.tempoRealCalculado, true);
  assert.equal(resultado.tempoValidoParaSugestao, false);
});

test("ignora registros curtos, inclusive registros antigos sem a nova marcação", () => {
  const historico = obterHistoricoTempoServico(
    [
      { status: "finalizado", servicoId: "servico-1", tempoRealCalculado: true, tempoRealMinutos: 1 },
      { status: "finalizado", servicoId: "servico-1", tempoRealCalculado: true, tempoRealMinutos: 55 },
    ],
    "servico-1"
  );

  assert.deepEqual(historico.map((item) => item.tempoRealMinutos), [55]);
});

test("mantém o padrão do serviço mesmo quando existe ajuste inteligente salvo", () => {
  const sugestao = calcularSugestaoDuracao({
    clienteId: "cliente-1",
    servico,
    sugestoesTempo: [{
      ativo: true,
      tipo: "cliente_servico",
      clienteId: "cliente-1",
      servicoId: "servico-1",
      duracaoMinutos: 90,
    }],
  });

  assert.equal(sugestao.duracaoMinutos, 60);
  assert.equal(sugestao.origem, "padrao");
});

test("mantém o padrão do serviço mesmo com histórico suficiente para análise", () => {
  const agendamentos = Array.from({ length: 10 }, (_, indice) => ({
    id: `agendamento-${indice}`,
    clienteId: "cliente-1",
    servicoId: "servico-1",
    status: "finalizado",
    tempoRealCalculado: true,
    tempoRealMinutos: 90,
  }));

  const sugestao = calcularSugestaoDuracao({
    clienteId: "cliente-1",
    servico,
    agendamentos,
  });

  assert.equal(sugestao.duracaoMinutos, 60);
  assert.equal(sugestao.origem, "padrao");
  assert.equal(sugestao.quantidadeBase, 0);
});
