function statusClasse(status) {
  if (status === "finalizado") return "badge-tipo badge-servico";
  if (status === "cancelado") return "badge-tipo badge-alerta";
  if (status === "em_atendimento") return "badge-tipo badge-atendimento-andamento";
  return "badge-tipo badge-combo";
}

function statusTexto(status) {
  if (status === "finalizado") return "Finalizado";
  if (status === "cancelado") return "Cancelado";
  if (status === "em_atendimento") return "Em atendimento";
  return "Agendado";
}

function AgendamentosTable({ agendamentos, carregando, onIniciar, onFinalizar, onCancelar, onEditar, onCorrigirConsumoPacote }) {
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
        agendamentos.map((agendamento) => {
          const encerrado = agendamento.status === "finalizado" || agendamento.status === "cancelado";
          const emAtendimento = agendamento.status === "em_atendimento";
          const podeCorrigirConsumoPacote =
            agendamento.status === "finalizado" &&
            Boolean(agendamento.pacoteClienteId) &&
            agendamento.pacoteConsumido !== true;

          return (
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
                <span className={statusClasse(agendamento.status)}>{statusTexto(agendamento.status)}</span>

                <button className="botao-editar" onClick={() => onEditar(agendamento)}>Editar</button>

                {!encerrado && !emAtendimento && (
                  <button
                    className="botao-editar"
                    onClick={() => onIniciar(agendamento.id)}
                  >
                    Iniciar
                  </button>
                )}

                {!encerrado && emAtendimento && (
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

                {!encerrado && (
                  <button
                    className="botao-desativar"
                    onClick={() => {
                      const confirmar = confirm("Cancelar este agendamento?");
                      if (confirmar) onCancelar(agendamento.id);
                    }}
                  >
                    Cancelar
                  </button>
                )}
                {podeCorrigirConsumoPacote && (
                  <button
                    className="botao-editar"
                    onClick={() => onCorrigirConsumoPacote?.(agendamento)}
                  >
                    Corrigir consumo do pacote
                  </button>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}

export default AgendamentosTable;
