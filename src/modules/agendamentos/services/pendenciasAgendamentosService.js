export function agendamentoEstaAtrasado(agendamento, agora = new Date()) {
  if (!agendamento || (agendamento.status !== "agendado" && agendamento.status)) return false;

  const dataHora = new Date(`${agendamento.data}T${agendamento.hora || "00:00"}:00`);
  return !Number.isNaN(dataHora.getTime()) && dataHora < agora;
}

export function filtrarPendenciasAgendamentos(agendamentos = [], agora = new Date()) {
  return agendamentos.filter((item) => {
    const dataHora = new Date(`${item.data}T${item.hora || "00:00"}:00`);

    if (agendamentoEstaAtrasado(item, agora)) return true;

    if (item.status === "em_atendimento") {
      const iniciouEm = item.atendimentoIniciadoEm ? new Date(item.atendimentoIniciadoEm) : dataHora;
      return (agora.getTime() - iniciouEm.getTime()) / (1000 * 60 * 60) >= 6;
    }

    return false;
  });
}
