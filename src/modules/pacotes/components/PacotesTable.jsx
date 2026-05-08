function PacotesTable({ pacotes, carregando, calcularSaldoPacote, pacoteEstaAcabando }) {
  return (
    <div className="tabela-clientes">
      <div className="linha-pacote cabecalho">
        <span>Cliente</span>
        <span>Pacote</span>
        <span>Serviço</span>
        <span>Uso</span>
        <span>Status</span>
      </div>

      {carregando && (
        <div className="linha-pacote">
          <span>Carregando pacotes...</span>
        </div>
      )}

      {!carregando && pacotes.length === 0 && (
        <div className="linha-pacote">
          <span>Nenhum pacote encontrado.</span>
        </div>
      )}

      {!carregando &&
        pacotes.map((pacote) => {
          const saldo = calcularSaldoPacote(pacote);
          const acabando = pacoteEstaAcabando(pacote);

          return (
            <div className="linha-pacote" key={pacote.id}>
              <strong>{pacote.clienteNome}</strong>
              <span>{pacote.nome}</span>
              <span>{pacote.servicoNome}</span>
              <span>
                {pacote.quantidadeUtilizada || 0}/{pacote.quantidadeTotal || 0} usado - {saldo} restante
              </span>
              <span className={acabando ? "badge-tipo badge-alerta" : "badge-tipo badge-servico"}>
                {acabando ? "Acabando" : pacote.status || "ativo"}
              </span>
            </div>
          );
        })}
    </div>
  );
}

export default PacotesTable;
