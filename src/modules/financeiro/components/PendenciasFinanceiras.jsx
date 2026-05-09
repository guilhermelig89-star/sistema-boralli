import { useMemo, useState } from "react";

import {
  FORMAS_RECEBIMENTO_PENDENCIA,
  formatarMoeda,
  formatarOrigem,
  obterDataMovimento,
  obterValorPendente,
  obterValorRecebido,
} from "../services/financeiroService";

function obterHoje() {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function estadoInicialPendencia(movimento) {
  return {
    valor: obterValorPendente(movimento),
    formaPagamento: "Pix",
    data: obterHoje(),
    observacao: "",
  };
}

function PendenciasFinanceiras({ movimentos, carregando, salvando, onRegistrarPagamento }) {
  const [formularios, setFormularios] = useState({});

  const pendencias = useMemo(
    () =>
      movimentos
        .filter((movimento) => movimento.tipo === "receita" && obterValorPendente(movimento) > 0)
        .sort((a, b) => obterDataMovimento(a).localeCompare(obterDataMovimento(b))),
    [movimentos]
  );

  const totalPendente = useMemo(
    () => pendencias.reduce((total, movimento) => total + obterValorPendente(movimento), 0),
    [pendencias]
  );

  function obterFormulario(movimento) {
    return formularios[movimento.id] || estadoInicialPendencia(movimento);
  }

  function alterarFormulario(movimento, campo, valor) {
    setFormularios((atuais) => ({
      ...atuais,
      [movimento.id]: {
        ...obterFormulario(movimento),
        [campo]: valor,
      },
    }));
  }

  async function registrar(movimento) {
    const dados = obterFormulario(movimento);

    await onRegistrarPagamento(movimento.id, dados);

    setFormularios((atuais) => {
      const novos = { ...atuais };
      delete novos[movimento.id];
      return novos;
    });
  }

  return (
    <section className="lista-clientes pendencias-financeiras">
      <div className="cabecalho-pendencias-financeiras">
        <div>
          <h2>A receber</h2>
          <p>Atendimentos finalizados que ainda não entraram no caixa.</p>
        </div>
        <strong>{formatarMoeda(totalPendente)}</strong>
      </div>

      {carregando && <p>Carregando pendências...</p>}

      {!carregando && pendencias.length === 0 && (
        <div className="pendencia-vazia">Nenhuma pendência em aberto no momento.</div>
      )}

      {!carregando && pendencias.map((movimento) => {
        const formulario = obterFormulario(movimento);
        const pendente = obterValorPendente(movimento);
        const recebido = obterValorRecebido(movimento);

        return (
          <article className="card-pendencia-financeira" key={movimento.id}>
            <div className="dados-pendencia-financeira">
              <div>
                <span>{obterDataMovimento(movimento) || "Sem data"}</span>
                <h3>{movimento.clienteNome || "Cliente não informado"}</h3>
                <p>{movimento.servicoNome || movimento.descricao || formatarOrigem(movimento.origem)}</p>
              </div>
              <div className="valores-pendencia-financeira">
                <span>Recebido: {formatarMoeda(recebido)}</span>
                <strong>Pendente: {formatarMoeda(pendente)}</strong>
              </div>
            </div>

            <div className="form-pendencia-financeira">
              <label>
                <span>Valor recebido</span>
                <input
                  type="number"
                  min="0"
                  max={pendente}
                  value={formulario.valor}
                  onChange={(event) => alterarFormulario(movimento, "valor", event.target.value)}
                />
              </label>

              <label>
                <span>Forma</span>
                <select
                  value={formulario.formaPagamento}
                  onChange={(event) => alterarFormulario(movimento, "formaPagamento", event.target.value)}
                >
                  {FORMAS_RECEBIMENTO_PENDENCIA.map((forma) => (
                    <option key={forma} value={forma}>{forma}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Data do recebimento</span>
                <input
                  type="date"
                  value={formulario.data}
                  onChange={(event) => alterarFormulario(movimento, "data", event.target.value)}
                />
              </label>

              <label>
                <span>Observação</span>
                <input
                  placeholder="Opcional"
                  value={formulario.observacao}
                  onChange={(event) => alterarFormulario(movimento, "observacao", event.target.value)}
                />
              </label>

              <button type="button" onClick={() => registrar(movimento)} disabled={salvando}>
                Registrar pagamento
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default PendenciasFinanceiras;
