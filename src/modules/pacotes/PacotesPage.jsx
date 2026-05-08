import { useMemo, useState } from "react";

import { useClientes } from "../clientes/hooks/useClientes";
import { useCombos } from "../servicos/hooks/useCombos";
import "./pacotes.css";
import HistoricoPacotes from "./components/HistoricoPacotes";
import PacoteForm from "./components/PacoteForm";
import PacotesTable from "./components/PacotesTable";
import { usePacotesClientes } from "./hooks/usePacotesClientes";

function PacotesPage() {
  const [clienteFiltro, setClienteFiltro] = useState("");
  const { clientesAtivos } = useClientes();
  const { combosAtivos } = useCombos();
  const {
    pacotes,
    historico,
    carregando,
    erro,
    salvarPacote,
    calcularSaldoPacote,
    pacoteEstaAcabando,
  } = usePacotesClientes();

  const pacotesFiltrados = useMemo(() => {
    if (!clienteFiltro) return pacotes;
    return pacotes.filter((pacote) => pacote.clienteId === clienteFiltro);
  }, [pacotes, clienteFiltro]);

  const historicoFiltrado = useMemo(() => {
    if (!clienteFiltro) return historico;
    return historico.filter((item) => item.clienteId === clienteFiltro);
  }, [historico, clienteFiltro]);

  async function salvarFormulario(dados) {
    try {
      await salvarPacote(dados);
    } catch (erroSalvar) {
      alert(erroSalvar.message || "Não foi possível salvar o pacote.");
    }
  }

  return (
    <div>
      <div className="topo-clientes">
        <div>
          <h1>Pacotes</h1>
          <p>Venda combos para clientes e controle saldo individual por serviço.</p>
        </div>
      </div>

      <div className="cliente-layout">
        <PacoteForm
          clientes={clientesAtivos}
          combos={combosAtivos}
          onSalvar={salvarFormulario}
        />

        <div className="lista-clientes">
          <select
            className="pesquisa-clientes"
            value={clienteFiltro}
            onChange={(e) => setClienteFiltro(e.target.value)}
          >
            <option value="">Todos os clientes</option>
            {clientesAtivos.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>

          <h2>Pacotes dos clientes</h2>
          {erro && <p>{erro}</p>}

          <PacotesTable
            pacotes={pacotesFiltrados}
            carregando={carregando}
            calcularSaldoPacote={calcularSaldoPacote}
            pacoteEstaAcabando={pacoteEstaAcabando}
          />
        </div>

        <HistoricoPacotes historico={historicoFiltrado} />
      </div>
    </div>
  );
}

export default PacotesPage;
