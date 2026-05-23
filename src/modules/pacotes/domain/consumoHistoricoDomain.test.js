import assert from 'node:assert/strict';
import test from 'node:test';
import { buscarConsumoAtivoPorAgendamento, consumoEstaAtivo, recalcularPacotePorHistoricoAtivo } from './consumoHistoricoDomain.js';

const pacoteBase = { quantidadeTotal: 2 };

test('finalizar: considera consumo ativo no recálculo', () => {
  const r = recalcularPacotePorHistoricoAtivo(pacoteBase, [{ quantidadeConsumida: 1 }]);
  assert.equal(r.quantidadeUtilizada, 1);
  assert.equal(r.saldoRestante, 1);
});

test('cancelar: ignora consumo cancelado', () => {
  const r = recalcularPacotePorHistoricoAtivo(pacoteBase, [{ quantidadeConsumida: 1, cancelado: true }]);
  assert.equal(r.quantidadeUtilizada, 0);
  assert.equal(r.status, 'ativo');
});

test('estornar: ignora consumo estornado', () => {
  const r = recalcularPacotePorHistoricoAtivo(pacoteBase, [{ quantidadeConsumida: 1, estornado: true }]);
  assert.equal(r.quantidadeUtilizada, 0);
});

test('reativar: volta a contar quando registro está ativo', () => {
  assert.equal(consumoEstaAtivo({ estornado: true }), false);
  assert.equal(consumoEstaAtivo({ estornado: false, cancelado: false }), true);
});

test('duplicidade: busca apenas consumo ativo mais recente do agendamento', () => {
  const h = [
    { id: '1', agendamentoId: 'a1', cancelado: true, criadoEmTs: 1 },
    { id: '2', agendamentoId: 'a1', criadoEmTs: 2 },
    { id: '3', agendamentoId: 'a1', criadoEmTs: 3 },
  ];
  const ativo = buscarConsumoAtivoPorAgendamento(h, 'a1');
  assert.equal(ativo.id, '3');
});

test('cancelamento após finalização manual: impede esgotado sem consumo ativo', () => {
  const r = recalcularPacotePorHistoricoAtivo({ quantidadeTotal: 1 }, [{ quantidadeConsumida: 1, estornado: true }]);
  assert.equal(r.saldoRestante, 1);
  assert.equal(r.status, 'ativo');
});
