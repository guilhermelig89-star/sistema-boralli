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

function formatarData(data) {
  if (!data) return "Data não informada";
  const hoje = new Date();
  const dataLocal = new Date(`${data}T12:00:00`);
  const formatarDataISO = (valor) => {
    const ano = valor.getFullYear();
    const mes = String(valor.getMonth() + 1).padStart(2, "0");
    const dia = String(valor.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  };
  const hojeTexto = formatarDataISO(hoje);
  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);
  const prefixo = data === hojeTexto ? "Hoje" : data === formatarDataISO(amanha) ? "Amanhã" : "";
  const texto = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(dataLocal);
  return prefixo ? `${prefixo} · ${texto}` : texto;
}

function AgendamentosTable({ agendamentos, carregando, onIniciar, onFinalizar, onCancelar, onEditar, onCorrigirConsumoPacote }) {
  return (
    <div className="tabela-clientes">
      <div className="linha-agendamento cabecalho">
        <span>Horário</span>
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
        agendamentos.map((agendamento, indice) => {
          const encerrado = agendamento.status === "finalizado" || agendamento.status === "cancelado";
          const emAtendimento = agendamento.status === "em_atendimento";
          const podeCorrigirConsumoPacote =
            agendamento.status === "finalizado" &&
            Boolean(agendamento.pacoteClienteId) &&
            agendamento.pacoteConsumido !== true;

          const novaData = indice === 0 || agendamentos[indice - 1]?.data !== agendamento.data;

          return (
            <div className="grupo-dia-agenda" key={agendamento.id}>
              {novaData && <h3 className="divisor-data-agenda">{formatarData(agendamento.data)}</h3>}
              <div className={`linha-agendamento linha-status-${agendamento.status}`}>
                <div className="horario-agendamento">
                  <strong>{agendamento.hora || "--:--"}</strong>
                  <small>{agendamento.duracaoMinutos ? `${agendamento.duracaoMinutos} min` : "Horário marcado"}</small>
                </div>
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
            </div>
          );
        })}
    </div>
  );
}

export default AgendamentosTable;
