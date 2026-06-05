function obterDataCriacao(item) {
  if (item?.criadoEm?.toDate) return item.criadoEm.toDate();
  if (item?.criadoEm?.seconds) return new Date(item.criadoEm.seconds * 1000);
  return null;
}

function formatarDataBrasil(dataIso) {
  if (!dataIso) return "";
  const [ano, mes, dia] = String(dataIso).split("-");
  if (!ano || !mes || !dia) return dataIso;
  return `${dia}/${mes}/${ano}`;
}

function formatarQuandoUsou(item) {
  if (item.agendamentoData) {
    return {
      destaque: formatarDataBrasil(item.agendamentoData),
      detalhe: item.agendamentoHora ? `às ${item.agendamentoHora}` : "horário não informado",
      origem: "Data do atendimento",
    };
  }

  const dataCriacao = obterDataCriacao(item);
  if (dataCriacao) {
    return {
      destaque: dataCriacao.toLocaleDateString("pt-BR"),
      detalhe: dataCriacao.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      origem: "Data do registro",
    };
  }

  return {
    destaque: "Data não informada",
    detalhe: "Abra o agendamento vinculado para conferir",
    origem: "Sem data salva",
  };
}

function ordenarHistoricoMaisRecente(historico = []) {
  return historico.slice().sort((a, b) => {
    const dataA = a.agendamentoData || "";
    const dataB = b.agendamentoData || "";
    const horaA = a.agendamentoHora || "";
    const horaB = b.agendamentoHora || "";
    const chaveAgendamento = `${dataB} ${horaB}`.localeCompare(`${dataA} ${horaA}`);

    if (chaveAgendamento !== 0) return chaveAgendamento;

    const criadoA = obterDataCriacao(a)?.getTime() || 0;
    const criadoB = obterDataCriacao(b)?.getTime() || 0;
    return criadoB - criadoA;
  });
}

function HistoricoPacotes({ historico, auditoria, consumoSelecionadoId, onSelecionarConsumo, onEstornarConsumo, estornando }) {
  const historicoOrdenado = ordenarHistoricoMaisRecente(historico);
  const auditoriaOrdenada = ordenarHistoricoMaisRecente(auditoria);

  return (
    <div className="lista-clientes bloco-pacotes">
      <h2>Histórico de uso (consumos ativos)</h2>
      <p className="texto-ajuda-pacotes">
        Data do uso em destaque, com cliente, combo/pacote, serviço e saldo logo abaixo.
      </p>

      <div className="lista-usos-pacotes" aria-label="Histórico de uso dos pacotes">
        {historicoOrdenado.length === 0 && (
          <div className="card-uso-pacote card-uso-pacote-vazio">
            <span>Nenhum uso registrado ainda.</span>
          </div>
        )}

        {historicoOrdenado.map((item) => {
          const quandoUsou = formatarQuandoUsou(item);

          return (
            <article
              className={`card-uso-pacote ${consumoSelecionadoId === item.id ? "card-uso-pacote-selecionado" : ""}`}
              key={item.id}
            >
              <div className="quando-uso-pacote" aria-label={`Usado em ${quandoUsou.destaque}`}>
                <span>Usado em</span>
                <strong>{quandoUsou.destaque}</strong>
                <small>{quandoUsou.detalhe}</small>
              </div>

              <div className="detalhes-uso-pacote">
                <div>
                  <span className="rotulo-uso-pacote">Cliente</span>
                  <strong>{item.clienteNome}</strong>
                </div>
                <div>
                  <span className="rotulo-uso-pacote">Combo/Pacote</span>
                  <strong>{item.pacoteNome}</strong>
                </div>
                <div>
                  <span className="rotulo-uso-pacote">Serviço utilizado</span>
                  <strong>{item.servicoNome}</strong>
                </div>
                <div className="resumo-saldo-uso-pacote">
                  <span>{item.quantidadeConsumida || 1} unidade usada</span>
                  <span>Saldo: {item.saldoAntes} → {item.saldoDepois}</span>
                  <small>{quandoUsou.origem}</small>
                </div>
              </div>

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
            </article>
          );
        })}
      </div>

      <div className="auditoria-historico-pacotes">
        <h3>Auditoria de estornos e cancelamentos</h3>
        <p className="texto-ajuda-pacotes">Registros abaixo não contam para uso/restante do pacote.</p>

        <div className="tabela-clientes">
          <div className="linha-historico cabecalho">
            <span>Usado em</span>
            <span>Cliente</span>
            <span>Pacote</span>
            <span>Serviço</span>
            <span>Status</span>
            <span>Motivo</span>
          </div>

          {auditoriaOrdenada.length === 0 && (
            <div className="linha-historico">
              <span>Nenhum estorno/cancelamento registrado.</span>
            </div>
          )}

          {auditoriaOrdenada.map((item) => {
            const quandoUsou = formatarQuandoUsou(item);

            return (
              <div className="linha-historico" key={`auditoria-${item.id}`}>
                <span>{quandoUsou.destaque} {quandoUsou.detalhe}</span>
                <strong>{item.clienteNome}</strong>
                <span>{item.pacoteNome}</span>
                <span>{item.servicoNome}</span>
                <span>{item.status || (item.estornado ? "estornado" : item.cancelado ? "cancelado" : "inativo")}</span>
                <span>{item.estornadoMotivo || "-"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HistoricoPacotes;
