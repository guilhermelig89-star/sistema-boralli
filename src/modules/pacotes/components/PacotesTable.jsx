import { obterResumoItensPacote } from "../domain/pacotesDomain";

function obterStatusPacote(pacote, calcularSaldoPacote, pacoteEstaAcabando) {
  if (pacote.status === "esgotado" || calcularSaldoPacote(pacote) <= 0) {
    return { texto: "Finalizado", classe: "badge-tipo badge-finalizado" };
  }

  if (pacoteEstaAcabando(pacote)) {
    return { texto: "Saldo baixo", classe: "badge-tipo badge-alerta" };
  }

  return { texto: "Ativo", classe: "badge-tipo badge-servico" };
}

function PacotesTable({
  pacotes,
  carregando,
  mensagemVazia,
  calcularSaldoPacote,
  pacoteEstaAcabando,
}) {
  return (
    <div className="tabela-clientes">
      <div className="linha-pacote cabecalho">
        <span>Cliente</span>
        <span>Pacote</span>
        <span>Itens do pacote</span>
        <span>Saldo</span>
        <span>Status</span>
      </div>

      {carregando && (
        <div className="linha-pacote">
          <span>Carregando pacotes...</span>
        </div>
      )}

      {!carregando && pacotes.length === 0 && (
        <div className="linha-pacote">
          <span>{mensagemVazia || "Nenhum pacote encontrado para este filtro."}</span>
        </div>
      )}

      {!carregando &&
        pacotes.map((pacote) => {
          const status = obterStatusPacote(pacote, calcularSaldoPacote, pacoteEstaAcabando);

          return (
            <div className="linha-pacote" key={pacote.id}>
              <strong>{pacote.clienteNome}</strong>
              <span>{pacote.nome}</span>
              <span>{pacote.servicoNome}</span>
              <span>{obterResumoItensPacote(pacote)}</span>
              <span className={status.classe}>{status.texto}</span>
            </div>
          );
        })}
    </div>
  );
}

export default PacotesTable;
