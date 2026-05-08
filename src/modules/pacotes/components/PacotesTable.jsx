import { obterResumoItensPacote } from "../domain/pacotesDomain";

function PacotesTable({ pacotes, carregando, pacoteEstaAcabando }) {
  return (
    <div className="tabela-clientes">
      <div className="linha-pacote cabecalho">
        <span>Cliente</span>
        <span>Pacote vendido</span>
        <span>Serviços incluídos</span>
        <span>Uso do pacote</span>
        <span>Status</span>
      </div>

      {carregando && (
        <div className="linha-pacote">
          <span>Carregando pacotes vendidos...</span>
        </div>
      )}

      {!carregando && pacotes.length === 0 && (
        <div className="linha-pacote">
          <span>Nenhum pacote vendido encontrado.</span>
        </div>
      )}

      {!carregando &&
        pacotes.map((pacote) => {
          const acabando = pacoteEstaAcabando(pacote);

          return (
            <div className="linha-pacote" key={pacote.id}>
              <strong>{pacote.clienteNome}</strong>
              <span>{pacote.nome}</span>
              <span>{pacote.servicoNome}</span>
              <span>{obterResumoItensPacote(pacote)}</span>
              <span className={acabando ? "badge-tipo badge-alerta" : "badge-tipo badge-servico"}>
                {acabando ? "Saldo baixo" : pacote.status || "ativo"}
              </span>
            </div>
          );
        })}
    </div>
  );
}

export default PacotesTable;
