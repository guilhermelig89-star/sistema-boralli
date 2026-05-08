import { useState } from "react";

import { useClientes } from "../clientes/hooks/useClientes";
import "./financeiro.css";
import FinanceiroFiltros from "./components/FinanceiroFiltros";
import FinanceiroResumo from "./components/FinanceiroResumo";
import MovimentosTable from "./components/MovimentosTable";
import { useFinanceiro } from "./hooks/useFinanceiro";

const filtrosIniciais = {
  dataInicio: "",
  dataFim: "",
  clienteId: "",
  origem: "sistema",
  status: "confirmado",
  pesquisa: "",
};

function FinanceiroPage() {
  const [filtros, setFiltros] = useState(filtrosIniciais);
  const { clientesAtivos } = useClientes();
  const {
    movimentosFiltrados,
    totaisFiltro,
    totaisMes,
    carregando,
    erro,
  } = useFinanceiro(filtros);

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

  return (
    <div>
      <div className="topo-clientes">
        <div>
          <h1>Financeiro</h1>
          <p>Acompanhe receitas de pacotes, atendimentos avulsos e formas de pagamento.</p>
        </div>
      </div>

      <div className="cliente-layout">
        <FinanceiroResumo totaisFiltro={totaisFiltro} totaisMes={totaisMes} />

        <div className="lista-clientes">
          <h2>Movimentos financeiros</h2>
          <FinanceiroFiltros filtros={filtros} clientes={clientesAtivos} onAlterar={alterarFiltro} />
          {erro && <p>{erro}</p>}
          <MovimentosTable movimentos={movimentosFiltrados} carregando={carregando} />
        </div>
      </div>
    </div>
  );
}

export default FinanceiroPage;
