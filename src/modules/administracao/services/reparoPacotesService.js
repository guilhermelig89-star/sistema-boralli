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
  hist.forEach((h) => dup.set(h.agendamentoId || "", [...(dup.get(h.agendamentoId || "") || []), h]));
  const cancelarIds = [];
  dup.forEach((l) => l.slice(1).forEach((h) => cancelarIds.push(h.id)));
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
  };
  if (simulacao) return preview;

  return runTransaction(db, async (tx) => {
    tx.update(doc(pacotesRef, pacoteId), { quantidadeUtilizada: usadoDepois, saldoRestante: saldoDepois, status: saldoDepois > 0 ? "ativo" : "esgotado", atualizadoEm: serverTimestamp() });
    preview.historicosAjustar.forEach((id) => tx.update(doc(historicoRef, id), { cancelado: true, estornado: true, status: "estornado", valido: false, estornadoMotivo: "reparo_administrativo", estornadoEm: serverTimestamp(), atualizadoEm: serverTimestamp() }));
    tx.set(doc(auditoriaRef), { tipo: "reparo_pacote_admin", pacoteClienteId: pacoteId, ...preview, criadoEm: serverTimestamp() });
    return preview;
  });
}

export async function recalcularTodosPacotes({ simulacao = true }) {
  const pS = await getDocs(pacotesRef);
  const pacotes = rows(pS);
  const preview = await Promise.all(pacotes.map((p) => corrigirPacoteInconsistente({ pacoteId: p.id, simulacao })));
  return preview;
}
