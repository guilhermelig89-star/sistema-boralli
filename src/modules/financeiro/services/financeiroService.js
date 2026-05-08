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

export function obterDataMovimento(movimento) {
  return movimento.data || dataParaChave(movimento.criadoEm);
}

export function formatarMoeda(valor) {
  return numero(valor, 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarOrigem(origem) {
  if (origem === "venda_pacote") return "Venda de pacote";
  if (origem === "atendimento_avulso") return "Atendimento avulso";
  return origem || "Movimento manual";
}

export function formatarStatus(status) {
  if (status === "confirmado") return "Confirmado";
  if (status === "cancelado") return "Cancelado";
  if (status === "pendente") return "Pendente";
  return status || "Confirmado";
}

export function aplicarFiltrosFinanceiros(movimentos, filtros) {
  const termo = texto(filtros.pesquisa).toLowerCase();

  return movimentos.filter((movimento) => {
    const dataMovimento = obterDataMovimento(movimento);
    const correspondeInicio = !filtros.dataInicio || dataMovimento >= filtros.dataInicio;
    const correspondeFim = !filtros.dataFim || dataMovimento <= filtros.dataFim;
    const correspondeCliente = !filtros.clienteId || movimento.clienteId === filtros.clienteId;
    const correspondeOrigem = !filtros.origem || movimento.origem === filtros.origem;
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

export function filtrarMovimentosDoMes(movimentos, dataReferencia = new Date()) {
  const ano = dataReferencia.getFullYear();
  const mes = String(dataReferencia.getMonth() + 1).padStart(2, "0");
  const prefixo = `${ano}-${mes}`;

  return movimentos.filter((movimento) => obterDataMovimento(movimento).startsWith(prefixo));
}
