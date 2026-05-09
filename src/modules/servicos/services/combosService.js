import {
  criarComboRegistro,
  atualizarComboRegistro,
} from "../repositories/combosRepository";

function texto(valor, padrao = "") {
  return String(valor || padrao).trim();
}

function numero(valor, padrao = 0) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : padrao;
}

export function montarCombo(dados = {}) {
  const itens = Array.isArray(dados.itens)
    ? dados.itens
        .map((item) => ({
          servicoId: item.servicoId,
          servicoNome: texto(item.servicoNome),
          quantidade: Math.max(0, numero(item.quantidade, 0)),
          valorUnitario: numero(item.valorUnitario, 0),
        }))
        .filter((item) => item.servicoId && item.quantidade > 0)
    : [];

  return {
    nome: texto(dados.nome),
    valor: numero(dados.valor, 0),
    totalAvulso: numero(dados.totalAvulso, 0),
    descontoPercentual: numero(dados.descontoPercentual, 0),
    descontoValor: numero(dados.descontoValor, 0),
    precoSugerido: numero(dados.precoSugerido, 0),
    economiaValor: numero(dados.economiaValor, 0),
    economiaPercentual: numero(dados.economiaPercentual, 0),
    fraseEconomia: texto(dados.fraseEconomia),
    itens,
    observacoes: texto(dados.observacoes),
    ativo: true,
  };
}

export async function criarCombo(dados) {
  const combo = montarCombo(dados);

  if (!combo.nome) {
    throw new Error("Informe o nome do combo.");
  }

  if (combo.itens.length === 0) {
    throw new Error("Adicione pelo menos um serviço ao combo.");
  }

  return criarComboRegistro(combo);
}

export async function editarCombo(id, dados) {
  const combo = montarCombo(dados);

  if (!combo.nome) {
    throw new Error("Informe o nome do combo.");
  }

  if (combo.itens.length === 0) {
    throw new Error("Adicione pelo menos um serviço ao combo.");
  }

  return atualizarComboRegistro(id, combo);
}

export function desativarCombo(id) {
  return atualizarComboRegistro(id, {
    ativo: false,
  });
}
