function AgendamentosTable({ agendamentos, carregando, onFinalizar }) {
  return (
    <div className="tabela-clientes">
      <div className="linha-agendamento cabecalho">
        <span>Data</span>
        <span>Cliente</span>
        <span>Serviço</span>
        <span>Pagamento</span>
        <span>Ações</span>
      </div>

      {carregando && (
        <div className="linha-agendamento">
          <span>Carregando agendamentos...</span>
        </div>
      )}

      {!carregando && agendamentos.length === 0 && (
        <div className="linha-agendamento">
          <span>Nenhum agendamento encontrado.</span>
        </div>
      )}

      {!carregando &&
        agendamentos.map((agendamento) => (
          <div className="linha-agendamento" key={agendamento.id}>
            <strong>
              {agendamento.data} {agendamento.hora}
            </strong>
            <span>{agendamento.clienteNome}</span>
            <span>{agendamento.servicoNome}</span>
            <span>
              {agendamento.pacoteClienteId
                ? `Pacote: ${agendamento.pacoteNome}`
                : `Avulso - ${Number(agendamento.valor || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}`}
            </span>
            <div className="acoes-cliente">
              {agendamento.status === "finalizado" ? (
                <span className="badge-tipo badge-servico">Finalizado</span>
              ) : (
                <button
                  className="botao-editar"
                  onClick={() => {
                    const confirmar = confirm("Finalizar este atendimento?");
                    if (confirmar) onFinalizar(agendamento.id);
                  }}
                >
                  Finalizar
                </button>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}

export default AgendamentosTable;
