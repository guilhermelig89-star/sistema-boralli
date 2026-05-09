import { formatarMoeda } from "../services/financeiroService";

function FinanceiroResumo({ totaisFiltro, totaisMes }) {
  return (
    <div className="financeiro-resumo">
      <div className="card">
        <span>Receitas no período</span>
        <strong>{formatarMoeda(totaisFiltro.receitas)}</strong>
        <p>Entradas confirmadas</p>
      </div>

      <div className="card">
        <span>Despesas no período</span>
        <strong>{formatarMoeda(totaisFiltro.despesas)}</strong>
        <p>Saídas confirmadas</p>
      </div>

      <div className="card">
        <span>Resultado no período</span>
        <strong>{formatarMoeda(totaisFiltro.saldo)}</strong>
        <p>Receitas menos despesas</p>
      </div>

      <div className="card">
        <span>Receitas do mês</span>
        <strong>{formatarMoeda(totaisMes.receitas)}</strong>
        <p>Total confirmado no mês atual</p>
      </div>
    </div>
  );
}

export default FinanceiroResumo;
