function HistoricoPacotes({ historico, auditoria, consumoSelecionadoId, onSelecionarConsumo, onEstornarConsumo, estornando }) {
  return (
    <div className="lista-clientes bloco-pacotes">
      <h2>Histórico de uso (consumos ativos)</h2>
      <p className="texto-ajuda-pacotes">Veja apenas usos válidos que contam no saldo atual do pacote.</p>

      <div className="tabela-clientes">
        <div className="linha-historico cabecalho">
          <span>Cliente</span>
          <span>Pacote</span>
          <span>Serviço utilizado</span>
          <span>Quantidade</span>
          <span>Saldo após uso</span>
          <span>Ação</span>
        </div>

        {historico.length === 0 && (
          <div className="linha-historico">
            <span>Nenhum uso registrado ainda.</span>
          </div>
        )}

        {historico.map((item) => (
          <div className={`linha-historico ${consumoSelecionadoId === item.id ? "linha-historico-selecionada" : ""}`} key={item.id}>
            <strong>{item.clienteNome}</strong>
            <span>{item.pacoteNome}</span>
            <span>{item.servicoNome}</span>
            <span>{item.quantidadeConsumida || 1} unidade</span>
            <span>
              {item.saldoAntes} para {item.saldoDepois}
            </span>
            <div className="acoes-historico-pacotes">
              {item.estornado ? (
                <span className="badge-finalizado">Estornado</span>
              ) : (
                <>
                  <button type="button" onClick={() => onSelecionarConsumo(item.id)}>
                    {consumoSelecionadoId === item.id ? "Selecionado" : "Selecionar"}
                  </button>
                  <button
                    type="button"
                    className="botao-estorno"
                    disabled={consumoSelecionadoId !== item.id || estornando}
                    onClick={() => onEstornarConsumo(item)}
                  >
                    Estornar consumo
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="auditoria-historico-pacotes">
        <h3>Auditoria de estornos e cancelamentos</h3>
        <p className="texto-ajuda-pacotes">Registros abaixo não contam para uso/restante do pacote.</p>

        <div className="tabela-clientes">
          <div className="linha-historico cabecalho">
            <span>Cliente</span>
            <span>Pacote</span>
            <span>Serviço</span>
            <span>Quantidade</span>
            <span>Status</span>
            <span>Motivo</span>
          </div>

          {auditoria.length === 0 && (
            <div className="linha-historico">
              <span>Nenhum estorno/cancelamento registrado.</span>
            </div>
          )}

          {auditoria.map((item) => (
            <div className="linha-historico" key={`auditoria-${item.id}`}>
              <strong>{item.clienteNome}</strong>
              <span>{item.pacoteNome}</span>
              <span>{item.servicoNome}</span>
              <span>{item.quantidadeConsumida || 1} unidade</span>
              <span>{item.status || (item.estornado ? "estornado" : item.cancelado ? "cancelado" : "inativo")}</span>
              <span>{item.estornadoMotivo || "-"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HistoricoPacotes;
