import {
  criarAgendamentoRegistro,
  cancelarAgendamentoRegistro,
  finalizarAgendamentoRegistro,
  iniciarAgendamentoRegistro,
  atualizarAgendamentoRegistro,
  excluirAgendamentoRegistro,
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

function obterOcupacoesDoDia(data, agendamentosExistentes) {
  return agendamentosExistentes
    .filter((item) => item.data === data && item.status !== "cancelado" && item.status !== "finalizado")
    .map((item) => {
      const inicio = horaParaMinutos(item.hora);
      const fim = inicio === null ? null : inicio + numero(item.servicoDuracaoMinutos, 60);
      return { inicio, fim, tipo: "agendamento" };
    })
    .filter((item) => item.inicio !== null && item.fim !== null);
}

function obterBloqueiosDoDia(janela, ocupacoes) {
  const bloqueios = [...ocupacoes];
  const intervaloInicio = horaParaMinutos(janela.intervaloInicio);
  const intervaloFim = horaParaMinutos(janela.intervaloFim);

  if (janela.intervaloAtivo && intervaloInicio !== null && intervaloFim !== null) {
    bloqueios.push({ inicio: intervaloInicio, fim: intervaloFim, tipo: "intervalo" });
  }

  return bloqueios.sort((a, b) => a.inicio - b.inicio);
}

function avaliarEncaixe(inicio, fim, janela, bloqueios) {
  const inicioJanela = horaParaMinutos(janela.inicio);
  const fimJanela = horaParaMinutos(janela.fim);
  const bloqueioAntes = [...bloqueios].reverse().find((item) => item.fim <= inicio);
  const bloqueioDepois = bloqueios.find((item) => item.inicio >= fim);
  const encostaAntes = inicio === inicioJanela || bloqueioAntes?.fim === inicio;
  const encostaDepois = fim === fimJanela || bloqueioDepois?.inicio === fim;
  let score = 0;
  let motivo = "Disponível";

  if (encostaAntes && encostaDepois) {
    return { score: 100, motivo: "Preenche uma lacuna" };
  }

  if (encostaAntes) {
    score += 40;
    motivo = bloqueioAntes?.tipo === "intervalo" ? "Depois do intervalo" : "Depois de atendimento";
    if (inicio === inicioJanela) motivo = "Primeiro horário do expediente";
  }

  if (encostaDepois) {
    score += 35;
    motivo = bloqueioDepois?.tipo === "intervalo" ? "Antes do intervalo" : "Antes de atendimento";
    if (fim === fimJanela) motivo = "Último encaixe do expediente";
  }

  if (!encostaAntes && bloqueioAntes) {
    const lacunaAntes = inicio - bloqueioAntes.fim;
    if (lacunaAntes > 0 && lacunaAntes < 30) score -= 15;
  }

  if (!encostaDepois && bloqueioDepois) {
    const lacunaDepois = bloqueioDepois.inicio - fim;
    if (lacunaDepois > 0 && lacunaDepois < 30) score -= 15;
  }

  return { score, motivo };
}

export function montarAgendamento(dados) {
  const duracaoPrevista = numero(dados.tempoPrevistoMinutos || dados.servicoDuracaoMinutos, 60) || 60;

  return {
    clienteId: dados.clienteId,
    clienteNome: texto(dados.clienteNome),
    servicoId: dados.servicoId,
    servicoNome: texto(dados.servicoNome),
    servicoDuracaoMinutos: duracaoPrevista,
    tempoPrevistoMinutos: duracaoPrevista,
    tempoSugeridoOrigem: texto(dados.tempoSugeridoOrigem, "padrao"),
    tempoSugeridoMensagem: texto(dados.tempoSugeridoMensagem),
    tempoSugeridoQuantidadeBase: numero(dados.tempoSugeridoQuantidadeBase, 0),
    pacoteClienteId: dados.pacoteClienteId || "",
    pacoteNome: texto(dados.pacoteNome),
    data: texto(dados.data),
    hora: texto(dados.hora),
    formaPagamento:
      dados.pacoteClienteId
        ? "pacote"
        : texto(dados.formaPagamento, "avulso") === "combo"
          ? "avulso"
          : texto(dados.formaPagamento, "avulso"),
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

  if (inicioJanela === null || fimJanela === null || inicioJanela >= fimJanela) return [];

  const ocupacoes = obterOcupacoesDoDia(data, agendamentosExistentes);
  const bloqueios = obterBloqueiosDoDia(janela, ocupacoes);
  const horarios = [];

  for (let inicio = inicioJanela; inicio + duracao <= fimJanela; inicio += intervaloMinutos) {
    const fim = inicio + duracao;
    const conflita = bloqueios.some((item) => horariosConflitam(inicio, fim, item.inicio, item.fim));

    if (!conflita) {
      horarios.push(minutosParaHora(inicio));
    }
  }

  return horarios;
}

export function sugerirHorariosInteligentes({
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
  const horarios = gerarHorariosDisponiveis({
    data,
    duracaoMinutos,
    configuracaoAgenda: configuracao,
    agendamentosExistentes,
    intervaloMinutos,
  });
  const duracao = numero(duracaoMinutos, 60) || 60;

  if (!janela || horarios.length === 0) {
    return { recomendados: [], outros: [] };
  }

  const bloqueios = obterBloqueiosDoDia(janela, obterOcupacoesDoDia(data, agendamentosExistentes));
  const sugestoes = horarios.map((hora) => {
    const inicio = horaParaMinutos(hora);
    const fim = inicio + duracao;
    const avaliacao = avaliarEncaixe(inicio, fim, janela, bloqueios);

    return {
      hora,
      motivo: avaliacao.motivo,
      score: avaliacao.score,
    };
  });
  const ordenadas = [...sugestoes].sort((a, b) => b.score - a.score || a.hora.localeCompare(b.hora));
  const recomendados = ordenadas.filter((item) => item.score > 0).slice(0, 4);
  const horasRecomendadas = new Set(recomendados.map((item) => item.hora));
  const outros = sugestoes.filter((item) => !horasRecomendadas.has(item.hora));

  return { recomendados, outros };
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

function construirHistoricoAlteracoes(anterior, proximo) {
  const campos = [
    "clienteId",
    "clienteNome",
    "servicoId",
    "servicoNome",
    "data",
    "hora",
    "servicoDuracaoMinutos",
    "valor",
    "desconto",
    "observacoes",
    "status",
    "formaPagamento",
    "statusFinanceiro",
  ];

  const alteracoes = campos
    .filter((campo) => (anterior?.[campo] ?? "") !== (proximo?.[campo] ?? ""))
    .map((campo) => ({ campo, valorAntigo: anterior?.[campo] ?? null, valorNovo: proximo?.[campo] ?? null }));

  if (!alteracoes.length) return [];

  return [{
    alteradoEm: new Date().toISOString(),
    alteracoes,
  }];
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

export function iniciarAgendamento(id) {
  return iniciarAgendamentoRegistro(id);
}

export function finalizarAgendamento(id, fechamentoFinanceiro) {
  return finalizarAgendamentoRegistro(id, fechamentoFinanceiro);
}

export function cancelarAgendamento(id) {
  return cancelarAgendamentoRegistro(id);
}

export async function editarAgendamento({
  original,
  dados,
  agendamentosExistentes = [],
  configuracaoAgenda = {},
  confirmarEdicaoFinalizado,
}) {
  const configuracao = {
    horarios: configuracaoAgenda.horarios || [],
    excecoes: configuracaoAgenda.excecoes || [],
  };
  const atualizado = {
    ...montarAgendamento(dados),
    status: texto(dados.status, original.status || "agendado"),
    desconto: numero(dados.desconto, 0),
    statusFinanceiro: texto(dados.statusFinanceiro, original.statusFinanceiro || "pendente"),
  };

  validarHorarioDisponivel(atualizado, configuracao);

  const semAtual = agendamentosExistentes.filter((item) => item.id !== original.id);
  if (validarConflitoHorario(atualizado, semAtual)) {
    throw new Error("Este horário conflita com outro agendamento ativo.");
  }

  if (original.status === "finalizado" && (original.pacoteClienteId !== atualizado.pacoteClienteId || Number(original.valor || 0) !== Number(atualizado.valor || 0))) {
    const confirmou = typeof confirmarEdicaoFinalizado === "function" ? confirmarEdicaoFinalizado() : false;
    if (!confirmou) {
      throw new Error("Edição de pacote/financeiro cancelada para agendamento finalizado.");
    }
  }

  const historico = construirHistoricoAlteracoes(original, atualizado);
  return atualizarAgendamentoRegistro(original.id, atualizado, historico);
}

export function excluirAgendamento(id) {
  return excluirAgendamentoRegistro(id);
}
