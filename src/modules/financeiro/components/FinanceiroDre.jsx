import { formatarMoeda, formatarPercentual } from "../services/financeiroService";

function LinhaDre({ nome, valor, destaque, negativo }) {
  return (
    <div className={`linha-dre${destaque ? " destaque" : ""}${negativo ? " negativo" : ""}`}>
      <span>{nome}</span>
      <strong>{formatarMoeda(valor)}</strong>
    </div>
  );
}

function ListaAnalise({ titulo, itens = [], campoNome }) {
  return (
    <div className="painel-analise-financeira">
      <h3>{titulo}</h3>

      {itens.length === 0 && <p className="texto-vazio-financeiro">Nenhum valor encontrado no período.</p>}

      {itens.map((item) => (
        <div className="linha-analise-financeira" key={item[campoNome]}>
          <div>
            <strong>{item[campoNome]}</strong>
            <span>{item.quantidade} movimento{item.quantidade === 1 ? "" : "s"}</span>
          </div>
          <div>
            <strong>{formatarMoeda(item.valor)}</strong>
            <span>{formatarPercentual(item.percentual)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function FinanceiroDre({ dre }) {
  return (
    <div className="financeiro-dre">
      <div className="dre-cards">
        <div className="card card-dre-principal">
          <span>Resultado líquido</span>
          <strong>{formatarMoeda(dre.resultadoLiquido)}</strong>
          <p>Recebido menos despesas no filtro</p>
        </div>

        <div className="card">
          <span>Pendente</span>
          <strong>{formatarMoeda(dre.pendente)}</strong>
          <p>Valores ainda não recebidos</p>
        </div>

        <div className="card">
          <span>Descontos</span>
          <strong>{formatarMoeda(dre.descontos)}</strong>
          <p>Descontos concedidos no fechamento</p>
        </div>

        <div className="card">
          <span>Ticket médio recebido</span>
          <strong>{formatarMoeda(dre.ticketMedio)}</strong>
          <p>Média por receita ativa</p>
        </div>
      </div>

      <div className="dre-layout">
        <div className="painel-dre">
          <div className="cabecalho-dre">
            <div>
              <h2>DRE do período</h2>
              <p>Resultado baseado no dinheiro recebido, com pendências e descontos separados.</p>
            </div>
          </div>

          <div className="linhas-dre">
            <LinhaDre nome="Recebido" valor={dre.recebido} destaque />
            <LinhaDre nome="Pacotes vendidos" valor={dre.vendaPacotes} />
            <LinhaDre nome="Atendimentos avulsos" valor={dre.atendimentosAvulsos} />
            <LinhaDre nome="Outras receitas" valor={dre.outrasReceitas} />
            <LinhaDre nome="Pendente em aberto" valor={dre.pendente} />
            <LinhaDre nome="Descontos concedidos" valor={dre.descontos} negativo />
            <LinhaDre nome="Despesas" valor={dre.despesas} negativo />
            <LinhaDre nome="Resultado líquido" valor={dre.resultadoLiquido} destaque />
          </div>
        </div>

        <div className="analises-financeiras">
          <ListaAnalise titulo="Recebido por forma de pagamento" itens={dre.porFormaPagamento} campoNome="forma" />
          <ListaAnalise titulo="Recebido por origem" itens={dre.porOrigem} campoNome="origem" />
          <ListaAnalise titulo="Despesas por categoria" itens={dre.porCategoriaDespesa} campoNome="categoria" />
        </div>
      </div>
    </div>
  );
}

export default FinanceiroDre;
