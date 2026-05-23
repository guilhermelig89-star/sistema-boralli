export function consumoEstaAtivo(consumo = {}) {
  return !(consumo.estornado === true || consumo.cancelado === true || consumo.valido === false || consumo.status === 'estornado' || consumo.status === 'cancelado' || consumo.removido === true);
}

export function buscarConsumoAtivoPorAgendamento(historicos = [], agendamentoId) {
  return historicos
    .filter((item) => item.agendamentoId === agendamentoId && consumoEstaAtivo(item))
    .sort((a, b) => (b.criadoEmTs || 0) - (a.criadoEmTs || 0))[0] || null;
}

export function recalcularPacotePorHistoricoAtivo(pacote = {}, historicos = []) {
  const ativos = historicos.filter(consumoEstaAtivo);
  const quantidadeTotal = Number(pacote.quantidadeTotal || 0);
  const quantidadeUtilizada = Math.min(quantidadeTotal, ativos.reduce((s, h) => s + Math.max(1, Number(h.quantidadeConsumida || 1)), 0));
  const saldoRestante = Math.max(0, quantidadeTotal - quantidadeUtilizada);
  const status = saldoRestante > 0 || ativos.length === 0 ? 'ativo' : 'esgotado';
  return { ativos, quantidadeUtilizada, saldoRestante, status };
}
