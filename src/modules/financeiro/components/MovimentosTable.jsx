import {
  formatarMoeda,
  formatarOrigem,
  formatarStatus,
  obterDataMovimento,
  obterValorPendente,
  obterValorRecebido,
} from "../services/financeiroService";

function statusClasse(status) {
  if (status === "cancelado") return "badge-tipo badge-alerta";
  if (status === "pendente" || status === "parcial") return "badge-tipo badge-combo";
  return "badge-tipo badge-servico";
}

function valorMovimento(movimento) {
  if (movimento.tipo === "despesa") return Number(movimento.valor || 0) * -1;
  return obterValorRecebido(movimento);
}

function MovimentosTable({ movimentos, carregando }) {
  return (
    <div className="tabela-clientes">
      <div className="linha-financeiro cabecalho">
        <span>Data</span>
        <span>Cliente</span>
        <span>Origem</span>
        <span>Forma</span>
        <span>Recebido</span>
        <span>Status</span>
      </div>

      {carregando && (
        <div className="linha-financeiro">
          <span>Carregando financeiro...</span>
        </div>
      )}

      {!carregando && movimentos.length === 0 && (
        <div className="linha-financeiro">
          <span>Nenhum movimento financeiro encontrado.</span>
        </div>
      )}

      {!carregando && movimentos.map((movimento) => {
        const pendente = obterValorPendente(movimento);

        return (
          <div className="linha-financeiro" key={movimento.id}>
            <strong>{obterDataMovimento(movimento) || "Sem data"}</strong>
            <span>{movimento.clienteNome || "-"}</span>
            <span>
              {formatarOrigem(movimento.origem)}
              {movimento.categoria && <small>Categoria: {movimento.categoria}</small>}
              {movimento.descricao && <small>{movimento.descricao}</small>}
              {Number(movimento.descontoValor || 0) > 0 && <small>Desconto: {formatarMoeda(movimento.descontoValor)}</small>}
              {pendente > 0 && <small>Pendente: {formatarMoeda(pendente)}</small>}
            </span>
            <span>{movimento.formaPagamento || "-"}</span>
            <span className={`valor-financeiro${movimento.tipo === "despesa" ? " valor-despesa" : ""}`}>
              {formatarMoeda(valorMovimento(movimento))}
            </span>
            <span className={statusClasse(movimento.status || "pago")}>
              {formatarStatus(movimento.status || "pago")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default MovimentosTable;
