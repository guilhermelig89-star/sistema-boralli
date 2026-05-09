function HistoricoPacotes({ historico }) {
  return (
    <div className="lista-clientes bloco-pacotes">
      <h2>Histórico de uso</h2>
      <p className="texto-ajuda-pacotes">Veja quais serviços foram descontados dos pacotes finalizados na agenda.</p>

      <div className="tabela-clientes">
        <div className="linha-historico cabecalho">
          <span>Cliente</span>
          <span>Pacote</span>
          <span>Serviço utilizado</span>
          <span>Quantidade</span>
          <span>Saldo após uso</span>
        </div>

        {historico.length === 0 && (
          <div className="linha-historico">
            <span>Nenhum uso registrado ainda.</span>
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
