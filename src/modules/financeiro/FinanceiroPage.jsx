import { useState } from "react";

import { useClientes } from "../clientes/hooks/useClientes";
import "./financeiro.css";
import CategoriasDespesa from "./components/CategoriasDespesa";
import DespesaForm from "./components/DespesaForm";
import FinanceiroDre from "./components/FinanceiroDre";
import FinanceiroFiltros from "./components/FinanceiroFiltros";
import FinanceiroResumo from "./components/FinanceiroResumo";
import MovimentosTable from "./components/MovimentosTable";
import PendenciasFinanceiras from "./components/PendenciasFinanceiras";
import { useCategoriasFinanceiras } from "./hooks/useCategoriasFinanceiras";
import { useFinanceiro } from "./hooks/useFinanceiro";

function formatarDataChave(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function obterInicioMes() {
  const hoje = new Date();
  return formatarDataChave(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
}

function obterFimMes() {
  const hoje = new Date();
  return formatarDataChave(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0));
}

function criarFiltrosIniciais() {
  return {
    dataInicio: obterInicioMes(),
    dataFim: obterFimMes(),
    clienteId: "",
    origem: "todos",
    status: "",
    pesquisa: "",
  };
}

function FinanceiroPage() {
  const [filtros, setFiltros] = useState(criarFiltrosIniciais);
  const [abaDespesa, setAbaDespesa] = useState("lancar");
  const { clientesAtivos } = useClientes();
  const {
    categoriasDespesa,
    carregando: carregandoCategorias,
    salvando: salvandoCategoria,
    erro: erroCategorias,
    salvarCategoria,
    removerCategoria,
  } = useCategoriasFinanceiras();
  const {
    movimentos,
    movimentosFiltrados,
    totaisFiltro,
    totaisMes,
    dreFiltro,
    carregando,
    salvando: salvandoFinanceiro,
    erro,
    salvarDespesa,
    registrarPagamentoPendente,
  } = useFinanceiro(filtros);

  function alterarFiltro(campo, valor) {
    if (campo === "limpar") {
      setFiltros(criarFiltrosIniciais());
      return;
    }

    setFiltros((atuais) => ({
      ...atuais,
      [campo]: valor,
    }));
  }

  return (
    <div>
      <div className="topo-clientes">
        <div>
          <h1>Financeiro</h1>
          <p>Acompanhe receitas, pendências, descontos, despesas, resultado do período e formas de pagamento.</p>
        </div>
      </div>

      <div className="cliente-layout financeiro-layout">
        <div className="lista-clientes financeiro-filtros-bloco">
          <h2>Período e filtros</h2>
          <FinanceiroFiltros filtros={filtros} clientes={clientesAtivos} onAlterar={alterarFiltro} />
        </div>

        <PendenciasFinanceiras
          movimentos={movimentos}
          carregando={carregando}
          salvando={salvandoFinanceiro}
          onRegistrarPagamento={registrarPagamentoPendente}
        />

        <div className="financeiro-configuracao-abas">
          <div className="financeiro-abas-topo">
            <div>
              <h2>Despesas</h2>
              <p>Lance custos e organize as categorias usadas no DRE.</p>
            </div>

            <div className="abas-financeiro" role="tablist" aria-label="Opções de despesas">
              <button
                type="button"
                className={abaDespesa === "lancar" ? "ativo" : ""}
                onClick={() => setAbaDespesa("lancar")}
              >
                Lançar despesa
              </button>
              <button
                type="button"
                className={abaDespesa === "categorias" ? "ativo" : ""}
                onClick={() => setAbaDespesa("categorias")}
              >
                Categorias
              </button>
            </div>
          </div>

          {abaDespesa === "lancar" && (
            <DespesaForm categorias={categoriasDespesa} onSalvar={salvarDespesa} salvando={salvandoFinanceiro} />
          )}

          {abaDespesa === "categorias" && (
            <CategoriasDespesa
              categorias={categoriasDespesa}
              carregando={carregandoCategorias}
              salvando={salvandoCategoria}
              erro={erroCategorias}
              onSalvar={salvarCategoria}
              onRemover={removerCategoria}
            />
          )}
        </div>

        <FinanceiroResumo totaisFiltro={totaisFiltro} totaisMes={totaisMes} />
        <FinanceiroDre dre={dreFiltro} />

        <div className="lista-clientes">
          <h2>Movimentos financeiros</h2>
          {erro && <p>{erro}</p>}
          <MovimentosTable movimentos={movimentosFiltrados} carregando={carregando} />
        </div>
      </div>
    </div>
  );
}

export default FinanceiroPage;
