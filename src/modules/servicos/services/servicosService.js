import {
  criarServicoRegistro,
  atualizarServicoRegistro,
} from "../repositories/servicosRepository";

function texto(valor, padrao = "") {
  return String(valor || padrao).trim();
}

function numero(valor, padrao = 0) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : padrao;
}

export function montarServico(dados) {
  return {
    nome: texto(dados.nome),
    tipo: dados.tipo === "combo" ? "combo" : "avulso",
    valor: numero(dados.valor, 0),
    duracaoMinutos: numero(dados.duracaoMinutos, 60) || 60,
    ativo: true,
  };
}

export async function criarServico(dados) {
  const servico = montarServico(dados);

  if (!servico.nome) {
    throw new Error("Informe o nome do servico.");
  }

  return criarServicoRegistro(servico);
}

export async function editarServico(id, dados) {
  const servico = montarServico(dados);

  if (!servico.nome) {
    throw new Error("Informe o nome do servico.");
  }

  return atualizarServicoRegistro(id, servico);
}

export function desativarServico(id) {
  return atualizarServicoRegistro(id, {
    ativo: false,
  });
}
