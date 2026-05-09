function numero(valor, padrao = 0) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : padrao;
}

export function formatarMoedaCombo(valor) {
  return numero(valor, 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarPercentualCombo(valor) {
  return `${numero(valor, 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export function obterValorServico(servicoId, servicos = []) {
  const servico = servicos.find((item) => item.id === servicoId);
  return numero(servico?.valor, 0);
}

export function calcularTotalAvulsoCombo(itens = [], servicos = []) {
  return itens.reduce((total, item) => {
    const valorServico = numero(item.valorUnitario, obterValorServico(item.servicoId, servicos));
    const quantidade = numero(item.quantidade, 0);

    return total + valorServico * quantidade;
  }, 0);
}

export function calcularPrecoComDesconto(totalAvulso, descontoPercentual) {
  const total = numero(totalAvulso, 0);
  const desconto = Math.min(Math.max(numero(descontoPercentual, 0), 0), 100);

  return total - total * (desconto / 100);
}

export function calcularDescontoPercentualPorValor(totalAvulso, precoFinal) {
  const total = numero(totalAvulso, 0);
  if (!total) return 0;

  const desconto = total - numero(precoFinal, 0);
  return Math.max(0, (desconto / total) * 100);
}

export function calcularCombo({ itens = [], servicos = [], descontoPercentual = 0, precoFinal = 0 }) {
  const totalAvulso = calcularTotalAvulsoCombo(itens, servicos);
  const descontoInformado = Math.min(Math.max(numero(descontoPercentual, 0), 0), 100);
  const precoSugerido = calcularPrecoComDesconto(totalAvulso, descontoInformado);
  const precoFinalNumerico = numero(precoFinal, precoSugerido);
  const descontoValor = Math.max(0, totalAvulso - precoFinalNumerico);
  const descontoRealPercentual = totalAvulso ? (descontoValor / totalAvulso) * 100 : 0;

  return {
    totalAvulso,
    descontoPercentual: descontoInformado,
    descontoValor,
    precoSugerido,
    precoFinal: precoFinalNumerico,
    economiaValor: descontoValor,
    economiaPercentual: descontoRealPercentual,
    fraseEconomia: `Você economizou ${formatarMoedaCombo(descontoValor)} (${formatarPercentualCombo(descontoRealPercentual)}) neste pacote.`,
  };
}
