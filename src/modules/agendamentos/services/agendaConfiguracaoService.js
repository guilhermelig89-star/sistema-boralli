const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

function texto(valor, padrao = "") {
  return String(valor || padrao).trim();
}

function intervaloInvalido(ativo, inicio, fim) {
  return ativo && (!inicio || !fim || inicio >= fim);
}

function intervaloForaDoExpediente(ativo, inicio, fim, expedienteInicio, expedienteFim) {
  return ativo && (inicio < expedienteInicio || fim > expedienteFim);
}

export function getDiasSemana() {
  return DIAS_SEMANA.map((nome, diaSemana) => ({ nome, diaSemana }));
}

export function montarHorarioAtendimento(dados) {
  return {
    diaSemana: Number(dados.diaSemana),
    diaNome: DIAS_SEMANA[Number(dados.diaSemana)] || "",
    ativo: Boolean(dados.ativo),
    inicio: texto(dados.inicio, "08:00"),
    fim: texto(dados.fim, "18:00"),
    intervaloAtivo: Boolean(dados.intervaloAtivo),
    intervaloInicio: texto(dados.intervaloInicio, "12:00"),
    intervaloFim: texto(dados.intervaloFim, "13:00"),
    observacoes: texto(dados.observacoes),
  };
}

export function montarExcecaoAgenda(dados) {
  return {
    data: texto(dados.data),
    fechado: Boolean(dados.fechado),
    inicio: texto(dados.inicio, "08:00"),
    fim: texto(dados.fim, "18:00"),
    intervaloAtivo: Boolean(dados.intervaloAtivo),
    intervaloInicio: texto(dados.intervaloInicio, "12:00"),
    intervaloFim: texto(dados.intervaloFim, "13:00"),
    observacoes: texto(dados.observacoes),
  };
}

export function validarHorarioAtendimento(dados) {
  const horario = montarHorarioAtendimento(dados);

  if (!Number.isInteger(horario.diaSemana) || horario.diaSemana < 0 || horario.diaSemana > 6) {
    throw new Error("Selecione um dia da semana válido.");
  }

  if (horario.ativo && (!horario.inicio || !horario.fim || horario.inicio >= horario.fim)) {
    throw new Error("Informe um intervalo válido para o dia de atendimento.");
  }

  if (intervaloInvalido(horario.intervaloAtivo, horario.intervaloInicio, horario.intervaloFim)) {
    throw new Error("Informe um intervalo de pausa válido.");
  }

  if (
    horario.ativo &&
    intervaloForaDoExpediente(
      horario.intervaloAtivo,
      horario.intervaloInicio,
      horario.intervaloFim,
      horario.inicio,
      horario.fim
    )
  ) {
    throw new Error("O intervalo precisa ficar dentro do horário de atendimento.");
  }

  return horario;
}

export function validarExcecaoAgenda(dados) {
  const excecao = montarExcecaoAgenda(dados);

  if (!excecao.data) {
    throw new Error("Informe a data da exceção.");
  }

  if (!excecao.fechado && (!excecao.inicio || !excecao.fim || excecao.inicio >= excecao.fim)) {
    throw new Error("Informe um intervalo válido para a exceção.");
  }

  if (intervaloInvalido(excecao.intervaloAtivo, excecao.intervaloInicio, excecao.intervaloFim)) {
    throw new Error("Informe um intervalo de pausa válido para a exceção.");
  }

  if (
    !excecao.fechado &&
    intervaloForaDoExpediente(
      excecao.intervaloAtivo,
      excecao.intervaloInicio,
      excecao.intervaloFim,
      excecao.inicio,
      excecao.fim
    )
  ) {
    throw new Error("O intervalo da exceção precisa ficar dentro do horário de atendimento.");
  }

  return excecao;
}
