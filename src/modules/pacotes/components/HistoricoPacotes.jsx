function HistoricoPacotes({ historico }) {
  return (
    <div className="lista-clientes bloco-pacotes">
      <h2>Histórico de uso dos pacotes</h2>
      <p className="texto-ajuda-pacotes">Cada linha mostra um serviço consumido quando um atendimento é finalizado.</p>

      <div className="tabela-clientes">
        <div className="linha-historico cabecalho">
          <span>Cliente</span>
          <span>Pacote</span>
          <span>Serviço usado</span>
          <span>Consumo</span>
          <span>Saldo</span>
        </div>

        {historico.length === 0 && (
          <div className="linha-historico">
            <span>Nenhum consumo registrado.</span>
          </div>
        )}

        {historico.map((item) => (
          <div className="linha-historico" key={item.id}>
            <strong>{item.clienteNome}</strong>
            <span>{item.pacoteNome}</span>
            <span>{item.servicoNome}</span>
            <span>{item.quantidadeConsumida || 1} unidade</span>
            <span>
              {item.saldoAntes} para {item.saldoDepois}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HistoricoPacotes;
