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

test("ignora ajuste salvo com duração curta e mantém o padrão do serviço", () => {
  const sugestao = calcularSugestaoDuracao({
    clienteId: "cliente-1",
    servico,
    sugestoesTempo: [{
      ativo: true,
      tipo: "cliente_servico",
      clienteId: "cliente-1",
      servicoId: "servico-1",
      duracaoMinutos: 1,
    }],
  });

  assert.equal(sugestao.duracaoMinutos, 60);
  assert.equal(sugestao.origem, "padrao");
});
