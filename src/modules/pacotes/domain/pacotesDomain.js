export function texto(valor, padrao = "") {
  return String(valor || padrao).trim();
}

export function numero(valor, padrao = 0) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : padrao;
}

export function calcularSaldoItemPacote(item) {
  const total = numero(item?.quantidadeTotal ?? item?.quantidade, 0);
  const utilizado = numero(item?.quantidadeUtilizada, 0);
  const saldo = item?.saldoRestante ?? total - utilizado;

  return Math.max(0, numero(saldo, 0));
}

export function montarItensPacote(dados = {}) {
  const itens = Array.isArray(dados.itens) ? dados.itens : [];

  return itens
    .map((item) => {
      const quantidadeTotal = Math.max(0, numero(item.quantidadeTotal ?? item.quantidade, 0));

      return {
        servicoId: item.servicoId,
        servicoNome: texto(item.servicoNome),
        quantidadeTotal,
        quantidadeUtilizada: numero(item.quantidadeUtilizada, 0),
        saldoRestante: item.saldoRestante ?? quantidadeTotal,
      };
    })
    .filter((item) => item.servicoId && item.quantidadeTotal > 0);
}

export function calcularSaldoPacote(pacote = {}) {
  if (Array.isArray(pacote.itens) && pacote.itens.length > 0) {
    return pacote.itens.reduce((total, item) => total + calcularSaldoItemPacote(item), 0);
  }

  const total = numero(pacote.quantidadeTotal, 0);
  const utilizado = numero(pacote.quantidadeUtilizada, 0);
  const saldo = pacote.saldoRestante ?? total - utilizado;

  return Math.max(0, numero(saldo, 0));
}

export function calcularSaldoServicoPacote(pacote = {}, servicoId) {
  if (!servicoId) return 0;

  if (Array.isArray(pacote.itens) && pacote.itens.length > 0) {
    return pacote.itens
      .filter((item) => item.servicoId === servicoId)
      .reduce((total, item) => total + calcularSaldoItemPacote(item), 0);
  }

  if (pacote.servicoId !== servicoId) return 0;

  return calcularSaldoPacote(pacote);
}

export function pacoteTemSaldoParaServico(pacote, servicoId) {
  return pacote?.status === "ativo" && calcularSaldoServicoPacote(pacote, servicoId) > 0;
}

export function pacoteEstaAcabando(pacote) {
  const saldo = calcularSaldoPacote(pacote);
  const limite = Math.max(1, numero(pacote?.alertaSaldoMinimo, 1));

  return pacote?.status === "ativo" && saldo > 0 && saldo <= limite;
}

export function obterResumoItensPacote(pacote = {}) {
  if (Array.isArray(pacote.itens) && pacote.itens.length > 0) {
    return pacote.itens
      .map((item) => {
        const saldo = calcularSaldoItemPacote(item);
        return `${item.servicoNome}: ${item.quantidadeUtilizada || 0}/${item.quantidadeTotal} usado - ${saldo} restante`;
      })
      .join(" | ");
  }

  return `${pacote.quantidadeUtilizada || 0}/${pacote.quantidadeTotal || 0} usado - ${calcularSaldoPacote(pacote)} restante`;
}

export function montarPacoteCliente(dados = {}) {
  const itens = montarItensPacote(dados);
  const alertaSaldoMinimo = Math.max(1, numero(dados.alertaSaldoMinimo, 1));

  if (itens.length > 0) {
    const quantidadeTotal = itens.reduce((total, item) => total + item.quantidadeTotal, 0);
    const quantidadeUtilizada = itens.reduce((total, item) => total + numero(item.quantidadeUtilizada, 0), 0);
    const saldoRestante = itens.reduce((total, item) => total + calcularSaldoItemPacote(item), 0);
    const primeiroItem = itens[0];

    return {
      clienteId: dados.clienteId,
      clienteNome: texto(dados.clienteNome),
      comboId: dados.comboId || "",
      comboNome: texto(dados.comboNome),
      servicoId: primeiroItem?.servicoId || "",
      servicoNome: itens.map((item) => item.servicoNome).join(", "),
      nome: texto(dados.nome, dados.comboNome || primeiroItem?.servicoNome),
      itens,
      quantidadeTotal,
      quantidadeUtilizada,
      saldoRestante,
      alertaSaldoMinimo,
      valorPago: numero(dados.valorPago, 0),
      formaPagamento: texto(dados.formaPagamento),
      observacoes: texto(dados.observacoes),
      status: saldoRestante > 0 ? "ativo" : "esgotado",
    };
  }

  const quantidadeTotal = Math.max(1, numero(dados.quantidadeTotal, 1));

  return {
    clienteId: dados.clienteId,
    clienteNome: texto(dados.clienteNome),
    servicoId: dados.servicoId,
    servicoNome: texto(dados.servicoNome),
    nome: texto(dados.nome, dados.servicoNome),
    quantidadeTotal,
    quantidadeUtilizada: 0,
    saldoRestante: quantidadeTotal,
    alertaSaldoMinimo,
    valorPago: numero(dados.valorPago, 0),
    formaPagamento: texto(dados.formaPagamento),
    observacoes: texto(dados.observacoes),
    status: "ativo",
  };
}

export function consumirServicoDoPacote(pacote = {}, servicoId) {
  if (Array.isArray(pacote.itens) && pacote.itens.length > 0) {
    const indiceItem = pacote.itens.findIndex(
      (item) => item.servicoId === servicoId && calcularSaldoItemPacote(item) > 0
    );

    if (indiceItem < 0) {
      throw new Error("Este pacote não possui saldo para o serviço agendado.");
    }

    const itemAtual = pacote.itens[indiceItem];
    const saldoAntes = calcularSaldoItemPacote(itemAtual);
    const saldoDepois = saldoAntes - 1;
    const itemAtualizado = {
      ...itemAtual,
      quantidadeUtilizada: numero(itemAtual.quantidadeUtilizada, 0) + 1,
      saldoRestante: saldoDepois,
    };
    const itensAtualizados = pacote.itens.map((item, indice) =>
      indice === indiceItem ? itemAtualizado : item
    );
    const saldoTotalDepois = itensAtualizados.reduce(
      (total, item) => total + calcularSaldoItemPacote(item),
      0
    );
    const quantidadeUtilizada = itensAtualizados.reduce(
      (total, item) => total + numero(item.quantidadeUtilizada, 0),
      0
    );

    return {
      atualizacao: {
        itens: itensAtualizados,
        quantidadeUtilizada,
        saldoRestante: saldoTotalDepois,
        status: saldoTotalDepois <= 0 ? "esgotado" : "ativo",
      },
      consumoPacote: {
        pacoteClienteId: pacote.id || "",
        pacoteNome: pacote.nome,
        clienteId: pacote.clienteId,
        clienteNome: pacote.clienteNome,
        servicoId: itemAtual.servicoId,
        servicoNome: itemAtual.servicoNome,
        quantidadeConsumida: 1,
        saldoAntes,
        saldoDepois,
        saldoTotalDepois,
      },
    };
  }

  if (pacote.servicoId !== servicoId) {
    throw new Error("Este pacote não corresponde ao serviço agendado.");
  }

  const total = numero(pacote.quantidadeTotal, 0);
  const utilizadoAtual = numero(pacote.quantidadeUtilizada, 0);
  const saldoAtual = calcularSaldoPacote(pacote);

  if (saldoAtual <= 0) {
    throw new Error("Este pacote não possui saldo disponível.");
  }

  const saldoDepois = saldoAtual - 1;
  const quantidadeUtilizada = utilizadoAtual + 1;

  return {
    atualizacao: {
      quantidadeUtilizada,
      saldoRestante: saldoDepois,
      status: saldoDepois <= 0 ? "esgotado" : "ativo",
    },
    consumoPacote: {
      pacoteClienteId: pacote.id || "",
      pacoteNome: pacote.nome,
      clienteId: pacote.clienteId,
      clienteNome: pacote.clienteNome,
      servicoId: pacote.servicoId,
      servicoNome: pacote.servicoNome,
      quantidadeConsumida: 1,
      saldoAntes: saldoAtual || total - utilizadoAtual,
      saldoDepois,
      saldoTotalDepois: saldoDepois,
    },
  };
}
