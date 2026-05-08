import {
  formatarMoeda,
  formatarOrigem,
  formatarStatus,
  obterDataMovimento,
} from "../services/financeiroService";

function statusClasse(status) {
  if (status === "cancelado") return "badge-tipo badge-alerta";
  if (status === "pendente") return "badge-tipo badge-combo";
  return "badge-tipo badge-servico";
}

function MovimentosTable({ movimentos, carregando }) {
  return (
    <div className="tabela-clientes">
      <div className="linha-financeiro cabecalho">
        <span>Data</span>
        <span>Cliente</span>
        <span>Origem</span>
        <span>Forma</span>
        <span>Valor</span>
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

      {!carregando && movimentos.map((movimento) => (
        <div className="linha-financeiro" key={movimento.id}>
          <strong>{obterDataMovimento(movimento) || "Sem data"}</strong>
          <span>{movimento.clienteNome || "-"}</span>
          <span>
            {formatarOrigem(movimento.origem)}
            {movimento.descricao && <small>{movimento.descricao}</small>}
          </span>
          <span>{movimento.formaPagamento || "-"}</span>
          <span className="valor-financeiro">{formatarMoeda(movimento.valor)}</span>
          <span className={statusClasse(movimento.status || "confirmado")}>
            {formatarStatus(movimento.status || "confirmado")}
          </span>
        </div>
      ))}
    </div>
  );
}

export default MovimentosTable;
