import { useClientes } from "../clientes/hooks/useClientes";
import { usePacotesClientes } from "../pacotes/hooks/usePacotesClientes";
import { useServicos } from "../servicos/hooks/useServicos";
import AgendamentoForm from "./components/AgendamentoForm";
import AgendamentosTable from "./components/AgendamentosTable";
import { useAgendamentos } from "./hooks/useAgendamentos";

function AgendaPage() {
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
  } = useAgendamentos();

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

  return (
    <div>
      <div className="topo-clientes">
        <div>
          <h1>Agenda</h1>
          <p>Agende atendimentos e consuma pacotes somente ao finalizar.</p>
        </div>
      </div>

      <div className="cliente-layout">
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
          {erro && <p>{erro}</p>}
          <AgendamentosTable
            agendamentos={agendamentos}
            carregando={carregando}
            onFinalizar={finalizar}
          />
        </div>
      </div>
    </div>
  );
}

export default AgendaPage;
