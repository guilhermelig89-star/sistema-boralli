import {
  criarAgendamentoRegistro,
  cancelarAgendamentoRegistro,
  finalizarAgendamentoRegistro,
} from "../repositories/agendamentosRepository";

function texto(valor, padrao = "") {
  return String(valor || padrao).trim();
}

function numero(valor, padrao = 0) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : padrao;
}

export function montarAgendamento(dados) {
  return {
    clienteId: dados.clienteId,
    clienteNome: texto(dados.clienteNome),
    servicoId: dados.servicoId,
    servicoNome: texto(dados.servicoNome),
    pacoteClienteId: dados.pacoteClienteId || "",
    pacoteNome: texto(dados.pacoteNome),
    data: texto(dados.data),
    hora: texto(dados.hora),
    formaPagamento: dados.pacoteClienteId ? "pacote" : texto(dados.formaPagamento, "avulso"),
    valor: dados.pacoteClienteId ? 0 : numero(dados.valor, 0),
    observacoes: texto(dados.observacoes),
  };
}

export function validarConflitoHorario(agendamento, agendamentosExistentes) {
  return agendamentosExistentes.some(
    (item) =>
      item.status !== "cancelado" &&
      item.status !== "finalizado" &&
      item.data === agendamento.data &&
      item.hora === agendamento.hora
  );
}

export async function criarAgendamento(dados, agendamentosExistentes = []) {
  const agendamento = montarAgendamento(dados);

  if (!agendamento.clienteId) {
    throw new Error("Selecione o cliente do agendamento.");
  }

  if (!agendamento.servicoId) {
    throw new Error("Selecione o serviço do agendamento.");
  }

  if (!agendamento.data || !agendamento.hora) {
    throw new Error("Informe data e horário do agendamento.");
  }

  if (validarConflitoHorario(agendamento, agendamentosExistentes)) {
    throw new Error("Já existe um agendamento ativo neste horário.");
  }

  return criarAgendamentoRegistro(agendamento);
}

export function finalizarAgendamento(id) {
  return finalizarAgendamentoRegistro(id);
}

export function cancelarAgendamento(id) {
  return cancelarAgendamentoRegistro(id);
}
