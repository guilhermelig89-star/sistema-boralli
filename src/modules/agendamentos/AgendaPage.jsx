import { useMemo, useState } from "react";

import { useClientes } from "../clientes/hooks/useClientes";
import { usePacotesClientes } from "../pacotes/hooks/usePacotesClientes";
import { useServicos } from "../servicos/hooks/useServicos";
import AgendaFiltros from "./components/AgendaFiltros";
import AgendaResumo from "./components/AgendaResumo";
import AgendamentoForm from "./components/AgendamentoForm";
import AgendamentosTable from "./components/AgendamentosTable";
import { useAgendamentos } from "./hooks/useAgendamentos";

const filtrosIniciais = {
  data: "",
  status: "ativos",
  pesquisa: "",
};

function AgendaPage() {
  const [filtros, setFiltros] = useState(filtrosIniciais);
  const { clientesAtivos } = useClientes();
  const { servicosAtivos } = useServicos();
  const {
    pacotesAtivos,
    calcularSaldoPacote,
    pacoteEstaAcabando,
  } = usePacotesClientes();
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
      await salvarAgendamento(dados);
    } catch (erroSalvar) {
      alert(erroSalvar.message || "Não foi possível salvar o agendamento.");
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
      <div className="topo-clientes">
        <div>
          <h1>Agenda</h1>
          <p>Agende atendimentos e consuma pacotes somente ao finalizar.</p>
        </div>
      </div>

      <div className="cliente-layout">
        <AgendaResumo agendamentos={agendamentos} />

        <AgendamentoForm
          clientes={clientesAtivos}
          servicos={servicosAtivos}
          pacotesAtivos={pacotesAtivos}
          calcularSaldoPacote={calcularSaldoPacote}
          pacoteEstaAcabando={pacoteEstaAcabando}
          onSalvar={salvarFormulario}
        />

        <div className="lista-clientes">
          <h2>Agendamentos</h2>
          <AgendaFiltros filtros={filtros} onAlterar={alterarFiltro} />
          {erro && <p>{erro}</p>}
          <AgendamentosTable
            agendamentos={agendamentosFiltrados}
            carregando={carregando}
            onFinalizar={finalizar}
            onCancelar={cancelar}
          />
        </div>
      </div>
    </div>
  );
}

export default AgendaPage;
