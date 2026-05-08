import {
  collection,
  addDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { consumirServicoDoPacote } from "../../pacotes/domain/pacotesDomain";
import { db } from "../../../shared/firebase/firebaseConfig";

const agendamentosRef = collection(db, "agendamentos");
const pacotesRef = collection(db, "pacotesClientes");
const historicoRef = collection(db, "pacotesHistorico");
const movimentosFinanceirosRef = collection(db, "movimentosFinanceiros");

function mapDocumento(documento) {
  return {
    id: documento.id,
    ...documento.data(),
  };
}

export function observarAgendamentos(onAgendamentos, onErro) {
  const consulta = query(agendamentosRef, orderBy("data"));

  return onSnapshot(
    consulta,
    (snapshot) => {
      const dados = snapshot.docs.map(mapDocumento).sort((a, b) => {
        const dataA = `${a.data || ""} ${a.hora || ""}`;
        const dataB = `${b.data || ""} ${b.hora || ""}`;
        return dataA.localeCompare(dataB);
      });

      onAgendamentos(dados);
    },
    onErro
  );
}

export function criarAgendamentoRegistro(dados) {
  return addDoc(agendamentosRef, {
    ...dados,
    status: "agendado",
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export function cancelarAgendamentoRegistro(agendamentoId) {
  return updateDoc(doc(db, "agendamentos", agendamentoId), {
    status: "cancelado",
    canceladoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export function finalizarAgendamentoRegistro(agendamentoId) {
  return runTransaction(db, async (transaction) => {
    const agendamentoRef = doc(db, "agendamentos", agendamentoId);
    const agendamentoSnapshot = await transaction.get(agendamentoRef);

    if (!agendamentoSnapshot.exists()) {
      throw new Error("Agendamento não encontrado.");
    }

    const agendamento = agendamentoSnapshot.data();

    if (agendamento.status === "finalizado") {
      throw new Error("Este atendimento já foi finalizado.");
    }

    if (agendamento.status === "cancelado") {
      throw new Error("Não é possível finalizar um agendamento cancelado.");
    }

    let consumoPacote = null;

    if (agendamento.pacoteClienteId) {
      const pacoteRef = doc(pacotesRef, agendamento.pacoteClienteId);
      const pacoteSnapshot = await transaction.get(pacoteRef);

      if (!pacoteSnapshot.exists()) {
        throw new Error("Pacote do cliente não encontrado.");
      }

      const pacote = {
        id: pacoteSnapshot.id,
        ...pacoteSnapshot.data(),
      };
      const resultadoConsumo = consumirServicoDoPacote(pacote, agendamento.servicoId);
      const historicoDoc = doc(historicoRef);

      consumoPacote = {
        ...resultadoConsumo.consumoPacote,
        agendamentoId,
      };

      transaction.update(pacoteRef, {
        ...resultadoConsumo.atualizacao,
        atualizadoEm: serverTimestamp(),
      });

      transaction.set(historicoDoc, {
        ...consumoPacote,
        tipo: "consumo_atendimento_finalizado",
        criadoEm: serverTimestamp(),
      });
    } else if (Number(agendamento.valor || 0) > 0) {
      const movimentoDoc = doc(movimentosFinanceirosRef);

      transaction.set(movimentoDoc, {
        tipo: "receita",
        origem: "atendimento_avulso",
        agendamentoId,
        clienteId: agendamento.clienteId,
        clienteNome: agendamento.clienteNome,
        servicoId: agendamento.servicoId,
        servicoNome: agendamento.servicoNome,
        descricao: `Atendimento avulso - ${agendamento.servicoNome}`,
        valor: Number(agendamento.valor || 0),
        formaPagamento: agendamento.formaPagamento || "avulso",
        status: "confirmado",
        criadoEm: serverTimestamp(),
      });
    }

    transaction.update(agendamentoRef, {
      status: "finalizado",
      pacoteConsumido: Boolean(consumoPacote),
      consumoPacote,
      finalizadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  });
}
