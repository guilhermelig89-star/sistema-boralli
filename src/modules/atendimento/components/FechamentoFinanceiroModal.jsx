import { useMemo, useState } from "react";

import {
  calcularFechamentoFinanceiro,
  FORMAS_PAGAMENTO_FECHAMENTO,
  prepararFechamentoFinanceiro,
} from "../services/fechamentoFinanceiroService";
import "./fechamentoFinanceiro.css";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function criarPagamentoInicial() {
  return [{ forma: "Fiado/Pendente", valor: 0 }];
}

function statusTexto(status) {
  if (status === "pago") return "Pago";
  if (status === "parcial") return "Parcial";
  return "Pendente";
}

function calcularDescontoPeloFinal(valorOriginal, valorFinal) {
  const original = Number(valorOriginal || 0);
  const final = Number(valorFinal || 0);
  if (!Number.isFinite(original) || !Number.isFinite(final)) return 0;
  return Math.max(0, original - Math.min(original, final));
}

function calcularFinalPeloDesconto(valorOriginal, desconto) {
  const original = Number(valorOriginal || 0);
  const descontoNumerico = Number(desconto || 0);
  if (!Number.isFinite(original) || !Number.isFinite(descontoNumerico)) return original;
  return Math.max(0, original - Math.min(original, descontoNumerico));
}

function FechamentoFinanceiroModal({ agendamento, pacote, onFechar, onConfirmar }) {
  const valorBase = pacote ? 0 : Number(agendamento?.valor || 0);
  const [descontoValor, setDescontoValor] = useState(0);
  const [valorFinalCobrado, setValorFinalCobrado] = useState(valorBase);
  const [motivoDesconto, setMotivoDesconto] = useState("");
  const [pagamentos, setPagamentos] = useState(criarPagamentoInicial);
  const [observacoesFinanceiras, setObservacoesFinanceiras] = useState("");
  const [salvando, setSalvando] = useState(false);

  const fechamento = useMemo(
    () =>
      calcularFechamentoFinanceiro({
        valorOriginal: valorBase,
        descontoValor,
        valorFinalManual: valorFinalCobrado,
        pagamentos,
      }),
    [descontoValor, pagamentos, valorBase, valorFinalCobrado]
  );

  if (!agendamento) return null;

  function sincronizarPagamentoIntegral(novoValorFinal, valorFinalAnterior) {
    setPagamentos((atuais) => {
      if (atuais.length !== 1 || atuais[0].forma === "Fiado/Pendente") return atuais;

      const valorAtual = Number(atuais[0].valor || 0);
      const valorAnterior = Number(valorFinalAnterior || 0);

      if (valorAtual !== valorAnterior) return atuais;

      return [{ ...atuais[0], valor: novoValorFinal }];
    });
  }

  function alterarDesconto(valor) {
    const novoValorFinal = calcularFinalPeloDesconto(valorBase, valor);
    sincronizarPagamentoIntegral(novoValorFinal, fechamento.valorFinal);
    setDescontoValor(valor);
    setValorFinalCobrado(novoValorFinal);
  }

  function alterarValorFinal(valor) {
    sincronizarPagamentoIntegral(valor, fechamento.valorFinal);
    setValorFinalCobrado(valor);
    setDescontoValor(calcularDescontoPeloFinal(valorBase, valor));
  }

  function marcarPagoAgora() {
    setPagamentos([{ forma: "Pix", valor: fechamento.valorFinal }]);
  }

  function marcarParcial() {
    setPagamentos([{ forma: "Pix", valor: "" }]);
  }

  function marcarReceberDepois() {
    setPagamentos([{ forma: "Fiado/Pendente", valor: 0 }]);
    if (!observacoesFinanceiras) {
      setObservacoesFinanceiras("Cliente ficou de pagar depois.");
    }
  }

  function alterarPagamento(indice, campo, valor) {
    setPagamentos((atuais) =>
      atuais.map((pagamento, pagamentoIndice) =>
        pagamentoIndice === indice ? { ...pagamento, [campo]: valor } : pagamento
      )
    );
  }

  function adicionarPagamento() {
    setPagamentos((atuais) => [...atuais, { forma: "Pix", valor: "" }]);
  }

  function removerPagamento(indice) {
    setPagamentos((atuais) => atuais.filter((_, pagamentoIndice) => pagamentoIndice !== indice));
  }

  async function confirmar() {
    setSalvando(true);

    try {
      await onConfirmar(
        prepararFechamentoFinanceiro({
          valorOriginal: valorBase,
          descontoValor,
          valorFinalManual: valorFinalCobrado,
          motivoDesconto,
          pagamentos,
          observacoesFinanceiras,
        })
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fechamento-backdrop" role="presentation">
      <section className="fechamento-modal" role="dialog" aria-modal="true">
        <div className="fechamento-topo">
          <div>
            <span>Fechamento financeiro</span>
            <h2>{agendamento.clienteNome}</h2>
            <p>{agendamento.servicoNome}</p>
          </div>
          <button type="button" onClick={onFechar}>Fechar</button>
        </div>

        {pacote && (
          <div className="fechamento-aviso-pacote">
            Atendimento vinculado a pacote. O consumo será registrado, mas não será lançado como recebido agora.
          </div>
        )}

        {!pacote && (
          <div className="fechamento-atalhos" aria-label="Ações rápidas de fechamento">
            <button type="button" onClick={marcarPagoAgora}>Pago agora</button>
            <button type="button" onClick={marcarParcial}>Pagamento parcial</button>
            <button type="button" onClick={marcarReceberDepois}>Receber depois</button>
          </div>
        )}

        <div className="fechamento-grid">
          <label>
            <span>Valor original</span>
            <input type="number" value={valorBase} disabled />
          </label>

          <label>
            <span>Desconto aplicado</span>
            <input
              type="number"
              min="0"
              value={descontoValor}
              onChange={(e) => alterarDesconto(e.target.value)}
              disabled={pacote}
            />
          </label>

          <label>
            <span>Valor final cobrado</span>
            <input
              type="number"
              min="0"
              value={valorFinalCobrado}
              onChange={(e) => alterarValorFinal(e.target.value)}
              disabled={pacote}
            />
          </label>

          <label>
            <span>Motivo do desconto</span>
            <input
              placeholder="Opcional"
              value={motivoDesconto}
              onChange={(e) => setMotivoDesconto(e.target.value)}
              disabled={pacote}
            />
          </label>
        </div>

        <div className="fechamento-resumo">
          <div>
            <span>Valor final</span>
            <strong>{formatarMoeda(fechamento.valorFinal)}</strong>
          </div>
          <div>
            <span>Recebido</span>
            <strong>{formatarMoeda(fechamento.valorRecebido)}</strong>
          </div>
          <div className={fechamento.valorPendente > 0 ? "pendente" : "pago"}>
            <span>Restante</span>
            <strong>{formatarMoeda(fechamento.valorPendente)}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{statusTexto(fechamento.statusFinanceiro)}</strong>
          </div>
        </div>

        {!pacote && (
          <div className="fechamento-pagamentos">
            <div className="fechamento-subtopo">
              <div>
                <h3>Pagamentos</h3>
                <p>Informe uma ou mais formas usadas pela cliente.</p>
              </div>
              <button type="button" onClick={adicionarPagamento}>Adicionar forma</button>
            </div>

            {pagamentos.map((pagamento, indice) => (
              <div className="linha-pagamento-fechamento" key={`${pagamento.forma}-${indice}`}>
                <select
                  value={pagamento.forma}
                  onChange={(e) => alterarPagamento(indice, "forma", e.target.value)}
                >
                  {FORMAS_PAGAMENTO_FECHAMENTO.map((forma) => (
                    <option key={forma} value={forma}>{forma}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder="Valor recebido"
                  value={pagamento.valor}
                  onChange={(e) => alterarPagamento(indice, "valor", e.target.value)}
                  disabled={pagamento.forma === "Fiado/Pendente"}
                />
                {pagamentos.length > 1 && (
                  <button type="button" onClick={() => removerPagamento(indice)}>Remover</button>
                )}
              </div>
            ))}
          </div>
        )}

        <label className="fechamento-observacoes">
          <span>Observações financeiras</span>
          <textarea
            placeholder="Ex.: cliente ficou de pagar o restante amanhã"
            value={observacoesFinanceiras}
            onChange={(e) => setObservacoesFinanceiras(e.target.value)}
          />
        </label>

        <div className="fechamento-acoes">
          <button type="button" className="fechamento-cancelar" onClick={onFechar} disabled={salvando}>
            Cancelar
          </button>
          <button type="button" className="fechamento-confirmar" onClick={confirmar} disabled={salvando}>
            {salvando ? "Salvando..." : "Finalizar atendimento"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default FechamentoFinanceiroModal;
