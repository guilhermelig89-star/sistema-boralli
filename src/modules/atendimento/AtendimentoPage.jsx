import { useMemo, useState } from "react";

import AlertaTempoAtendimento from "../agendamentos/components/AlertaTempoAtendimento";
import { useAgendamentos } from "../agendamentos/hooks/useAgendamentos";
import { useSugestoesTempoAtendimento } from "../agendamentos/hooks/useSugestoesTempoAtendimento";
import { useClientes } from "../clientes/hooks/useClientes";
import { calcularSaldoItemPacote } from "../pacotes/domain/pacotesDomain";
import { usePacotesClientes } from "../pacotes/hooks/usePacotesClientes";
import FechamentoFinanceiroModal from "./components/FechamentoFinanceiroModal";
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

function juntarEndereco(partes) {
  return partes.filter(Boolean).map((parte) => String(parte).trim()).filter(Boolean).join(", ");
}

function montarEnderecoCliente(cliente) {
  if (!cliente) return "";

  return juntarEndereco([
    cliente.rua,
    cliente.numero,
    cliente.bairro,
    cliente.cidade,
    cliente.cep,
  ]);
}

function montarUrlMaps(endereco) {
  if (!endereco) return "";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(endereco)}`;
}

function obterItensVisiveisPacote(pacote = {}) {
  if (Array.isArray(pacote.itens) && pacote.itens.length > 0) {
    return pacote.itens;
  }

  if (!pacote.servicoId) return [];

  return [
    {
      servicoId: pacote.servicoId,
      servicoNome: pacote.servicoNome,
      quantidadeTotal: pacote.quantidadeTotal || 0,
      quantidadeUtilizada: pacote.quantidadeUtilizada || 0,
      saldoRestante: pacote.saldoRestante,
    },
  ];
}

function deveMostrarAlertaTempo(resultado) {
  return Boolean(resultado?.tempoRealCalculado && resultado?.alertaTempoExigeAtencao);
}

function AtendimentoPage() {
  const [alertaTempo, setAlertaTempo] = useState(null);
  const [atendimentoFechamento, setAtendimentoFechamento] = useState(null);
  const {
    agendamentos,
    carregando,
    erro,
    iniciarAtendimento,
    finalizarAtendimento,
    cancelarAtendimento,
  } = useAgendamentos();
  const {
    salvarAjusteClienteServico,
    revisarTempoPadraoServico,
  } = useSugestoesTempoAtendimento();
  const { clientesAtivos } = useClientes();
  const { pacotes, calcularSaldoPacote, calcularSaldoServicoPacote } = usePacotesClientes();
  const hoje = obterHoje();

  const clientesPorId = useMemo(
    () => new Map(clientesAtivos.map((cliente) => [cliente.id, cliente])),
    [clientesAtivos]
  );

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
    () => atendimentosHoje.filter((item) => item.status === "agendado" || !item.status),
    [atendimentosHoje]
  );

  const pacoteFechamento = useMemo(
    () => (atendimentoFechamento?.pacoteClienteId ? pacotesPorId.get(atendimentoFechamento.pacoteClienteId) || null : null),
    [atendimentoFechamento, pacotesPorId]
  );

  const resumo = useMemo(
    () => ({
      total: atendimentosHoje.filter((item) => item.status !== "cancelado").length,
      emAndamento: atendimentosEmAndamento.length,
      pendentes: proximosAtendimentos.length,
      finalizados: atendimentosHoje.filter((item) => item.status === "finalizado").length,
    }),
    [atendimentosHoje, atendimentosEmAndamento, proximosAtendimentos]
  );

  function obterClienteAgendamento(agendamento) {
    return clientesPorId.get(agendamento.clienteId) || null;
  }

  function obterPacoteAgendamento(agendamento) {
    if (!agendamento.pacoteClienteId) return null;
    return pacotesPorId.get(agendamento.pacoteClienteId) || null;
  }

  async function iniciar(agendamento) {
    try {
      await iniciarAtendimento(agendamento.id);
    } catch (erroIniciar) {
      alert(erroIniciar.message || "Não foi possível iniciar o atendimento.");
    }
  }

  function finalizar(agendamento) {
    if (agendamento.status !== "em_atendimento") {
      alert("Inicie o atendimento antes de finalizar para calcular o tempo real corretamente.");
      return;
    }

    setAtendimentoFechamento(agendamento);
  }

  async function confirmarFechamento(fechamentoFinanceiro) {
    if (!atendimentoFechamento) return;

    try {
      const resultado = await finalizarAtendimento(atendimentoFechamento.id, fechamentoFinanceiro);
      setAtendimentoFechamento(null);
      if (deveMostrarAlertaTempo(resultado)) {
        setAlertaTempo(resultado);
      }
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

  async function ajustarTempoCliente() {
    if (!alertaTempo) return;

    try {
      await salvarAjusteClienteServico({
        ...alertaTempo,
        duracaoMinutos: alertaTempo.tempoRealMinutos,
        origemAgendamentoId: alertaTempo.agendamentoId,
      });
      setAlertaTempo(null);
      alert("Sugestão ajustada para esta cliente e serviço.");
    } catch (erroAjuste) {
      alert(erroAjuste.message || "Não foi possível ajustar a sugestão de tempo.");
    }
  }

  async function revisarTempoServico() {
    if (!alertaTempo) return;

    const confirmar = confirm(
      `Revisar o tempo padrão geral de ${alertaTempo.servicoNome} para ${alertaTempo.tempoRealMinutos} min?`
    );

    if (!confirmar) return;

    try {
      await revisarTempoPadraoServico(alertaTempo.servicoId, alertaTempo.tempoRealMinutos);
      setAlertaTempo(null);
      alert("Tempo padrão do serviço revisado.");
    } catch (erroRevisao) {
      alert(erroRevisao.message || "Não foi possível revisar o tempo padrão do serviço.");
    }
  }

  function renderizarEnderecoAtendimento(cliente) {
    const endereco = montarEnderecoCliente(cliente);
    const urlMaps = montarUrlMaps(endereco);

    if (!endereco) {
      return <span className="endereco-vazio-atendimento">Endereço não cadastrado</span>;
    }

    return (
      <div className="endereco-atendimento">
        <div>
          <strong>Endereço</strong>
          <span>{endereco}</span>
          {cliente?.referencia && <small>Referência: {cliente.referencia}</small>}
        </div>
        <a href={urlMaps} target="_blank" rel="noreferrer" className="botao-rota-atendimento">
          Abrir rota
        </a>
      </div>
    );
  }

  function renderizarResumoPacote(agendamento, pacote) {
    if (!agendamento.pacoteClienteId) return null;

    if (!pacote) {
      return (
        <div className="pacote-atendimento pacote-atendimento-alerta">
          <strong>Pacote da cliente</strong>
          <p>Pacote vinculado ao agendamento não encontrado.</p>
        </div>
      );
    }

    const saldoServico = calcularSaldoServicoPacote(pacote, agendamento.servicoId);
    const saldoTotal = calcularSaldoPacote(pacote);
    const saldoDepois = Math.max(0, saldoServico - 1);
    const itens = obterItensVisiveisPacote(pacote);
    const estaAcabando = saldoServico <= Number(pacote.alertaSaldoMinimo || 1);

    return (
      <div className="pacote-atendimento">
        <div className="topo-pacote-atendimento">
          <div>
            <strong>Pacote da cliente</strong>
            <p>{pacote.nome || agendamento.pacoteNome}</p>
          </div>
          <span className={estaAcabando ? "badge-tipo badge-alerta" : "badge-tipo badge-servico"}>
            {estaAcabando ? "Saldo baixo" : `${saldoTotal} no total`}
          </span>
        </div>

        <div className="consumo-atendimento">
          <span>Vai consumir</span>
          <strong>1 {agendamento.servicoNome}</strong>
          <small>
            Saldo deste serviço: {saldoServico} para {saldoDepois}
          </small>
        </div>

        <div className="itens-pacote-atendimento">
          {itens.map((item) => {
            const saldoItem = calcularSaldoItemPacote(item);
            const total = Number(item.quantidadeTotal || item.quantidade || 0);
            const utilizado = Number(item.quantidadeUtilizada || 0);
            const itemAtual = item.servicoId === agendamento.servicoId;

            return (
              <div className={itemAtual ? "item-pacote-atual" : ""} key={item.servicoId}>
                <span>{item.servicoNome}</span>
                <strong>{saldoItem} restante</strong>
                <small>{utilizado}/{total} usado</small>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderizarTempoAtendimento(agendamento) {
    const previsto = agendamento.tempoPrevistoMinutos || agendamento.servicoDuracaoMinutos || 60;

    return (
      <div className="tempo-atendimento-card">
        <span>Tempo previsto</span>
        <strong>{previsto} min</strong>
        {agendamento.tempoSugeridoMensagem && <small>{agendamento.tempoSugeridoMensagem}</small>}
      </div>
    );
  }

  function renderizarCardAtendimento(agendamento) {
    const cliente = obterClienteAgendamento(agendamento);
    const pacote = obterPacoteAgendamento(agendamento);
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
            {agendamento.observacoes && <span>Obs: {agendamento.observacoes}</span>}
          </div>

          {renderizarTempoAtendimento(agendamento)}
          {renderizarEnderecoAtendimento(cliente)}
          {renderizarResumoPacote(agendamento, pacote)}

          {!encerrado && (
            <div className="acoes-atendimento">
              {!emAtendimento && (
                <button type="button" className="botao-secundario" onClick={() => iniciar(agendamento)}>
                  Iniciar atendimento
                </button>
              )}
              {emAtendimento && (
                <button type="button" className="botao-principal-atendimento" onClick={() => finalizar(agendamento)}>
                  Finalizar atendimento
                </button>
              )}
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
              <h2>Próximos atendimentos</h2>
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

      {atendimentoFechamento && (
        <FechamentoFinanceiroModal
          agendamento={atendimentoFechamento}
          pacote={pacoteFechamento}
          onFechar={() => setAtendimentoFechamento(null)}
          onConfirmar={confirmarFechamento}
        />
      )}

      <AlertaTempoAtendimento
        alerta={alertaTempo}
        onFechar={() => setAlertaTempo(null)}
        onAjustarCliente={ajustarTempoCliente}
        onRevisarServico={revisarTempoServico}
      />
    </div>
  );
}

export default AtendimentoPage;
