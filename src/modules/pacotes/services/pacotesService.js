import { criarPacoteClienteRegistro } from "../repositories/pacotesRepository";

function texto(valor, padrao = "") {
  return String(valor || padrao).trim();
}

function numero(valor, padrao = 0) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : padrao;
}

export function montarPacoteCliente(dados) {
  const quantidadeTotal = Math.max(1, numero(dados.quantidadeTotal, 1));
  const alertaSaldoMinimo = Math.max(1, numero(dados.alertaSaldoMinimo, 1));

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

export async function criarPacoteCliente(dados) {
  const pacote = montarPacoteCliente(dados);

  if (!pacote.clienteId) {
    throw new Error("Selecione o cliente do pacote.");
  }

  if (!pacote.servicoId) {
    throw new Error("Selecione o serviço ou combo do pacote.");
  }

  if (!pacote.nome) {
    throw new Error("Informe o nome do pacote.");
  }

  return criarPacoteClienteRegistro(pacote);
}

export function calcularSaldoPacote(pacote) {
  const total = numero(pacote.quantidadeTotal, 0);
  const utilizado = numero(pacote.quantidadeUtilizada, 0);
  const saldo = pacote.saldoRestante ?? total - utilizado;

  return Math.max(0, numero(saldo, 0));
}

export function pacoteEstaAcabando(pacote) {
  const saldo = calcularSaldoPacote(pacote);
  const limite = Math.max(1, numero(pacote.alertaSaldoMinimo, 1));

  return pacote.status === "ativo" && saldo > 0 && saldo <= limite;
}
