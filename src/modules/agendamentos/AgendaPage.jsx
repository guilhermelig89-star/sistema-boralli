import { useMemo, useState } from "react";

import FechamentoFinanceiroModal from "../atendimento/components/FechamentoFinanceiroModal";
import { useClientes } from "../clientes/hooks/useClientes";
import { usePacotesClientes } from "../pacotes/hooks/usePacotesClientes";
import { useServicos } from "../servicos/hooks/useServicos";
import "./agenda.css";
import AgendaConfiguracao from "./components/AgendaConfiguracao";
import AgendaFiltros from "./components/AgendaFiltros";
import AgendaResumo from "./components/AgendaResumo";
import AgendamentoForm from "./components/AgendamentoForm";
import AgendamentosTable from "./components/AgendamentosTable";
import AgendamentoEditModal from "./components/AgendamentoEditModal";
import AlertaTempoAtendimento from "./components/AlertaTempoAtendimento";
import { useAgendaConfiguracao } from "./hooks/useAgendaConfiguracao";
import { useAgendamentos } from "./hooks/useAgendamentos";
import { useSugestoesTempoAtendimento } from "./hooks/useSugestoesTempoAtendimento";

const filtrosIniciais = {
  data: "",
  status: "ativos",
  pesquisa: "",
};

function deveMostrarAlertaTempo(resultado) {
  return Boolean(resultado?.tempoRealCalculado && resultado?.alertaTempoExigeAtencao);
}

function AgendaPage() {
  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [abaAtual, setAbaAtual] = useState("agenda");
  const [alertaTempo, setAlertaTempo] = useState(null);
  const [agendamentoFechamento, setAgendamentoFechamento] = useState(null);
  const [agendamentoEmEdicao, setAgendamentoEmEdicao] = useState(null);
  const [pendenciaAtual, setPendenciaAtual] = useState(null);
  const [acaoPendencia, setAcaoPendencia] = useState("finalizar_real");
  const [horarioRealTermino, setHorarioRealTermino] = useState("");
  const [observacaoPendencia, setObservacaoPendencia] = useState("");
  const [consumirPacoteManual, setConsumirPacoteManual] = useState(false);
  const [lancarFinanceiroManual, setLancarFinanceiroManual] = useState(false);
  const { clientesAtivos } = useClientes();
  const { servicosAtivos } = useServicos();
  const {
    sugestoesTempo,
    salvarAjusteClienteServico,
    revisarTempoPadraoServico,
  } = useSugestoesTempoAtendimento();
  const {
    pacotes,
    pacotesAtivos,
    calcularSaldoServicoPacote,
    pacoteTemSaldoParaServico,
  } = usePacotesClientes();
  const {
    horarios,
    excecoes,
    carregandoConfiguracao,
    erroConfiguracao,
    salvarHorario,
    salvarExcecao,
  } = useAgendaConfiguracao();
  const {
    agendamentos,
    carregando,
    erro,
    salvarAgendamento,
    iniciarAtendimento,
    finalizarAtendimento,
    cancelarAtendimento,
    salvarEdicaoAgendamento,
    excluirAgendamentoPorId,
    resolverPendencia,
    corrigirConsumoPacote,
  } = useAgendamentos();

  const pendencias = useMemo(() => {
    const agora = new Date();
    return agendamentos.filter((item) => {
      const dataHora = new Date(`${item.data}T${item.hora || "00:00"}:00`);
      if (item.status === "agendado" && dataHora < agora) return true;
      if (item.status === "em_atendimento") {
        const iniciouEm = item.atendimentoIniciadoEm ? new Date(item.atendimentoIniciadoEm) : dataHora;
        return (agora.getTime() - iniciouEm.getTime()) / (1000 * 60 * 60) >= 6;
      }
      return false;
    });
  }, [agendamentos]);

  const pacotesPorId = useMemo(
    () => new Map(pacotes.map((pacote) => [pacote.id, pacote])),
    [pacotes]
  );

  const pacoteFechamento = useMemo(
    () => (agendamentoFechamento?.pacoteClienteId ? pacotesPorId.get(agendamentoFechamento.pacoteClienteId) || null : null),
    [agendamentoFechamento, pacotesPorId]
  );

  const agendamentosFiltrados = useMemo(() => {
    const termo = filtros.pesquisa.toLowerCase();

    return agendamentos.filter((agendamento) => {
      const correspondeData = !filtros.data || agendamento.data === filtros.data;
      const correspondePesquisa =
        !termo ||
        agendamento.clienteNome?.toLowerCase().includes(termo) ||
        agendamento.servicoNome?.toLowerCase().includes(termo);
      const correspondeStatus =
        filtros.status === "todos" ||
        (filtros.status === "ativos" &&
          agendamento.status !== "finalizado" &&
          agendamento.status !== "cancelado") ||
        agendamento.status === filtros.status;

      return correspondeData && correspondePesquisa && correspondeStatus;
    });
  }, [agendamentos, filtros]);

  function alterarFiltro(campo, valor) {
    if (campo === "limpar") {
      setFiltros(filtrosIniciais);
      return;
    }

    setFiltros((atuais) => ({
      ...atuais,
      [campo]: valor,
    }));
  }

  function abrirModalPendencia(item) {
    const possuiPacote = Boolean(item?.pacoteClienteId);
    setPendenciaAtual(item);
    setAcaoPendencia("finalizar_real");
    setHorarioRealTermino("");
    setObservacaoPendencia("");
    setConsumirPacoteManual(possuiPacote);
    setLancarFinanceiroManual(!possuiPacote);
  }

  async function salvarFormulario(dados) {
    try {
      await salvarAgendamento(dados, { horarios, excecoes });
    } catch (erroSalvar) {
      alert(erroSalvar.message || "Não foi possível salvar o agendamento.");
    }
  }

  async function salvarHorarioAgenda(dados) {
    try {
      await salvarHorario(dados);
    } catch (erroSalvar) {
      alert(erroSalvar.message || "Não foi possível salvar o horário.");
    }
  }

  async function salvarExcecaoAgenda(dados) {
    try {
      await salvarExcecao(dados);
    } catch (erroSalvar) {
      alert(erroSalvar.message || "Não foi possível salvar a exceção.");
    }
  }

  async function iniciar(id) {
    try {
      await iniciarAtendimento(id);
    } catch (erroIniciar) {
      alert(erroIniciar.message || "Não foi possível iniciar o atendimento.");
    }
  }

  function finalizar(id) {
    const agendamento = agendamentos.find((item) => item.id === id);

    if (!agendamento) {
      alert("Agendamento não encontrado.");
      return;
    }

    if (agendamento.status !== "em_atendimento") {
      alert("Inicie o atendimento antes de finalizar para calcular o tempo real corretamente.");
      return;
    }

    setAgendamentoFechamento(agendamento);
  }

  async function confirmarFechamento(fechamentoFinanceiro) {
    if (!agendamentoFechamento) return;

    try {
      const resultado = await finalizarAtendimento(agendamentoFechamento.id, fechamentoFinanceiro);
      setAgendamentoFechamento(null);
      if (deveMostrarAlertaTempo(resultado)) {
        setAlertaTempo(resultado);
      }
    } catch (erroFinalizar) {
      alert(erroFinalizar.message || "Não foi possível finalizar o atendimento.");
    }
  }

  async function cancelar(id) {
    try {
      await cancelarAtendimento(id);
    } catch (erroCancelar) {
      alert(erroCancelar.message || "Não foi possível cancelar o agendamento.");
    }
  }


  async function salvarEdicao(dadosEdicao) {
    if (!agendamentoEmEdicao) return;

    try {
      await salvarEdicaoAgendamento(
        {
          original: agendamentoEmEdicao,
          dados: dadosEdicao,
          confirmarEdicaoFinalizado: () =>
            confirm("Esse agendamento está finalizado. Confirmar alteração de pacote/financeiro?")
        },
        { horarios, excecoes }
      );
      setAgendamentoEmEdicao(null);
      alert("Agendamento atualizado com sucesso.");
    } catch (erroSalvar) {
      alert(erroSalvar.message || "Não foi possível salvar as alterações.");
    }
  }

  async function excluirEdicao() {
    if (!agendamentoEmEdicao) return;
    const confirmar = confirm("Excluir este agendamento? Esta ação não pode ser desfeita.");
    if (!confirmar) return;

    try {
      await excluirAgendamentoPorId(agendamentoEmEdicao.id);
      setAgendamentoEmEdicao(null);
      alert("Agendamento excluído com sucesso.");
    } catch (erroExcluir) {
      alert(erroExcluir.message || "Não foi possível excluir o agendamento.");
    }
  }

  async function confirmarResolucaoPendencia() {
    if (!pendenciaAtual) return;
    try {
      await resolverPendencia(pendenciaAtual.id, {
        acao: acaoPendencia,
        motivoPendencia: pendenciaAtual.status === "em_atendimento" ? "pendente_finalizacao" : "agendamento_vencido",
        observacaoPendencia,
        horarioRealTermino: acaoPendencia === "finalizar_real" ? horarioRealTermino : "",
        consumirPacote: acaoPendencia === "realizado_manual" ? consumirPacoteManual : undefined,
        lancarFinanceiro: acaoPendencia === "realizado_manual" ? lancarFinanceiroManual : undefined,
      });
      setPendenciaAtual(null);
      setAcaoPendencia("finalizar_real");
      setHorarioRealTermino("");
      setObservacaoPendencia("");
    } catch (erroResolucao) {
      alert(erroResolucao.message || "Não foi possível resolver a pendência.");
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

  async function corrigirConsumoPacoteFinalizado(agendamento) {
    if (!agendamento) return;
    if (!confirm("Confirmar correção de consumo do pacote para este atendimento finalizado?")) return;

    try {
      await corrigirConsumoPacote(agendamento.id);
      alert("Consumo do pacote corrigido com sucesso.");
    } catch (erroCorrecao) {
      alert(erroCorrecao.message || "Não foi possível corrigir o consumo do pacote.");
    }
  }

  return (
    <div>
      <div className="topo-clientes topo-agenda">
        <div>
          <h1>Agendamentos</h1>
          <p>Cadastre atendimentos respeitando a duração de cada serviço e as regras configuradas.</p>
        </div>

        <div className="abas-agenda" role="tablist" aria-label="Seções de agendamentos">
          <button
            type="button"
            className={abaAtual === "agenda" ? "ativo" : ""}
            onClick={() => setAbaAtual("agenda")}
          >
            Agenda
          </button>
          <button
            type="button"
            className={abaAtual === "configuracoes" ? "ativo" : ""}
            onClick={() => setAbaAtual("configuracoes")}
          >
            Configurações
          </button>
        </div>
      </div>

      <div className="cliente-layout">
        {abaAtual === "agenda" && (
          <>
            <AgendaResumo agendamentos={agendamentos} />
            <div className="lista-clientes pendencias-bloco">
              <div className="topo-pendencias">
                <h2>Pendências</h2>
                <span>{pendencias.length}</span>
              </div>
              {pendencias.length === 0 && <p>Nenhuma pendência no momento.</p>}
              {pendencias.map((item) => (
                <div className="linha-pendencia" key={item.id}>
                  <div>
                    <strong>{item.clienteNome}</strong>
                    <p>{item.data} {item.hora} • {item.servicoNome} • {item.status === "em_atendimento" ? "Atendimento aberto" : "Agendamento vencido"}</p>
                  </div>
                  <button className="botao-editar" onClick={() => abrirModalPendencia(item)}>Resolver</button>
                </div>
              ))}
            </div>

            <AgendamentoForm
              clientes={clientesAtivos}
              servicos={servicosAtivos}
              pacotesAtivos={pacotesAtivos}
              agendamentos={agendamentos}
              horarios={horarios}
              excecoes={excecoes}
              sugestoesTempo={sugestoesTempo}
              calcularSaldoServicoPacote={calcularSaldoServicoPacote}
              pacoteTemSaldoParaServico={pacoteTemSaldoParaServico}
              onSalvar={salvarFormulario}
            />

            <div className="lista-clientes">
              <h2>Lista de agendamentos</h2>
              <AgendaFiltros filtros={filtros} onAlterar={alterarFiltro} />
              {erro && <p>{erro}</p>}
              <AgendamentosTable
                agendamentos={agendamentosFiltrados}
                carregando={carregando}
                onIniciar={iniciar}
                onFinalizar={finalizar}
                onCancelar={cancelar}
                onEditar={setAgendamentoEmEdicao}
                onCorrigirConsumoPacote={corrigirConsumoPacoteFinalizado}
              />
            </div>
          </>
        )}

        {abaAtual === "configuracoes" && (
          <AgendaConfiguracao
            horarios={horarios}
            excecoes={excecoes}
            carregando={carregandoConfiguracao}
            erro={erroConfiguracao}
            onSalvarHorario={salvarHorarioAgenda}
            onSalvarExcecao={salvarExcecaoAgenda}
          />
        )}
      </div>

      {agendamentoFechamento && (
        <FechamentoFinanceiroModal
          agendamento={agendamentoFechamento}
          pacote={pacoteFechamento}
          onFechar={() => setAgendamentoFechamento(null)}
          onConfirmar={confirmarFechamento}
        />
      )}

      {agendamentoEmEdicao && (
        <AgendamentoEditModal
          agendamento={agendamentoEmEdicao}
          clientes={clientesAtivos}
          servicos={servicosAtivos}
          pacotesAtivos={pacotesAtivos}
          calcularSaldoServicoPacote={calcularSaldoServicoPacote}
          pacoteTemSaldoParaServico={pacoteTemSaldoParaServico}
          onSalvar={salvarEdicao}
          onCancelar={() => setAgendamentoEmEdicao(null)}
          onExcluir={excluirEdicao}
        />
      )}

      <AlertaTempoAtendimento
        alerta={alertaTempo}
        onFechar={() => setAlertaTempo(null)}
        onAjustarCliente={ajustarTempoCliente}
        onRevisarServico={revisarTempoServico}
      />
      {pendenciaAtual && (
        <div className="modal-tempo-backdrop" role="presentation">
          <section className="modal-tempo modal-tempo-leve" role="dialog" aria-modal="true">
            <div className="modal-tempo-topo"><h2>Resolver pendência</h2><button onClick={() => setPendenciaAtual(null)}>Fechar</button></div>
            <div className="campo-config">
              <span>Ação</span>
              <select value={acaoPendencia} onChange={(e) => setAcaoPendencia(e.target.value)}>
                <option value="finalizar_real">Finalizar com horário real</option>
                <option value="realizado_manual">Marcar como realizado manualmente</option>
                <option value="nao_compareceu">Cliente não compareceu</option>
                <option value="cliente_cancelou">Cliente cancelou</option>
                <option value="remarcar">Remarcar</option>
                <option value="cancelar_atendimento">Cancelar atendimento</option>
                <option value="nao_realizado">Não realizado</option>
              </select>
            </div>
            {acaoPendencia === "finalizar_real" && (
              <div className="campo-config">
                <span>Horário real de término</span>
                <input type="datetime-local" value={horarioRealTermino} onChange={(e) => setHorarioRealTermino(e.target.value)} />
              </div>
            )}
            {acaoPendencia === "realizado_manual" && (
              <>
                <div className="campo-config">
                  <label>
                    <input
                      type="checkbox"
                      checked={consumirPacoteManual}
                      onChange={(e) => setConsumirPacoteManual(e.target.checked)}
                      disabled={!pendenciaAtual?.pacoteClienteId}
                    />
                    Consumir pacote/combo
                  </label>
                </div>
                <div className="campo-config">
                  <label>
                    <input
                      type="checkbox"
                      checked={lancarFinanceiroManual}
                      onChange={(e) => setLancarFinanceiroManual(e.target.checked)}
                    />
                    Lançar financeiro
                  </label>
                </div>
              </>
            )}
            <div className="campo-config">
              <span>Observação</span>
              <input value={observacaoPendencia} onChange={(e) => setObservacaoPendencia(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="modal-tempo-acoes">
              <button onClick={confirmarResolucaoPendencia}>Confirmar resolução</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AgendaPage;
