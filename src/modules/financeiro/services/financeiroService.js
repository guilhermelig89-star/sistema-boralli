const ORIGENS_SISTEMA = ["venda_pacote", "atendimento_avulso"];

export const FORMAS_RECEBIMENTO_PENDENCIA = [
  "Pix",
  "Dinheiro",
  "Cartão Débito",
  "Cartão Crédito",
  "Transferência",
];

function numero(valor, padrao = 0) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : padrao;
}

function texto(valor, padrao = "") {
  return String(valor || padrao).trim();
}

function arredondarValor(valor) {
  return Math.round(numero(valor, 0) * 100) / 100;
}

function dataParaChave(data) {
  if (!data) return "";

  const objetoData = typeof data.toDate === "function" ? data.toDate() : new Date(data);

  if (Number.isNaN(objetoData.getTime())) return "";

  const ano = objetoData.getFullYear();
  const mes = String(objetoData.getMonth() + 1).padStart(2, "0");
  const dia = String(objetoData.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function dataHoje() {
  return dataParaChave(new Date());
}

function percentual(valor, total) {
  if (!total) return 0;
  return Math.round((numero(valor) / numero(total)) * 1000) / 10;
}

function chaveFormaPagamento(formaPagamento) {
  return texto(formaPagamento, "Não informado") || "Não informado";
}

function chaveCategoriaDespesa(categoria) {
  return texto(categoria, "Sem categoria") || "Sem categoria";
}

function descricaoOrigem(origem) {
  if (origem === "venda_pacote") return "Pacotes vendidos";
  if (origem === "atendimento_avulso") return "Atendimentos avulsos";
  if (origem === "despesa_manual") return "Despesas manuais";
  return "Outras receitas";
}

function statusNormalizado(status) {
  if (!status) return "pago";
  if (status === "confirmado") return "pago";
  return status;
}

function montarResumoFormaPagamento(pagamentos, status) {
  const pagamentosValidos = (pagamentos || []).filter((pagamento) => numero(pagamento.valor, 0) > 0);

  if (status === "pendente") return "Fiado/Pendente";
  if (pagamentosValidos.length === 0) return "Não informado";
  if (pagamentosValidos.length === 1) return pagamentosValidos[0].forma;
  return "Múltiplos pagamentos";
}

export function movimentoEhDoSistema(movimento) {
  return ORIGENS_SISTEMA.includes(movimento.origem);
}

export function obterDataMovimento(movimento) {
  return movimento.data || dataParaChave(movimento.criadoEm);
}

export function obterValorRecebido(movimento) {
  if (movimento.tipo !== "receita") return 0;
  if (movimento.status === "cancelado") return 0;
  if (movimento.valorRecebido !== undefined) return numero(movimento.valorRecebido, 0);
  return numero(movimento.valor, 0);
}

export function obterValorPendente(movimento) {
  if (movimento.tipo !== "receita") return 0;
  if (movimento.status === "cancelado") return 0;
  return numero(movimento.valorPendente, 0);
}

export function obterValorDesconto(movimento) {
  if (movimento.tipo !== "receita") return 0;
  if (movimento.status === "cancelado") return 0;
  return numero(movimento.descontoValor, 0);
}

export function formatarMoeda(valor) {
  return numero(valor, 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarPercentual(valor) {
  return `${numero(valor, 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export function formatarOrigem(origem) {
  if (origem === "venda_pacote") return "Venda de pacote";
  if (origem === "atendimento_avulso") return "Atendimento avulso";
  if (origem === "despesa_manual") return "Despesa manual";
  return origem || "Outro/manual";
}

export function formatarStatus(status) {
  const normalizado = statusNormalizado(status);
  if (normalizado === "pago") return "Pago";
  if (normalizado === "parcial") return "Parcial";
  if (normalizado === "pendente") return "Pendente";
  if (normalizado === "cancelado") return "Cancelado";
  return normalizado || "Pago";
}

function origemCorresponde(movimento, filtroOrigem) {
  if (!filtroOrigem || filtroOrigem === "sistema") return movimentoEhDoSistema(movimento);
  if (filtroOrigem === "todos") return true;
  if (filtroOrigem === "outros") return !movimentoEhDoSistema(movimento);
  return movimento.origem === filtroOrigem;
}

export function aplicarFiltrosFinanceiros(movimentos, filtros) {
  const termo = texto(filtros.pesquisa).toLowerCase();

  return movimentos.filter((movimento) => {
    const dataMovimento = obterDataMovimento(movimento);
    const correspondeInicio = !filtros.dataInicio || dataMovimento >= filtros.dataInicio;
    const correspondeFim = !filtros.dataFim || dataMovimento <= filtros.dataFim;
    const correspondeCliente = !filtros.clienteId || movimento.clienteId === filtros.clienteId;
    const correspondeOrigem = origemCorresponde(movimento, filtros.origem);
    const correspondeStatus = !filtros.status || statusNormalizado(movimento.status) === filtros.status;
    const correspondePesquisa =
      !termo ||
      movimento.clienteNome?.toLowerCase().includes(termo) ||
      movimento.descricao?.toLowerCase().includes(termo) ||
      movimento.servicoNome?.toLowerCase().includes(termo) ||
      movimento.categoria?.toLowerCase().includes(termo) ||
      movimento.formaPagamento?.toLowerCase().includes(termo);

    return (
      correspondeInicio &&
      correspondeFim &&
      correspondeCliente &&
      correspondeOrigem &&
      correspondeStatus &&
      correspondePesquisa
    );
  });
}

export function calcularTotaisFinanceiros(movimentos) {
  return movimentos.reduce(
    (totais, movimento) => {
      const status = statusNormalizado(movimento.status);
      const ativo = status !== "cancelado";
      const recebido = obterValorRecebido(movimento);
      const pendente = obterValorPendente(movimento);
      const desconto = obterValorDesconto(movimento);
      const despesa = numero(movimento.valor, 0);

      if (movimento.tipo === "receita" && ativo) {
        totais.receitas += recebido;
        totais.recebido += recebido;
        totais.pendente += pendente;
        totais.descontos += desconto;
      }

      if (movimento.tipo === "despesa" && ativo) {
        totais.despesas += despesa;
      }

      if (movimento.origem === "venda_pacote" && ativo) {
        totais.pacotes += recebido;
      }

      if (movimento.origem === "atendimento_avulso" && ativo) {
        totais.avulsos += recebido;
      }

      if (movimento.tipo === "receita" && ativo) {
        const pagamentos = Array.isArray(movimento.pagamentos) ? movimento.pagamentos : [];
        if (pagamentos.length > 0) {
          pagamentos.forEach((pagamento) => {
            const forma = chaveFormaPagamento(pagamento.forma);
            totais.porForma[forma] = (totais.porForma[forma] || 0) + numero(pagamento.valor, 0);
          });
        } else if (recebido > 0) {
          const forma = chaveFormaPagamento(movimento.formaPagamento);
          totais.porForma[forma] = (totais.porForma[forma] || 0) + recebido;
        }
      }

      totais.saldo = totais.receitas - totais.despesas;
      return totais;
    },
    {
      receitas: 0,
      recebido: 0,
      pendente: 0,
      descontos: 0,
      despesas: 0,
      saldo: 0,
      pacotes: 0,
      avulsos: 0,
      porForma: {},
    }
  );
}

export function calcularDreFinanceiro(movimentos) {
  const ativos = movimentos.filter((movimento) => statusNormalizado(movimento.status) !== "cancelado");
  const receitasAtivas = ativos.filter((movimento) => movimento.tipo === "receita");
  const despesasAtivas = ativos.filter((movimento) => movimento.tipo === "despesa");
  const totais = calcularTotaisFinanceiros(ativos);
  const outrasReceitas = receitasAtivas.reduce((total, movimento) => {
    if (movimentoEhDoSistema(movimento)) return total;
    return total + obterValorRecebido(movimento);
  }, 0);

  const porFormaPagamento = Object.values(
    receitasAtivas.reduce((grupos, movimento) => {
      const pagamentos = Array.isArray(movimento.pagamentos) && movimento.pagamentos.length > 0
        ? movimento.pagamentos
        : [{ forma: movimento.formaPagamento, valor: obterValorRecebido(movimento) }];

      pagamentos.forEach((pagamento) => {
        const forma = chaveFormaPagamento(pagamento.forma);
        const atual = grupos[forma] || { forma, valor: 0, quantidade: 0, percentual: 0 };
        atual.valor += numero(pagamento.valor, 0);
        atual.quantidade += 1;
        grupos[forma] = atual;
      });

      return grupos;
    }, {})
  )
    .map((item) => ({ ...item, percentual: percentual(item.valor, totais.receitas) }))
    .sort((a, b) => b.valor - a.valor);

  const porOrigem = Object.values(
    receitasAtivas.reduce((grupos, movimento) => {
      const origem = descricaoOrigem(movimento.origem);
      const atual = grupos[origem] || { origem, valor: 0, quantidade: 0, percentual: 0 };
      atual.valor += obterValorRecebido(movimento);
      atual.quantidade += 1;
      grupos[origem] = atual;
      return grupos;
    }, {})
  )
    .map((item) => ({ ...item, percentual: percentual(item.valor, totais.receitas) }))
    .sort((a, b) => b.valor - a.valor);

  const porCategoriaDespesa = Object.values(
    despesasAtivas.reduce((grupos, movimento) => {
      const categoria = chaveCategoriaDespesa(movimento.categoria);
      const atual = grupos[categoria] || { categoria, valor: 0, quantidade: 0, percentual: 0 };
      atual.valor += numero(movimento.valor, 0);
      atual.quantidade += 1;
      grupos[categoria] = atual;
      return grupos;
    }, {})
  )
    .map((item) => ({ ...item, percentual: percentual(item.valor, totais.despesas) }))
    .sort((a, b) => b.valor - a.valor);

  return {
    receitaBruta: totais.receitas,
    recebido: totais.recebido,
    pendente: totais.pendente,
    descontos: totais.descontos,
    vendaPacotes: totais.pacotes,
    atendimentosAvulsos: totais.avulsos,
    outrasReceitas,
    despesas: totais.despesas,
    resultadoLiquido: totais.saldo,
    margemLiquida: percentual(totais.saldo, totais.receitas),
    ticketMedio: receitasAtivas.length ? totais.receitas / receitasAtivas.length : 0,
    porFormaPagamento,
    porOrigem,
    porCategoriaDespesa,
  };
}

export function prepararDespesaManual(dados) {
  const valor = numero(dados.valor, 0);

  if (!valor || valor <= 0) {
    throw new Error("Informe um valor maior que zero.");
  }

  return {
    tipo: "despesa",
    origem: "despesa_manual",
    status: dados.status || "pago",
    data: dados.data || dataHoje(),
    valor,
    categoria: texto(dados.categoria, "Outros"),
    formaPagamento: texto(dados.formaPagamento, "Não informado"),
    descricao: texto(dados.descricao, "Despesa manual"),
  };
}

export function prepararRecebimentoPendente(movimento, dados) {
  if (!movimento || movimento.tipo !== "receita") {
    throw new Error("Movimento financeiro inválido.");
  }

  const pendenteAtual = obterValorPendente(movimento);
  const valorInformado = arredondarValor(dados.valor);

  if (!valorInformado || valorInformado <= 0) {
    throw new Error("Informe um valor recebido maior que zero.");
  }

  if (valorInformado > pendenteAtual) {
    throw new Error("O valor recebido não pode ser maior que o valor pendente.");
  }

  const recebimento = {
    forma: texto(dados.formaPagamento, "Pix"),
    valor: valorInformado,
    data: dados.data || dataHoje(),
    observacao: texto(dados.observacao),
  };
  const pagamentos = [...(Array.isArray(movimento.pagamentos) ? movimento.pagamentos : []), recebimento];
  const recebimentosRegistrados = [
    ...(Array.isArray(movimento.recebimentosRegistrados) ? movimento.recebimentosRegistrados : []),
    recebimento,
  ];
  const valorRecebido = arredondarValor(obterValorRecebido(movimento) + valorInformado);
  const valorPendente = arredondarValor(Math.max(0, pendenteAtual - valorInformado));
  const status = valorPendente > 0 ? "parcial" : "pago";

  return {
    valor: valorRecebido,
    valorRecebido,
    valorPendente,
    status,
    statusFinanceiro: status,
    formaPagamento: montarResumoFormaPagamento(pagamentos, status),
    pagamentos,
    recebimentosRegistrados,
    ultimaDataRecebimento: recebimento.data,
  };
}

export function filtrarMovimentosDoMes(movimentos, dataReferencia = new Date()) {
  const ano = dataReferencia.getFullYear();
  const mes = String(dataReferencia.getMonth() + 1).padStart(2, "0");
  const prefixo = `${ano}-${mes}`;

  return movimentos.filter((movimento) => obterDataMovimento(movimento).startsWith(prefixo));
}
