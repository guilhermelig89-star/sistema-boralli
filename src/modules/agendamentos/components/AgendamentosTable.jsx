import { useEffect, useState } from "react";

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
  const [menuAberto, setMenuAberto] = useState(null);
  useEffect(() => {
    function fecharMenuAoClicarFora(evento) {
      if (!evento.target.closest(".menu-acoes-agendamento")) setMenuAberto(null);
    }

    function fecharMenuComEscape(evento) {
      if (evento.key === "Escape") setMenuAberto(null);
    }

    document.addEventListener("pointerdown", fecharMenuAoClicarFora);
    document.addEventListener("keydown", fecharMenuComEscape);
    return () => {
      document.removeEventListener("pointerdown", fecharMenuAoClicarFora);
      document.removeEventListener("keydown", fecharMenuComEscape);
    };
  }, []);

  function executarAcao(acao) {
    setMenuAberto(null);
    acao();
  }

  return (
    <div className="tabela-clientes">
      <div className="linha-agendamento cabecalho">
        <span>Horário</span>
        <span>Cliente</span>
        <span>Serviço</span>
        <span>Pagamento</span>
        <span>Status e ações</span>
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
                  <small>{agendamento.servicoDuracaoMinutos ? `${agendamento.servicoDuracaoMinutos} min` : "Horário marcado"}</small>
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
                <div className="acoes-agendamento">
                <span className={statusClasse(agendamento.status)}>{statusTexto(agendamento.status)}</span>

                <div className="menu-acoes-agendamento">
                  <button
                    type="button"
                    className="botao-abrir-acoes"
                    aria-expanded={menuAberto === agendamento.id}
                    aria-label={`Abrir ações de ${agendamento.clienteNome}`}
                    onClick={() => setMenuAberto((atual) => atual === agendamento.id ? null : agendamento.id)}
                  >
                    Ações
                  </button>
                  {menuAberto === agendamento.id && (
                  <div className="menu-acoes-conteudo">
                  <button className="botao-menu-acao" onClick={() => executarAcao(() => onEditar(agendamento))}>Editar</button>

                {!encerrado && !emAtendimento && (
                  <button
                    className="botao-menu-acao"
                    onClick={() => executarAcao(() => onIniciar(agendamento.id))}
                  >
                    Iniciar
                  </button>
                )}

                {!encerrado && emAtendimento && (
                  <button
                    className="botao-menu-acao"
                    onClick={() => {
                      const confirmar = confirm("Finalizar este atendimento?");
                      if (confirmar) executarAcao(() => onFinalizar(agendamento.id));
                    }}
                  >
                    Finalizar
                  </button>
                )}

                {!encerrado && (
                  <button
                    className="botao-menu-acao perigo"
                    onClick={() => {
                      const confirmar = confirm("Cancelar este agendamento?");
                      if (confirmar) executarAcao(() => onCancelar(agendamento.id));
                    }}
                  >
                    Cancelar
                  </button>
                )}
                {podeCorrigirConsumoPacote && (
                  <button
                    className="botao-menu-acao"
                    onClick={() => executarAcao(() => onCorrigirConsumoPacote?.(agendamento))}
                  >
                    Corrigir consumo do pacote
                  </button>
                )}
                  </div>
                  )}
                </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

export default AgendamentosTable;
