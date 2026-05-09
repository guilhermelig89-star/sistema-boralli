function numero(valor, padrao = 0) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : padrao;
}

function timestampParaData(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor === "string") {
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
  }
  if (typeof valor.toDate === "function") return valor.toDate();
  if (Number.isFinite(valor.seconds)) return new Date(valor.seconds * 1000);
  return null;
}

function arredondarMinutos(valor) {
  return Math.max(1, Math.round(numero(valor, 1)));
}

function mediaMinutos(registros) {
  if (!registros.length) return 0;
  const total = registros.reduce((soma, item) => soma + numero(item.tempoRealMinutos), 0);
  return arredondarMinutos(total / registros.length);
}

function obterMediana(valores) {
  if (!valores.length) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);

  if (ordenados.length % 2 === 0) {
    return (ordenados[meio - 1] + ordenados[meio]) / 2;
  }

  return ordenados[meio];
}

export function removerTemposForaDaCurva(registros) {
  if (registros.length < 4) return registros;

  const tempos = registros.map((item) => numero(item.tempoRealMinutos)).filter((item) => item > 0);
  const mediana = obterMediana(tempos);

  if (!mediana) return registros;

  const minimoAceito = mediana * 0.45;
  const maximoAceito = mediana * 2.1;
  const filtrados = registros.filter((item) => {
    const tempo = numero(item.tempoRealMinutos);
    return tempo >= minimoAceito && tempo <= maximoAceito;
  });

  return filtrados.length >= Math.min(4, registros.length) ? filtrados : registros;
}

export function classificarAlertaTempo(diferencaPercentualAbsoluta) {
  const diferenca = Math.abs(numero(diferencaPercentualAbsoluta));

  if (diferenca <= 10) {
    return {
      nivel: "sem_alerta",
      titulo: "Tempo dentro do previsto",
      classe: "neutro",
      exigeAtencao: false,
    };
  }

  if (diferenca <= 19) {
    return {
      nivel: "leve",
      titulo: "Pequena diferença de tempo",
      classe: "leve",
      exigeAtencao: true,
    };
  }

  if (diferenca < 30) {
    return {
      nivel: "revisao",
      titulo: "Revisar sugestão de tempo",
      classe: "revisao",
      exigeAtencao: true,
    };
  }

  return {
    nivel: "forte",
    titulo: "Diferença alta de tempo",
    classe: "forte",
    exigeAtencao: true,
  };
}

export function calcularTempoFinalizacao(agendamento, dataFinalizacao = new Date()) {
  const tempoPrevistoMinutos = arredondarMinutos(
    agendamento.tempoPrevistoMinutos || agendamento.servicoDuracaoMinutos || 60
  );
  const inicio = timestampParaData(agendamento.atendimentoIniciadoEm || agendamento.iniciadoEm);
  const fim = timestampParaData(dataFinalizacao) || new Date();
  const tempoRealCalculado = Boolean(inicio && fim && fim.getTime() >= inicio.getTime());
  const tempoRealMinutos = tempoRealCalculado
    ? arredondarMinutos((fim.getTime() - inicio.getTime()) / 60000)
    : tempoPrevistoMinutos;
  const diferencaMinutos = tempoRealMinutos - tempoPrevistoMinutos;
  const diferencaPercentual = tempoPrevistoMinutos > 0
    ? (diferencaMinutos / tempoPrevistoMinutos) * 100
    : 0;
  const diferencaPercentualAbs = Math.abs(diferencaPercentual);
  const alerta = classificarAlertaTempo(diferencaPercentualAbs);

  return {
    tempoPrevistoMinutos,
    tempoRealMinutos,
    tempoRealCalculado,
    diferencaMinutos,
    diferencaPercentual: Math.round(diferencaPercentual),
    diferencaPercentualAbs: Math.round(diferencaPercentualAbs),
    atendimentoIniciadoEm: inicio ? inicio.toISOString() : "",
    atendimentoFinalizadoEm: fim.toISOString(),
    alertaTempoNivel: alerta.nivel,
    alertaTempoClasse: alerta.classe,
    alertaTempoTitulo: alerta.titulo,
    alertaTempoExigeAtencao: alerta.exigeAtencao,
  };
}

export function obterHistoricoTempoServico(agendamentos, servicoId) {
  return removerTemposForaDaCurva(
    agendamentos.filter(
      (item) =>
        item.status === "finalizado" &&
        item.servicoId === servicoId &&
        item.status !== "cancelado" &&
        item.tempoRealCalculado === true &&
        numero(item.tempoRealMinutos) > 0
    )
  );
}

export function obterHistoricoTempoClienteServico(agendamentos, clienteId, servicoId) {
  return removerTemposForaDaCurva(
    obterHistoricoTempoServico(agendamentos, servicoId).filter((item) => item.clienteId === clienteId)
  );
}

export function calcularSugestaoDuracao({ clienteId, servico, agendamentos = [], sugestoesTempo = [] }) {
  const duracaoPadrao = arredondarMinutos(servico?.duracaoMinutos || 60);

  if (!servico?.id) {
    return {
      duracaoMinutos: duracaoPadrao,
      origem: "padrao",
      quantidadeBase: 0,
      mensagem: `Duração sugerida: ${duracaoPadrao} min, usando duração padrão do serviço.`,
    };
  }

  const ajusteManual = sugestoesTempo.find(
    (item) =>
      item.ativo !== false &&
      item.tipo === "cliente_servico" &&
      item.clienteId === clienteId &&
      item.servicoId === servico.id &&
      numero(item.duracaoMinutos) > 0
  );

  if (ajusteManual) {
    const duracao = arredondarMinutos(ajusteManual.duracaoMinutos);
    return {
      duracaoMinutos: duracao,
      origem: "ajuste_cliente_servico",
      quantidadeBase: numero(ajusteManual.quantidadeBase, 0),
      mensagem: `Duração sugerida: ${duracao} min, baseada em ajuste confirmado para esta cliente e serviço.`,
    };
  }

  const historicoCliente = obterHistoricoTempoClienteServico(agendamentos, clienteId, servico.id);

  if (clienteId && historicoCliente.length >= 4) {
    const duracao = mediaMinutos(historicoCliente);
    return {
      duracaoMinutos: duracao,
      origem: "media_cliente_servico",
      quantidadeBase: historicoCliente.length,
      mensagem: `Duração sugerida: ${duracao} min, baseada em ${historicoCliente.length} atendimentos anteriores desta cliente.`,
    };
  }

  const historicoServico = obterHistoricoTempoServico(agendamentos, servico.id);

  if (historicoServico.length >= 10) {
    const duracao = mediaMinutos(historicoServico);
    return {
      duracaoMinutos: duracao,
      origem: "media_geral_servico",
      quantidadeBase: historicoServico.length,
      mensagem: `Duração sugerida: ${duracao} min, baseada na média geral de ${historicoServico.length} atendimentos deste serviço.`,
    };
  }

  return {
    duracaoMinutos: duracaoPadrao,
    origem: "padrao",
    quantidadeBase: 0,
    mensagem: `Duração sugerida: ${duracaoPadrao} min, usando duração padrão do serviço, pois ainda não há histórico suficiente.`,
  };
}
