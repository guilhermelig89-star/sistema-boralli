import { useMemo } from "react";

import { useAgendamentos } from "../agendamentos/hooks/useAgendamentos";
import { usePacotesClientes } from "../pacotes/hooks/usePacotesClientes";
import "./atendimento.css";

function obterHoje() {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarData(data) {
  if (!data) return "";

  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function statusTexto(status) {
  if (status === "em_atendimento") return "Em atendimento";
  if (status === "finalizado") return "Finalizado";
  if (status === "cancelado") return "Cancelado";
  return "Agendado";
}

function statusClasse(status) {
  if (status === "em_atendimento") return "badge-tipo badge-atendimento-andamento";
  if (status === "finalizado") return "badge-tipo badge-servico";
  if (status === "cancelado") return "badge-tipo badge-alerta";
  return "badge-tipo badge-combo";
}

function pagamentoTexto(agendamento) {
  if (agendamento.pacoteClienteId) {
    return `Pacote: ${agendamento.pacoteNome || "pacote do cliente"}`;
  }

  return `Avulso - ${formatarMoeda(agendamento.valor)}`;
}

function AtendimentoPage() {
  const {
    agendamentos,
    carregando,
    erro,
    iniciarAtendimento,
    finalizarAtendimento,
    cancelarAtendimento,
  } = useAgendamentos();
  const { pacotes, calcularSaldoServicoPacote } = usePacotesClientes();
  const hoje = obterHoje();

  const pacotesPorId = useMemo(
    () => new Map(pacotes.map((pacote) => [pacote.id, pacote])),
    [pacotes]
  );

  const atendimentosHoje = useMemo(
    () => agendamentos.filter((agendamento) => agendamento.data === hoje),
    [agendamentos, hoje]
  );

  const atendimentosEmAndamento = useMemo(
    () => atendimentosHoje.filter((item) => item.status === "em_atendimento"),
    [atendimentosHoje]
  );

  const proximosAtendimentos = useMemo(
    () =>
      atendimentosHoje.filter(
        (item) => item.status !== "finalizado" && item.status !== "cancelado"
      ),
    [atendimentosHoje]
  );

  const resumo = useMemo(
    () => ({
      total: atendimentosHoje.filter((item) => item.status !== "cancelado").length,
      emAndamento: atendimentosEmAndamento.length,
      pendentes: atendimentosHoje.filter((item) => item.status === "agendado" || !item.status).length,
      finalizados: atendimentosHoje.filter((item) => item.status === "finalizado").length,
    }),
    [atendimentosHoje, atendimentosEmAndamento]
  );

  function obterSaldoPacote(agendamento) {
    if (!agendamento.pacoteClienteId) return null;

    const pacote = pacotesPorId.get(agendamento.pacoteClienteId);
    if (!pacote) return null;

    return calcularSaldoServicoPacote(pacote, agendamento.servicoId);
  }

  async function iniciar(agendamento) {
    try {
      await iniciarAtendimento(agendamento.id);
    } catch (erroIniciar) {
      alert(erroIniciar.message || "Não foi possível iniciar o atendimento.");
    }
  }

  async function finalizar(agendamento) {
    const mensagem = agendamento.pacoteClienteId
      ? "Finalizar este atendimento e consumir 1 saldo do pacote?"
      : "Finalizar este atendimento e lançar o valor no financeiro?";

    if (!confirm(mensagem)) return;

    try {
      await finalizarAtendimento(agendamento.id);
    } catch (erroFinalizar) {
      alert(erroFinalizar.message || "Não foi possível finalizar o atendimento.");
    }
  }

  async function cancelar(agendamento) {
    if (!confirm("Cancelar este agendamento?")) return;

    try {
      await cancelarAtendimento(agendamento.id);
    } catch (erroCancelar) {
      alert(erroCancelar.message || "Não foi possível cancelar o agendamento.");
    }
  }

  function renderizarCardAtendimento(agendamento) {
    const saldoPacote = obterSaldoPacote(agendamento);
    const encerrado = agendamento.status === "finalizado" || agendamento.status === "cancelado";
    const emAtendimento = agendamento.status === "em_atendimento";

    return (
      <article className={emAtendimento ? "card-atendimento em-andamento" : "card-atendimento"} key={agendamento.id}>
        <div className="hora-atendimento">
          <strong>{agendamento.hora}</strong>
          <span>{agendamento.servicoDuracaoMinutos || 60} min</span>
        </div>

        <div className="dados-atendimento">
          <div className="topo-card-atendimento">
            <div>
              <h3>{agendamento.clienteNome}</h3>
              <p>{agendamento.servicoNome}</p>
            </div>
            <span className={statusClasse(agendamento.status)}>{statusTexto(agendamento.status)}</span>
          </div>

          <div className="detalhes-atendimento">
            <span>{pagamentoTexto(agendamento)}</span>
            {saldoPacote !== null && <span>Saldo antes de finalizar: {saldoPacote}</span>}
            {agendamento.observacoes && <span>Obs: {agendamento.observacoes}</span>}
          </div>

          {!encerrado && (
            <div className="acoes-atendimento">
              {!emAtendimento && (
                <button type="button" className="botao-secundario" onClick={() => iniciar(agendamento)}>
                  Iniciar
                </button>
              )}
              <button type="button" className="botao-principal-atendimento" onClick={() => finalizar(agendamento)}>
                Finalizar
              </button>
              <button type="button" className="botao-cancelar-atendimento" onClick={() => cancelar(agendamento)}>
                Cancelar
              </button>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <div>
      <div className="topo-clientes topo-atendimento">
        <div>
          <h1>Atendimento</h1>
          <p>Agenda de hoje para acompanhar, iniciar e finalizar os atendimentos.</p>
        </div>
        <span className="data-atendimento">{formatarData(hoje)}</span>
      </div>

      <div className="card-grid resumo-atendimento">
        <div className="card">
          <span>Hoje</span>
          <strong>{resumo.total}</strong>
          <p>Atendimentos marcados</p>
        </div>
        <div className="card">
          <span>Em atendimento</span>
          <strong>{resumo.emAndamento}</strong>
          <p>Atendimento iniciado</p>
        </div>
        <div className="card">
          <span>Pendentes</span>
          <strong>{resumo.pendentes}</strong>
          <p>Aguardando chegada</p>
        </div>
        <div className="card">
          <span>Finalizados</span>
          <strong>{resumo.finalizados}</strong>
          <p>Concluídos hoje</p>
        </div>
      </div>

      <div className="cliente-layout atendimento-layout">
        {erro && <p>{erro}</p>}

        <section className="lista-clientes bloco-atendimento">
          <div className="cabecalho-atendimento">
            <div>
              <h2>Em andamento</h2>
              <p>Atendimentos iniciados e ainda não finalizados.</p>
            </div>
          </div>

          {carregando && <p>Carregando atendimentos...</p>}
          {!carregando && atendimentosEmAndamento.length === 0 && (
            <div className="estado-vazio-atendimento">Nenhum atendimento em andamento agora.</div>
          )}
          {!carregando && atendimentosEmAndamento.map(renderizarCardAtendimento)}
        </section>

        <section className="lista-clientes bloco-atendimento">
          <div className="cabecalho-atendimento">
            <div>
              <h2>Agenda de hoje</h2>
              <p>Use esta lista durante o dia para iniciar, finalizar ou cancelar atendimentos.</p>
            </div>
          </div>

          {carregando && <p>Carregando agenda de hoje...</p>}
          {!carregando && proximosAtendimentos.length === 0 && (
            <div className="estado-vazio-atendimento">Nenhum atendimento pendente para hoje.</div>
          )}
          {!carregando && proximosAtendimentos.map(renderizarCardAtendimento)}
        </section>
      </div>
    </div>
  );
}

export default AtendimentoPage;
