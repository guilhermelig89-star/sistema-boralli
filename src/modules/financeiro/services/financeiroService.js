const ORIGENS_SISTEMA = ["venda_pacote", "atendimento_avulso"];

function numero(valor, padrao = 0) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : padrao;
}

function texto(valor, padrao = "") {
  return String(valor || padrao).trim();
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

function percentual(valor, total) {
  if (!total) return 0;
  return Math.round((numero(valor) / numero(total)) * 1000) / 10;
}

function chaveFormaPagamento(formaPagamento) {
  return texto(formaPagamento, "Não informado") || "Não informado";
}

function descricaoOrigem(origem) {
  if (origem === "venda_pacote") return "Pacotes vendidos";
  if (origem === "atendimento_avulso") return "Atendimentos avulsos";
  return "Outras receitas";
}

export function movimentoEhDoSistema(movimento) {
  return ORIGENS_SISTEMA.includes(movimento.origem);
}

export function obterDataMovimento(movimento) {
  return movimento.data || dataParaChave(movimento.criadoEm);
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
  return origem || "Outro/manual";
}

export function formatarStatus(status) {
  if (status === "confirmado") return "Confirmado";
  if (status === "cancelado") return "Cancelado";
  if (status === "pendente") return "Pendente";
  return status || "Confirmado";
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
    const correspondeStatus = !filtros.status || (movimento.status || "confirmado") === filtros.status;
    const correspondePesquisa =
      !termo ||
      movimento.clienteNome?.toLowerCase().includes(termo) ||
      movimento.descricao?.toLowerCase().includes(termo) ||
      movimento.servicoNome?.toLowerCase().includes(termo);

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
      const valor = numero(movimento.valor, 0);
      const confirmado = (movimento.status || "confirmado") === "confirmado";

      if (movimento.tipo === "receita" && confirmado) {
        totais.receitas += valor;
      }

      if (movimento.tipo === "despesa" && confirmado) {
        totais.despesas += valor;
      }

      if (movimento.origem === "venda_pacote" && confirmado) {
        totais.pacotes += valor;
      }

      if (movimento.origem === "atendimento_avulso" && confirmado) {
        totais.avulsos += valor;
      }

      totais.saldo = totais.receitas - totais.despesas;
      return totais;
    },
    {
      receitas: 0,
      despesas: 0,
      saldo: 0,
      pacotes: 0,
      avulsos: 0,
    }
  );
}

export function calcularDreFinanceiro(movimentos) {
  const confirmados = movimentos.filter((movimento) => (movimento.status || "confirmado") === "confirmado");
  const totais = calcularTotaisFinanceiros(confirmados);
  const outrasReceitas = confirmados.reduce((total, movimento) => {
    if (movimento.tipo !== "receita" || movimentoEhDoSistema(movimento)) return total;
    return total + numero(movimento.valor, 0);
  }, 0);

  const porFormaPagamento = Object.values(
    confirmados.reduce((grupos, movimento) => {
      if (movimento.tipo !== "receita") return grupos;

      const forma = chaveFormaPagamento(movimento.formaPagamento);
      const atual = grupos[forma] || { forma, valor: 0, quantidade: 0, percentual: 0 };
      atual.valor += numero(movimento.valor, 0);
      atual.quantidade += 1;
      grupos[forma] = atual;
      return grupos;
    }, {})
  )
    .map((item) => ({ ...item, percentual: percentual(item.valor, totais.receitas) }))
    .sort((a, b) => b.valor - a.valor);

  const porOrigem = Object.values(
    confirmados.reduce((grupos, movimento) => {
      if (movimento.tipo !== "receita") return grupos;

      const origem = descricaoOrigem(movimento.origem);
      const atual = grupos[origem] || { origem, valor: 0, quantidade: 0, percentual: 0 };
      atual.valor += numero(movimento.valor, 0);
      atual.quantidade += 1;
      grupos[origem] = atual;
      return grupos;
    }, {})
  )
    .map((item) => ({ ...item, percentual: percentual(item.valor, totais.receitas) }))
    .sort((a, b) => b.valor - a.valor);

  return {
    receitaBruta: totais.receitas,
    vendaPacotes: totais.pacotes,
    atendimentosAvulsos: totais.avulsos,
    outrasReceitas,
    despesas: totais.despesas,
    resultadoLiquido: totais.saldo,
    margemLiquida: percentual(totais.saldo, totais.receitas),
    ticketMedio: confirmados.length ? totais.receitas / confirmados.filter((movimento) => movimento.tipo === "receita").length : 0,
    porFormaPagamento,
    porOrigem,
  };
}

export function filtrarMovimentosDoMes(movimentos, dataReferencia = new Date()) {
  const ano = dataReferencia.getFullYear();
  const mes = String(dataReferencia.getMonth() + 1).padStart(2, "0");
  const prefixo = `${ano}-${mes}`;

  return movimentos.filter(
    (movimento) => movimentoEhDoSistema(movimento) && obterDataMovimento(movimento).startsWith(prefixo)
  );
}
