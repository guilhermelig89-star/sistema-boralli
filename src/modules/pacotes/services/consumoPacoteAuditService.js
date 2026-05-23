import { collection, doc, getDocs, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../../../shared/firebase/firebaseConfig";

const historicoRef = collection(db, "pacotesHistorico");
const agendamentosRef = collection(db, "agendamentos");
const pacotesRef = collection(db, "pacotesClientes");

function toMapByAgendamento(historico) {
  return historico.reduce((acc, item) => {
    const chave = item.agendamentoId || "__sem_agendamento__";
    acc[chave] = acc[chave] || [];
    acc[chave].push(item);
    return acc;
  }, {});
}

export async function detectarInconsistenciasConsumoPacotes() {
  const [historicoSnap, agendamentosSnap] = await Promise.all([getDocs(historicoRef), getDocs(agendamentosRef)]);
  const historico = historicoSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const agendamentos = agendamentosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const historicoPorAgendamento = toMapByAgendamento(historico);

  const duplicidades = Object.entries(historicoPorAgendamento)
    .filter(([agendamentoId, itens]) => agendamentoId !== "__sem_agendamento__" && itens.length > 1)
    .map(([agendamentoId, itens]) => ({
      agendamentoId,
      clienteId: itens[0]?.clienteId || "",
      clienteNome: itens[0]?.clienteNome || "",
      pacoteClienteId: itens[0]?.pacoteClienteId || "",
      quantidadeRegistros: itens.length,
      historicoIds: itens.map((x) => x.id),
      tipos: [...new Set(itens.map((x) => x.tipo))],
    }));

  const agendamentosSemFlag = agendamentos.filter((a) => {
    const temHistorico = (historicoPorAgendamento[a.id] || []).length > 0;
    return a.status === "finalizado" && a.pacoteClienteId && temHistorico && a.pacoteConsumido !== true;
  });

  return {
    totalHistorico: historico.length,
    totalAgendamentos: agendamentos.length,
    duplicidades,
    agendamentosSemFlag: agendamentosSemFlag.map((a) => ({
      agendamentoId: a.id,
      clienteId: a.clienteId || "",
      clienteNome: a.clienteNome || "",
      pacoteClienteId: a.pacoteClienteId || "",
    })),
  };
}

export async function corrigirConsumosDuplicados({ agendamentoId, manterHistoricoId }) {
  if (!agendamentoId || !manterHistoricoId) {
    throw new Error("Informe agendamentoId e manterHistoricoId para corrigir duplicidade.");
  }

  return runTransaction(db, async (transaction) => {
    const agendamentoRef = doc(agendamentosRef, agendamentoId);
    const agendamentoSnap = await transaction.get(agendamentoRef);
    if (!agendamentoSnap.exists()) throw new Error("Agendamento não encontrado.");

    const historicoSnap = await getDocs(historicoRef);
    const registros = historicoSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((h) => h.agendamentoId === agendamentoId);

    if (registros.length <= 1) return { ajustado: false, motivo: "Sem duplicidade." };

    const manter = registros.find((item) => item.id === manterHistoricoId);
    if (!manter) throw new Error("Registro a manter não encontrado.");

    const remover = registros.filter((item) => item.id !== manterHistoricoId);
    const pacoteRef = doc(pacotesRef, manter.pacoteClienteId);
    const pacoteSnap = await transaction.get(pacoteRef);
    if (!pacoteSnap.exists()) throw new Error("Pacote não encontrado para estorno.");

    const pacote = pacoteSnap.data();
    const quantidadeEstorno = remover.reduce((acc, item) => acc + Number(item.quantidadeConsumida || 0), 0);
    const saldoRestante = Number(pacote.saldoRestante || 0) + quantidadeEstorno;

    transaction.update(pacoteRef, {
      saldoRestante,
      atualizadoEm: serverTimestamp(),
      ajusteDuplicidadeEm: serverTimestamp(),
      ajusteDuplicidadeQuantidade: quantidadeEstorno,
    });

    transaction.update(agendamentoRef, {
      pacoteConsumido: true,
      consumoPacote: {
        pacoteClienteId: manter.pacoteClienteId,
        servicoId: manter.servicoId,
        servicoNome: manter.servicoNome,
        quantidadeConsumida: manter.quantidadeConsumida,
        agendamentoId,
      },
      atualizadoEm: serverTimestamp(),
    });

    return {
      ajustado: true,
      removidos: remover.map((x) => x.id),
      manter: manterHistoricoId,
      quantidadeEstorno,
    };
  });
}
