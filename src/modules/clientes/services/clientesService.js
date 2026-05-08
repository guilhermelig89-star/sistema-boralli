import {
  criarClienteRegistro,
  atualizarClienteRegistro,
} from "../repositories/clientesRepository";

function texto(valor, padrao = "") {
  return String(valor || padrao).trim();
}

export function montarCliente(dados) {
  return {
    nome: texto(dados.nome),
    telefone: texto(dados.telefone),
    cep: texto(dados.cep),
    rua: texto(dados.rua),
    numero: texto(dados.numero),
    bairro: texto(dados.bairro),
    cidade: texto(dados.cidade, "Ibitinga") || "Ibitinga",
    complemento: texto(dados.complemento),
    referencia: texto(dados.referencia),
    observacoes: texto(dados.observacoes),
    ativo: true,
  };
}

export async function criarCliente(dados) {
  const cliente = montarCliente(dados);

  if (!cliente.nome) {
    throw new Error("Informe o nome do cliente.");
  }

  return criarClienteRegistro(cliente);
}

export async function editarCliente(id, dados) {
  const cliente = montarCliente(dados);

  if (!cliente.nome) {
    throw new Error("Informe o nome do cliente.");
  }

  return atualizarClienteRegistro(id, cliente);
}

export function desativarCliente(id) {
  return atualizarClienteRegistro(id, {
    ativo: false,
  });
}
