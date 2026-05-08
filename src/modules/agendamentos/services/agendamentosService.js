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

function horaParaMinutos(hora) {
  const [horas, minutos] = String(hora || "").split(":").map(Number);

  if (!Number.isFinite(horas) || !Number.isFinite(minutos)) return null;

  return horas * 60 + minutos;
}

function minutosParaHora(totalMinutos) {
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;

  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

function obterDiaSemana(data) {
  return new Date(`${data}T00:00:00`).getDay();
}

function horariosConflitam(inicioA, fimA, inicioB, fimB) {
  return inicioA < fimB && fimA > inicioB;
}

function resolverJanelaAtendimento(data, configuracaoAgenda) {
  const excecao = configuracaoAgenda.excecoes.find((item) => item.data === data);

  if (excecao) {
    if (excecao.fechado) return null;

    return {
      inicio: excecao.inicio,
      fim: excecao.fim,
      intervaloAtivo: Boolean(excecao.intervaloAtivo),
      intervaloInicio: excecao.intervaloInicio || "",
      intervaloFim: excecao.intervaloFim || "",
      origem: "excecao",
    };
  }

  const diaSemana = obterDiaSemana(data);
  const horario = configuracaoAgenda.horarios.find(
    (item) => Number(item.diaSemana) === diaSemana
  );

  if (!horario || !horario.ativo) return null;

  return {
    inicio: horario.inicio,
    fim: horario.fim,
    intervaloAtivo: Boolean(horario.intervaloAtivo),
    intervaloInicio: horario.intervaloInicio || "",
    intervaloFim: horario.intervaloFim || "",
    origem: "horario_semana",
  };
}

export function montarAgendamento(dados) {
  return {
    clienteId: dados.clienteId,
    clienteNome: texto(dados.clienteNome),
    servicoId: dados.servicoId,
    servicoNome: texto(dados.servicoNome),
    servicoDuracaoMinutos: numero(dados.servicoDuracaoMinutos, 60) || 60,
    pacoteClienteId: dados.pacoteClienteId || "",
    pacoteNome: texto(dados.pacoteNome),
    data: texto(dados.data),
    hora: texto(dados.hora),
    formaPagamento: dados.pacoteClienteId ? "pacote" : texto(dados.formaPagamento, "avulso"),
    valor: dados.pacoteClienteId ? 0 : numero(dados.valor, 0),
    observacoes: texto(dados.observacoes),
  };
}

export function gerarHorariosDisponiveis({
  data,
  duracaoMinutos,
  configuracaoAgenda = {},
  agendamentosExistentes = [],
  intervaloMinutos = 15,
}) {
  const configuracao = {
    horarios: configuracaoAgenda.horarios || [],
    excecoes: configuracaoAgenda.excecoes || [],
  };
  const janela = data ? resolverJanelaAtendimento(data, configuracao) : null;
  const duracao = numero(duracaoMinutos, 60) || 60;

  if (!janela) return [];

  const inicioJanela = horaParaMinutos(janela.inicio);
  const fimJanela = horaParaMinutos(janela.fim);
  const intervaloInicio = horaParaMinutos(janela.intervaloInicio);
  const intervaloFim = horaParaMinutos(janela.intervaloFim);

  if (inicioJanela === null || fimJanela === null || inicioJanela >= fimJanela) return [];

  const ocupados = agendamentosExistentes
    .filter((item) => item.data === data && item.status !== "cancelado" && item.status !== "finalizado")
    .map((item) => {
      const inicio = horaParaMinutos(item.hora);
      const fim = inicio === null ? null : inicio + numero(item.servicoDuracaoMinutos, 60);
      return { inicio, fim };
    })
    .filter((item) => item.inicio !== null && item.fim !== null);

  const horarios = [];

  for (let inicio = inicioJanela; inicio + duracao <= fimJanela; inicio += intervaloMinutos) {
    const fim = inicio + duracao;
    const conflitaComIntervalo =
      janela.intervaloAtivo &&
      intervaloInicio !== null &&
      intervaloFim !== null &&
      horariosConflitam(inicio, fim, intervaloInicio, intervaloFim);
    const conflitaComAgendamento = ocupados.some((item) =>
      horariosConflitam(inicio, fim, item.inicio, item.fim)
    );

    if (!conflitaComIntervalo && !conflitaComAgendamento) {
      horarios.push(minutosParaHora(inicio));
    }
  }

  return horarios;
}

export function validarHorarioDisponivel(agendamento, configuracaoAgenda) {
  const janela = resolverJanelaAtendimento(agendamento.data, configuracaoAgenda);

  if (!janela) {
    throw new Error("Não há atendimento disponível nesta data.");
  }

  const inicioAgenda = horaParaMinutos(agendamento.hora);
  const inicioJanela = horaParaMinutos(janela.inicio);
  const fimJanela = horaParaMinutos(janela.fim);

  if (inicioAgenda === null || inicioJanela === null || fimJanela === null) {
    throw new Error("Informe um horário válido para o agendamento.");
  }

  const fimAgenda = inicioAgenda + agendamento.servicoDuracaoMinutos;

  if (inicioAgenda < inicioJanela || fimAgenda > fimJanela) {
    throw new Error("O serviço não cabe dentro do horário de atendimento deste dia.");
  }

  if (janela.intervaloAtivo) {
    const intervaloInicio = horaParaMinutos(janela.intervaloInicio);
    const intervaloFim = horaParaMinutos(janela.intervaloFim);

    if (
      intervaloInicio !== null &&
      intervaloFim !== null &&
      horariosConflitam(inicioAgenda, fimAgenda, intervaloInicio, intervaloFim)
    ) {
      throw new Error("O serviço conflita com o intervalo cadastrado neste dia.");
    }
  }
}

export function validarConflitoHorario(agendamento, agendamentosExistentes) {
  const inicioNovo = horaParaMinutos(agendamento.hora);

  if (inicioNovo === null) return false;

  const fimNovo = inicioNovo + agendamento.servicoDuracaoMinutos;

  return agendamentosExistentes.some((item) => {
    if (item.status === "cancelado" || item.status === "finalizado") return false;
    if (item.data !== agendamento.data) return false;

    const inicioExistente = horaParaMinutos(item.hora);
    const fimExistente = inicioExistente + numero(item.servicoDuracaoMinutos, 60);

    if (inicioExistente === null) return false;

    return horariosConflitam(inicioNovo, fimNovo, inicioExistente, fimExistente);
  });
}

export async function criarAgendamento(dados, agendamentosExistentes = [], configuracaoAgenda = {}) {
  const agendamento = montarAgendamento(dados);
  const configuracao = {
    horarios: configuracaoAgenda.horarios || [],
    excecoes: configuracaoAgenda.excecoes || [],
  };

  if (!agendamento.clienteId) {
    throw new Error("Selecione o cliente do agendamento.");
  }

  if (!agendamento.servicoId) {
    throw new Error("Selecione o serviço do agendamento.");
  }

  if (!agendamento.data || !agendamento.hora) {
    throw new Error("Informe data e horário do agendamento.");
  }

  validarHorarioDisponivel(agendamento, configuracao);

  if (validarConflitoHorario(agendamento, agendamentosExistentes)) {
    throw new Error("Este horário conflita com outro agendamento ativo.");
  }

  return criarAgendamentoRegistro(agendamento);
}

export function finalizarAgendamento(id) {
  return finalizarAgendamentoRegistro(id);
}

export function cancelarAgendamento(id) {
  return cancelarAgendamentoRegistro(id);
}
