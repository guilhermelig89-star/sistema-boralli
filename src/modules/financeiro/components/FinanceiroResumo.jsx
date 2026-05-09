import { formatarMoeda } from "../services/financeiroService";

function FinanceiroResumo({ totaisFiltro, totaisMes }) {
  return (
    <div className="financeiro-resumo">
      <div className="card">
        <span>Recebido no período</span>
        <strong>{formatarMoeda(totaisFiltro.recebido)}</strong>
        <p>Dinheiro realmente recebido</p>
      </div>

      <div className="card">
        <span>Pendente no período</span>
        <strong>{formatarMoeda(totaisFiltro.pendente)}</strong>
        <p>Valores em aberto ou parciais</p>
      </div>

      <div className="card">
        <span>Descontos concedidos</span>
        <strong>{formatarMoeda(totaisFiltro.descontos)}</strong>
        <p>Descontos manuais no fechamento</p>
      </div>

      <div className="card">
        <span>Resultado no período</span>
        <strong>{formatarMoeda(totaisFiltro.saldo)}</strong>
        <p>Recebido menos despesas</p>
      </div>

      <div className="card">
        <span>Despesas no período</span>
        <strong>{formatarMoeda(totaisFiltro.despesas)}</strong>
        <p>Saídas registradas</p>
      </div>

      <div className="card">
        <span>Recebido no mês</span>
        <strong>{formatarMoeda(totaisMes.recebido)}</strong>
        <p>Total recebido no mês atual</p>
      </div>
    </div>
  );
}

export default FinanceiroResumo;
