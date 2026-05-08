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
    observacoes: texto(dados.observacoes),
  };
}

export function montarExcecaoAgenda(dados) {
  return {
    data: texto(dados.data),
    fechado: Boolean(dados.fechado),
    inicio: texto(dados.inicio, "08:00"),
    fim: texto(dados.fim, "18:00"),
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

  return excecao;
}
