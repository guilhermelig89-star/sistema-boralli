import { useState } from "react";

import { useClientes } from "../clientes/hooks/useClientes";
import "./financeiro.css";
import DespesaForm from "./components/DespesaForm";
import FinanceiroDre from "./components/FinanceiroDre";
import FinanceiroFiltros from "./components/FinanceiroFiltros";
import FinanceiroResumo from "./components/FinanceiroResumo";
import MovimentosTable from "./components/MovimentosTable";
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
    status: "confirmado",
    pesquisa: "",
  };
}

function FinanceiroPage() {
  const [filtros, setFiltros] = useState(criarFiltrosIniciais);
  const { clientesAtivos } = useClientes();
  const {
    movimentosFiltrados,
    totaisFiltro,
    totaisMes,
    dreFiltro,
    carregando,
    salvando,
    erro,
    salvarDespesa,
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
          <p>Acompanhe receitas, despesas, resultado do período e formas de pagamento.</p>
        </div>
      </div>

      <div className="cliente-layout financeiro-layout">
        <div className="lista-clientes financeiro-filtros-bloco">
          <h2>Período e filtros</h2>
          <FinanceiroFiltros filtros={filtros} clientes={clientesAtivos} onAlterar={alterarFiltro} />
        </div>

        <DespesaForm onSalvar={salvarDespesa} salvando={salvando} />
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
