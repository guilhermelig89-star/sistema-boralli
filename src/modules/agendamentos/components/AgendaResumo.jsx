function AgendaResumo({ agendamentos }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const agendadosHoje = agendamentos.filter(
    (item) => item.data === hoje && item.status !== "cancelado"
  );
  const abertos = agendamentos.filter(
    (item) => item.status !== "finalizado" && item.status !== "cancelado"
  );
  const finalizados = agendamentos.filter((item) => item.status === "finalizado");
  const cancelados = agendamentos.filter((item) => item.status === "cancelado");

  return (
    <div className="card-grid agenda-resumo">
      <div className="card">
        <span>Hoje</span>
        <strong>{agendadosHoje.length}</strong>
        <p>Atendimentos na agenda</p>
      </div>

      <div className="card">
        <span>Em aberto</span>
        <strong>{abertos.length}</strong>
        <p>Aguardando finalização</p>
      </div>

      <div className="card">
        <span>Finalizados</span>
        <strong>{finalizados.length}</strong>
        <p>Atendimentos concluídos</p>
      </div>

      <div className="card">
        <span>Cancelados</span>
        <strong>{cancelados.length}</strong>
        <p>Não entram no consumo</p>
      </div>
    </div>
  );
}

export default AgendaResumo;
