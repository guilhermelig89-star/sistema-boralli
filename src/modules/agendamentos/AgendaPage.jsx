import { useMemo, useState } from "react";

import { useClientes } from "../clientes/hooks/useClientes";
import { usePacotesClientes } from "../pacotes/hooks/usePacotesClientes";
import { useServicos } from "../servicos/hooks/useServicos";
import "./agenda.css";
import AgendaConfiguracao from "./components/AgendaConfiguracao";
import AgendaFiltros from "./components/AgendaFiltros";
import AgendaResumo from "./components/AgendaResumo";
import AgendamentoForm from "./components/AgendamentoForm";
import AgendamentosTable from "./components/AgendamentosTable";
import { useAgendaConfiguracao } from "./hooks/useAgendaConfiguracao";
import { useAgendamentos } from "./hooks/useAgendamentos";

const filtrosIniciais = {
  data: "",
  status: "ativos",
  pesquisa: "",
};

function AgendaPage() {
  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [abaAtual, setAbaAtual] = useState("agenda");
  const { clientesAtivos } = useClientes();
  const { servicosAtivos } = useServicos();
  const {
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
    finalizarAtendimento,
    cancelarAtendimento,
  } = useAgendamentos();

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

  async function finalizar(id) {
    try {
      await finalizarAtendimento(id);
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

            <AgendamentoForm
              clientes={clientesAtivos}
              servicos={servicosAtivos}
              pacotesAtivos={pacotesAtivos}
              agendamentos={agendamentos}
              horarios={horarios}
              excecoes={excecoes}
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
                onFinalizar={finalizar}
                onCancelar={cancelar}
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
    </div>
  );
}

export default AgendaPage;
