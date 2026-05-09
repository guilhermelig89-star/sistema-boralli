export const FORMAS_PAGAMENTO_FECHAMENTO = [
  "Pix",
  "Dinheiro",
  "Cartão Débito",
  "Cartão Crédito",
  "Transferência",
  "Fiado/Pendente",
];

function numero(valor, padrao = 0) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : padrao;
}

function texto(valor, padrao = "") {
  return String(valor || padrao).trim();
}

function valorFoiInformado(valor) {
  return valor !== undefined && valor !== null && String(valor).trim() !== "";
}

function limitarPagamentosAoValorFinal(pagamentos, valorFinal) {
  let restante = arredondarValor(valorFinal);

  return (pagamentos || []).reduce((lista, pagamento) => {
    if (restante <= 0) return lista;

    const forma = texto(pagamento.forma, "Pix");
    const valor = arredondarValor(pagamento.valor);

    if (forma === "Fiado/Pendente" || valor <= 0) return lista;

    const valorRegistrado = arredondarValor(Math.min(valor, restante));
    restante = arredondarValor(restante - valorRegistrado);

    return [...lista, { forma, valor: valorRegistrado }];
  }, []);
}

export function arredondarValor(valor) {
  return Math.round(numero(valor, 0) * 100) / 100;
}

export function calcularFechamentoFinanceiro({ valorOriginal, descontoValor, valorFinalManual, pagamentos }) {
  const original = arredondarValor(valorOriginal);
  const finalManualInformado = valorFoiInformado(valorFinalManual);
  const finalManual = Math.min(original, Math.max(0, arredondarValor(valorFinalManual)));
  const descontoDigitado = Math.min(original, Math.max(0, arredondarValor(descontoValor)));
  const valorFinal = finalManualInformado
    ? finalManual
    : arredondarValor(Math.max(0, original - descontoDigitado));
  const desconto = arredondarValor(Math.max(0, original - valorFinal));
  const pagamentosValidos = limitarPagamentosAoValorFinal(pagamentos, valorFinal);
  const valorRecebido = arredondarValor(
    pagamentosValidos.reduce((total, pagamento) => total + pagamento.valor, 0)
  );
  const valorPendente = arredondarValor(Math.max(0, valorFinal - valorRecebido));
  let statusFinanceiro = "pago";

  if (valorPendente > 0 && valorRecebido > 0) {
    statusFinanceiro = "parcial";
  } else if (valorPendente > 0) {
    statusFinanceiro = "pendente";
  }

  return {
    valorOriginal: original,
    descontoValor: desconto,
    valorFinal,
    valorRecebido,
    valorPendente,
    pagamentos: pagamentosValidos,
    statusFinanceiro,
  };
}

export function montarResumoFormaPagamento(pagamentos, statusFinanceiro) {
  if (statusFinanceiro === "pendente") return "Fiado/Pendente";
  if (!pagamentos?.length) return "Não informado";
  if (pagamentos.length === 1) return pagamentos[0].forma;
  return "Múltiplos pagamentos";
}

export function prepararFechamentoFinanceiro(dados) {
  const calculado = calcularFechamentoFinanceiro(dados);

  return {
    ...calculado,
    motivoDesconto: texto(dados.motivoDesconto),
    formaPagamento: montarResumoFormaPagamento(calculado.pagamentos, calculado.statusFinanceiro),
    observacoesFinanceiras: texto(dados.observacoesFinanceiras),
  };
}
