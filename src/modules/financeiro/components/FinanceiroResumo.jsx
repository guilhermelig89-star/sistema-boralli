import { formatarMoeda } from "../services/financeiroService";

function FinanceiroResumo({ totaisFiltro, totaisMes }) {
  return (
    <div className="financeiro-resumo">
      <div className="card">
        <span>Receitas no filtro</span>
        <strong>{formatarMoeda(totaisFiltro.receitas)}</strong>
        <p>Entradas confirmadas</p>
      </div>

      <div className="card">
        <span>Receitas do mês</span>
        <strong>{formatarMoeda(totaisMes.receitas)}</strong>
        <p>Total confirmado no mês atual</p>
      </div>

      <div className="card">
        <span>Venda de pacotes</span>
        <strong>{formatarMoeda(totaisFiltro.pacotes)}</strong>
        <p>Combos vendidos no filtro</p>
      </div>

      <div className="card">
        <span>Atendimentos avulsos</span>
        <strong>{formatarMoeda(totaisFiltro.avulsos)}</strong>
        <p>Pagamentos avulsos no filtro</p>
      </div>
    </div>
  );
}

export default FinanceiroResumo;
