import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useClientes } from "../clientes/hooks/useClientes";
import { useCombos } from "../servicos/hooks/useCombos";
import "./pacotes.css";
import HistoricoPacotes from "./components/HistoricoPacotes";
import PacoteForm from "./components/PacoteForm";
import PacotesTable from "./components/PacotesTable";
import { usePacotesClientes } from "./hooks/usePacotesClientes";

const filtrosPacotes = [
  { id: "ativos", nome: "Ativos" },
  { id: "finalizados", nome: "Finalizados" },
  { id: "todos", nome: "Todos" },
];

function PacotesPage() {
  const [clienteFiltro, setClienteFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState(null);
  const abasRef = useRef(null);
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

  const pacoteEstaFinalizado = useCallback(
    (pacote) => pacote.status === "esgotado" || calcularSaldoPacote(pacote) <= 0,
    [calcularSaldoPacote]
  );

  const pacotesPorCliente = useMemo(() => {
    if (!clienteFiltro) return pacotes;
    return pacotes.filter((pacote) => pacote.clienteId === clienteFiltro);
  }, [pacotes, clienteFiltro]);

  const contadoresPacotes = useMemo(() => {
    return pacotesPorCliente.reduce(
      (contadores, pacote) => {
        const finalizado = pacoteEstaFinalizado(pacote);

        return {
          ativos: contadores.ativos + (finalizado ? 0 : 1),
          finalizados: contadores.finalizados + (finalizado ? 1 : 0),
          todos: contadores.todos + 1,
        };
      },
      { ativos: 0, finalizados: 0, todos: 0 }
    );
  }, [pacotesPorCliente, pacoteEstaFinalizado]);

  const pacotesFiltrados = useMemo(() => {
    if (!statusFiltro) {
      return [];
    }

    if (statusFiltro === "finalizados") {
      return pacotesPorCliente.filter((pacote) => pacoteEstaFinalizado(pacote));
    }

    if (statusFiltro === "todos") {
      return pacotesPorCliente;
    }

    return pacotesPorCliente.filter((pacote) => !pacoteEstaFinalizado(pacote));
  }, [pacotesPorCliente, statusFiltro, pacoteEstaFinalizado]);

  const historicoFiltrado = useMemo(() => {
    if (!clienteFiltro) return historico;
    return historico.filter((item) => item.clienteId === clienteFiltro);
  }, [historico, clienteFiltro]);

  const mensagemVazia =
    !statusFiltro
      ? "Selecione uma aba para visualizar os pacotes."
      :
    statusFiltro === "finalizados"
      ? "Nenhum pacote finalizado encontrado."
      : "Nenhum pacote ativo encontrado para este filtro.";

  async function salvarFormulario(dados) {
    try {
      await salvarPacote(dados);
    } catch (erroSalvar) {
      alert(erroSalvar.message || "Não foi possível salvar o pacote.");
    }
  }

  useEffect(() => {
    function aoClicarFora(evento) {
      if (!abasRef.current?.contains(evento.target)) {
        setStatusFiltro(null);
      }
    }

    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  return (
    <div>
      <div className="topo-clientes">
        <div>
          <h1>Pacotes</h1>
          <p>Venda pacotes de serviços e acompanhe o saldo disponível de cada cliente.</p>
        </div>
      </div>

      <div className="cliente-layout">
        <PacoteForm
          clientes={clientesAtivos}
          combos={combosAtivos}
          onSalvar={salvarFormulario}
        />

        <div className="lista-clientes bloco-pacotes">
          <div className="cabecalho-bloco-pacotes">
            <div>
              <h2>Pacotes vendidos</h2>
              <p>Consulte quais pacotes ainda têm saldo e quais estão perto de acabar.</p>
            </div>

            <select
              className="filtro-pacotes"
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
          </div>

          <div className="abas-pacotes" role="tablist" aria-label="Filtro de pacotes por status" ref={abasRef}>
            {filtrosPacotes.map((filtro) => (
              <button
                key={filtro.id}
                type="button"
                className={statusFiltro === filtro.id ? "ativo" : ""}
                onClick={() => setStatusFiltro((atual) => (atual === filtro.id ? null : filtro.id))}
              >
                {filtro.nome}
                <span>{contadoresPacotes[filtro.id]}</span>
              </button>
            ))}
          </div>

          {erro && <p>{erro}</p>}

          <PacotesTable
            pacotes={pacotesFiltrados}
            carregando={carregando}
            mensagemVazia={mensagemVazia}
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
