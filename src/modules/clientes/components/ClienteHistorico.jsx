function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataHora(item) {
  if (item.data) {
    return `${item.data}${item.hora ? ` ${item.hora}` : ""}`;
  }

  if (item.criadoEm?.toDate) {
    return item.criadoEm.toDate().toLocaleDateString("pt-BR");
  }

  return "-";
}

function statusPacote(pacote, calcularSaldoPacote) {
  const saldo = calcularSaldoPacote(pacote);
  if (saldo <= 0 || pacote.status === "esgotado") return "Finalizado";
  return `${saldo} restante`;
}

function ClienteHistorico({
  cliente,
  agendamentos,
  pacotes,
  historicoPacotes,
  movimentos,
  calcularSaldoPacote,
  onFechar,
}) {
  if (!cliente) return null;

  const agendamentosCliente = agendamentos
    .filter((item) => item.clienteId === cliente.id)
    .slice()
    .reverse()
    .slice(0, 6);
  const pacotesCliente = pacotes.filter((item) => item.clienteId === cliente.id);
  const historicoCliente = historicoPacotes
    .filter((item) => item.clienteId === cliente.id)
    .slice()
    .reverse()
    .slice(0, 6);
  const movimentosCliente = movimentos
    .filter((item) => item.clienteId === cliente.id)
    .slice(0, 6);

  return (
    <section className="lista-clientes historico-cliente">
      <div className="topo-historico-cliente">
        <div>
          <h2>Histórico da cliente</h2>
          <p>{cliente.nome}</p>
        </div>
        <button type="button" onClick={onFechar}>Fechar</button>
      </div>

      <div className="grade-historico-cliente">
        <div className="bloco-historico-cliente">
          <h3>Resumo</h3>
          <div className="resumo-historico-cliente">
            <span>{agendamentosCliente.length} últimos agendamentos</span>
            <span>{pacotesCliente.length} pacotes vendidos</span>
            <span>{movimentosCliente.length} movimentos financeiros</span>
          </div>
        </div>

        <div className="bloco-historico-cliente">
          <h3>Pacotes</h3>
          {pacotesCliente.length === 0 && <p>Nenhum pacote vendido para esta cliente.</p>}
          {pacotesCliente.map((pacote) => (
            <div className="item-historico-cliente" key={pacote.id}>
              <strong>{pacote.nome}</strong>
              <span>{statusPacote(pacote, calcularSaldoPacote)}</span>
            </div>
          ))}
        </div>

        <div className="bloco-historico-cliente">
          <h3>Agendamentos</h3>
          {agendamentosCliente.length === 0 && <p>Nenhum agendamento encontrado.</p>}
          {agendamentosCliente.map((agendamento) => (
            <div className="item-historico-cliente" key={agendamento.id}>
              <strong>{agendamento.servicoNome || "Atendimento"}</strong>
              <span>{formatarDataHora(agendamento)} - {agendamento.status || "agendado"}</span>
            </div>
          ))}
        </div>

        <div className="bloco-historico-cliente">
          <h3>Uso de pacotes</h3>
          {historicoCliente.length === 0 && <p>Nenhum consumo de pacote registrado.</p>}
          {historicoCliente.map((item) => (
            <div className="item-historico-cliente" key={item.id}>
              <strong>{item.servicoNome}</strong>
              <span>{item.pacoteNome} - {item.saldoAntes} para {item.saldoDepois}</span>
            </div>
          ))}
        </div>

        <div className="bloco-historico-cliente">
          <h3>Financeiro</h3>
          {movimentosCliente.length === 0 && <p>Nenhum movimento financeiro encontrado.</p>}
          {movimentosCliente.map((movimento) => (
            <div className="item-historico-cliente" key={movimento.id}>
              <strong>{formatarMoeda(movimento.valor)}</strong>
              <span>{movimento.descricao || movimento.origem || "Movimento"}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ClienteHistorico;
