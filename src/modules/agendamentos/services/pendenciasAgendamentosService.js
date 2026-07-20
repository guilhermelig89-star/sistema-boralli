export function filtrarPendenciasAgendamentos(agendamentos = [], agora = new Date()) {
  return agendamentos.filter((item) => {
    const dataHora = new Date(`${item.data}T${item.hora || "00:00"}:00`);

    if (item.status === "agendado" && dataHora < agora) return true;

    if (item.status === "em_atendimento") {
      const iniciouEm = item.atendimentoIniciadoEm ? new Date(item.atendimentoIniciadoEm) : dataHora;
      return (agora.getTime() - iniciouEm.getTime()) / (1000 * 60 * 60) >= 6;
    }

    return false;
  });
}
