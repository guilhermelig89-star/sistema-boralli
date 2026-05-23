import { collection, doc, getDocs, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../../../shared/firebase/firebaseConfig";
const agendamentosRef = collection(db, "agendamentos");
const pacotesRef = collection(db, "pacotesClientes");
const historicoRef = collection(db, "pacotesHistorico");
const auditoriaRef = collection(db, "pacotesConsumoAuditoria");
const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const rows = (s) => s.docs.map((d) => ({ id: d.id, ...d.data() }));
const inativo = (h) => h.estornado || h.cancelado || h.status === "cancelado" || h.valido === false;
const addServicoSaldo = (map, hist) => {
  const key = hist.servicoId || hist.servicoNome || "sem_servico";
  map.set(key, (map.get(key) || 0) + Math.max(1, n(hist.quantidadeConsumida, 1)));
};
const keyInconsistencia = (item = {}) => `${item.pacoteId || ""}__${item.agendamentoId || ""}__${item.problema || ""}`;
const isJoana = (nome = "") => String(nome).trim().toLowerCase() === "joana";

export async function listarInconsistenciasPacotes() { /* simplified below */
  const [aS, pS, hS] = await Promise.all([getDocs(agendamentosRef), getDocs(pacotesRef), getDocs(historicoRef)]);
  const ag = new Map(rows(aS).map((x) => [x.id, x]));
  const pacotes = rows(pS);
  const hist = rows(hS);
  const byPacote = new Map(pacotes.map((p) => [p.id, p]));
  const inconsistencias = [];
  const ativoPorPacote = new Map();
  const dup = new Map();

  hist.forEach((h) => {
    const qtd = Math.max(1, n(h.quantidadeConsumida, 1));
    const key = `${h.pacoteClienteId || ""}__${h.agendamentoId || ""}`;
    if (h.pacoteClienteId && h.agendamentoId) dup.set(key, [...(dup.get(key) || []), h]);
    if (!inativo(h) && h.pacoteClienteId) ativoPorPacote.set(h.pacoteClienteId, (ativoPorPacote.get(h.pacoteClienteId) || 0) + qtd);
    const pacote = byPacote.get(h.pacoteClienteId) || {};
    const a = ag.get(h.agendamentoId);
    if (a?.status === "cancelado" && !inativo(h)) inconsistencias.push({ id: `c_${h.id}`, pacoteId: h.pacoteClienteId, historicoId: h.id, cliente: h.clienteNome, pacote: h.pacoteNome || pacote.nome, servico: h.servicoNome, agendamentoId: h.agendamentoId, problema: "Agendamento cancelado mas pacote ainda consumido", acao: "Estornar/cancelar consumo e recalcular" });
    if (h.estornado === true && h.valido !== false) inconsistencias.push({ id: `e_${h.id}`, pacoteId: h.pacoteClienteId, historicoId: h.id, cliente: h.clienteNome, pacote: h.pacoteNome || pacote.nome, servico: h.servicoNome, agendamentoId: h.agendamentoId, problema: "Consumo estornado contando no saldo", acao: "Marcar válido=false e excluir da contagem ativa" });
  });

  pacotes.forEach((p) => {
    const usado = n(p.quantidadeUtilizada, 0), contratado = n(p.quantidadeTotal, 0), ativo = ativoPorPacote.get(p.id) || 0;
    if (ativo > usado) inconsistencias.push({ id: `h_${p.id}`, pacoteId: p.id, cliente: p.clienteNome, pacote: p.nome, servico: p.servicoNome, agendamentoId: "-", problema: "Histórico ativo maior que saldo usado", acao: "Recalcular usados/restantes pelo histórico ativo" });
    if (usado > contratado) inconsistencias.push({ id: `u_${p.id}`, pacoteId: p.id, cliente: p.clienteNome, pacote: p.nome, servico: p.servicoNome, agendamentoId: "-", problema: "Usado maior que contratado", acao: "Ajustar usados e saldo" });
  });

  dup.forEach((list) => list.slice(1).forEach((h) => {
    const pacote = byPacote.get(h.pacoteClienteId) || {};
    inconsistencias.push({ id: `d_${h.id}`, pacoteId: h.pacoteClienteId, historicoId: h.id, cliente: h.clienteNome, pacote: h.pacoteNome || pacote.nome, servico: h.servicoNome, agendamentoId: h.agendamentoId, problema: "Consumo duplicado pelo mesmo agendamentoId", acao: "Cancelar duplicata e recalcular pacote" });
  }));
  return inconsistencias;
}

export async function corrigirPacoteInconsistente({ pacoteId, simulacao = true }) {
  const [hS, aS, pS] = await Promise.all([getDocs(historicoRef), getDocs(agendamentosRef), getDocs(pacotesRef)]);
  const hist = rows(hS).filter((h) => h.pacoteClienteId === pacoteId);
  const ag = new Map(rows(aS).map((x) => [x.id, x]));
  const pacote = rows(pS).find((p) => p.id === pacoteId);
  if (!pacote) throw new Error("Pacote não encontrado.");
  const dup = new Map();
  hist.forEach((h) => {
    if (!h.agendamentoId) return;
    dup.set(h.agendamentoId, [...(dup.get(h.agendamentoId) || []), h]);
  });
  const cancelarIds = [];
  dup.forEach((l) => {
    const ativosMesmoAgendamento = l.filter((h) => !inativo(h));
    ativosMesmoAgendamento.slice(1).forEach((h) => cancelarIds.push(h.id));
  });
  const ativosAntes = hist.filter((h) => !inativo(h));
  const ativos = hist.filter((h) => !cancelarIds.includes(h.id) && !inativo(h) && ag.get(h.agendamentoId)?.status !== "cancelado");
  const usadoDepois = Math.min(n(pacote.quantidadeTotal, 0), ativos.reduce((s, h) => s + Math.max(1, n(h.quantidadeConsumida, 1)), 0));
  const saldoDepois = Math.max(0, n(pacote.quantidadeTotal, 0) - usadoDepois);
  const saldoServicoAntes = new Map();
  const saldoServicoDepois = new Map();
  ativosAntes.forEach((h) => addServicoSaldo(saldoServicoAntes, h));
  ativos.forEach((h) => addServicoSaldo(saldoServicoDepois, h));
  const historicosAjustar = hist.filter((h) => cancelarIds.includes(h.id) || (ag.get(h.agendamentoId)?.status === "cancelado" && !inativo(h)) || (h.estornado && h.valido !== false)).map((h) => h.id);
  const preview = {
    pacoteId,
    usadoAntes: n(pacote.quantidadeUtilizada, 0),
    saldoAntes: n(pacote.saldoRestante, 0),
    usadoDepois,
    saldoDepois,
    consumosCorrigidos: historicosAjustar.length,
    saldoPorServicoAntes: Object.fromEntries(saldoServicoAntes),
    saldoPorServicoDepois: Object.fromEntries(saldoServicoDepois),
    historicosAjustar,
    duplicadosJaInativos: hist.filter((h) => h.agendamentoId && inativo(h)).map((h) => h.id),
  };
  if (simulacao) return preview;

  return runTransaction(db, async (tx) => {
    const itensOriginais = Array.isArray(pacote.itens) ? pacote.itens : [];
    const consumoAtivoPorServico = new Map();
    ativos.forEach((h) => addServicoSaldo(consumoAtivoPorServico, h));
    const itensRecalculados = itensOriginais.map((item) => {
      const key = item.servicoId || item.servicoNome || "sem_servico";
      const usadoItem = Math.min(n(item.quantidade, 0), consumoAtivoPorServico.get(key) || 0);
      return {
        ...item,
        quantidadeUtilizada: usadoItem,
        saldoRestante: Math.max(0, n(item.quantidade, 0) - usadoItem),
      };
    });
    tx.update(doc(pacotesRef, pacoteId), {
      quantidadeUtilizada: usadoDepois,
      saldoRestante: saldoDepois,
      status: saldoDepois > 0 ? "ativo" : "esgotado",
      itens: itensRecalculados,
      atualizadoEm: serverTimestamp(),
    });
    preview.historicosAjustar.forEach((id) => tx.update(doc(historicoRef, id), { cancelado: true, estornado: true, status: "estornado", valido: false, estornadoMotivo: "reparo_administrativo", estornadoEm: serverTimestamp(), atualizadoEm: serverTimestamp() }));
    tx.set(doc(auditoriaRef), { tipo: "reparo_pacote_admin", pacoteClienteId: pacoteId, ...preview, criadoEm: serverTimestamp() });
    return preview;
  });
}

export async function aplicarCorrecaoPacoteERecarregar({ pacoteId }) {
  const resumo = await corrigirPacoteInconsistente({ pacoteId, simulacao: false });
  const inconsistenciasAtualizadas = await listarInconsistenciasPacotes();
  const aindaPendentes = inconsistenciasAtualizadas.filter((item) => item.pacoteId === pacoteId);
  const mudouSaldo = resumo.usadoAntes !== resumo.usadoDepois || resumo.saldoAntes !== resumo.saldoDepois;
  const motivos = [];
  if (aindaPendentes.length) {
    motivos.push("Ainda existem inconsistências para o pacote após o reparo.");
  }
  if (!mudouSaldo) {
    motivos.push("Usado/saldo não mudou: o duplicado já não estava contando no saldo, mas permanecia no histórico e foi marcado como estornado/cancelado.");
  }
  const pendencias = aindaPendentes.map((i) => ({ chave: keyInconsistencia(i), problema: i.problema, agendamentoId: i.agendamentoId || "-", acao: i.acao }));
  return { ...resumo, inconsistenciasAtualizadas, pendencias, mensagemPosCorrecao: motivos.join(" ") };
}

export async function recalcularTodosPacotes({ simulacao = true }) {
  const pS = await getDocs(pacotesRef);
  const pacotes = rows(pS);
  const preview = await Promise.all(pacotes.map((p) => corrigirPacoteInconsistente({ pacoteId: p.id, simulacao })));
  return preview;
}

export async function limparConsumosJoana({ simulacao = true }) {
  const [hS, aS, pS] = await Promise.all([getDocs(historicoRef), getDocs(agendamentosRef), getDocs(pacotesRef)]);
  const historicos = rows(hS);
  const agendamentos = rows(aS);
  const pacotes = rows(pS);

  const pacotesJoana = pacotes.filter((p) => isJoana(p.clienteNome));
  const pacoteIds = new Set(pacotesJoana.map((p) => p.id));
  const historicosJoana = historicos.filter((h) => pacoteIds.has(h.pacoteClienteId) || isJoana(h.clienteNome));
  const historicoIds = new Set(historicosJoana.map((h) => h.id));

  const agendamentosJoanaComConsumo = agendamentos.filter((a) => {
    if (!isJoana(a.clienteNome)) return false;
    if (a.pacoteConsumido === true) return true;
    const historicoAgendamento = historicosJoana.some((h) => h.agendamentoId && h.agendamentoId === a.id && !inativo(h));
    return Boolean(a.consumoPacote?.agendamentoId) || historicoAgendamento;
  });

  const previewPacotes = pacotesJoana.map((p) => {
    const itens = Array.isArray(p.itens) ? p.itens : [];
    return {
      pacoteId: p.id,
      pacoteNome: p.nome || "Pacote",
      saldoAtual: n(p.saldoRestante, 0),
      usadoAtual: n(p.quantidadeUtilizada, 0),
      saldoFinalEsperado: n(p.quantidadeTotal, 0),
      usadoFinalEsperado: 0,
      itens: itens.map((item) => ({
        servicoId: item.servicoId || null,
        servicoNome: item.servicoNome || null,
        saldoAtual: n(item.saldoRestante, n(item.quantidade, 0)),
        saldoFinalEsperado: n(item.quantidade, 0),
      })),
    };
  });

  const preview = {
    cliente: "Joana",
    totalPacotes: pacotesJoana.length,
    totalHistoricosParaRemover: historicosJoana.length,
    totalAgendamentosParaDesvincular: agendamentosJoanaComConsumo.length,
    historicosParaRemover: historicosJoana.map((h) => ({ id: h.id, pacoteClienteId: h.pacoteClienteId || null, agendamentoId: h.agendamentoId || null, status: h.status || null, cancelado: Boolean(h.cancelado), estornado: Boolean(h.estornado), valido: h.valido !== false })),
    agendamentosParaDesvincular: agendamentosJoanaComConsumo.map((a) => ({ id: a.id, status: a.status || null, pacoteConsumido: Boolean(a.pacoteConsumido), statusFinanceiroAtual: a.statusFinanceiro || null, consumoPacoteAgendamentoId: a.consumoPacote?.agendamentoId || null })),
    pacotes: previewPacotes,
  };

  if (simulacao) return preview;

  return runTransaction(db, async (tx) => {
    pacotesJoana.forEach((p) => {
      const itens = Array.isArray(p.itens) ? p.itens : [];
      tx.update(doc(pacotesRef, p.id), {
        quantidadeUtilizada: 0,
        saldoRestante: n(p.quantidadeTotal, 0),
        status: "ativo",
        itens: itens.map((item) => ({ ...item, quantidadeUtilizada: 0, saldoRestante: n(item.quantidade, 0) })),
        atualizadoEm: serverTimestamp(),
      });
    });

    historicosJoana.forEach((h) => {
      tx.update(doc(historicoRef, h.id), {
        removido: true,
        cancelado: true,
        estornado: true,
        valido: false,
        status: "estornado",
        estornadoMotivo: "limpeza_consumo_joana",
        estornadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });
    });

    agendamentosJoanaComConsumo.forEach((a) => {
      tx.update(doc(agendamentosRef, a.id), {
        pacoteConsumido: false,
        consumoPacote: null,
        statusFinanceiro: "nao_lancar",
        atualizadoEm: serverTimestamp(),
      });
    });

    tx.set(doc(auditoriaRef), {
      tipo: "limpeza_consumo_cliente_joana",
      ...preview,
      historicoIdsAjustados: Array.from(historicoIds),
      criadoEm: serverTimestamp(),
    });

    return preview;
  });
}
