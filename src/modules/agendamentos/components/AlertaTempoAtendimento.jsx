import "./tempoAtendimento.css";

function formatarMinutos(valor) {
  return `${Number(valor || 0)} min`;
}

function AlertaTempoAtendimento({ alerta, onFechar, onAjustarCliente, onRevisarServico }) {
  if (!alerta) return null;

  const tempoNaoConfiavel = alerta.tempoValidoParaSugestao === false;

  return (
    <div className="modal-tempo-backdrop" role="presentation">
      <section className={`modal-tempo modal-tempo-${alerta.alertaTempoClasse || "leve"}`} role="dialog" aria-modal="true">
        <div className="modal-tempo-topo">
          <div>
            <span>Tempo de atendimento</span>
            <h2>{alerta.alertaTempoTitulo || "Revisar tempo"}</h2>
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar alerta">
            Fechar
          </button>
        </div>

        <div className="modal-tempo-resumo">
          <div>
            <span>Previsto</span>
            <strong>{formatarMinutos(alerta.tempoPrevistoMinutos)}</strong>
          </div>
          <div>
            <span>Real</span>
            <strong>{formatarMinutos(alerta.tempoRealMinutos)}</strong>
          </div>
          <div>
            <span>Diferença</span>
            <strong>{alerta.diferencaPercentualAbs}%</strong>
          </div>
        </div>

        <p className="modal-tempo-texto">
          {tempoNaoConfiavel ? (
            <>
              Esse tempo parece ter sido registrado depois do atendimento. Por segurança, ele não será usado
              pela inteligência nem alterará as próximas sugestões de horário.
            </>
          ) : (
            <>
              O atendimento de {alerta.clienteNome} em {alerta.servicoNome} ficou diferente do previsto.
              Deseja usar essa informação para melhorar as próximas sugestões?
            </>
          )}
        </p>

        <div className="modal-tempo-acoes">
          <button type="button" className="botao-tempo-neutro" onClick={onFechar}>
            {tempoNaoConfiavel ? "Entendi" : "Manter tempo atual"}
          </button>
          {!tempoNaoConfiavel && (
            <>
              <button type="button" className="botao-tempo-cliente" onClick={onAjustarCliente}>
                Ajustar só esta cliente
              </button>
              <button type="button" className="botao-tempo-geral" onClick={onRevisarServico}>
                Revisar padrão do serviço
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default AlertaTempoAtendimento;
