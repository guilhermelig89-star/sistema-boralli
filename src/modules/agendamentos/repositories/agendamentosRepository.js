import {
  collection,
  addDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../../shared/firebase/firebaseConfig";

const agendamentosRef = collection(db, "agendamentos");
const pacotesRef = collection(db, "pacotesClientes");
const historicoRef = collection(db, "pacotesHistorico");

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

    let consumoPacote = null;

    if (agendamento.pacoteClienteId) {
      const pacoteRef = doc(pacotesRef, agendamento.pacoteClienteId);
      const pacoteSnapshot = await transaction.get(pacoteRef);

      if (!pacoteSnapshot.exists()) {
        throw new Error("Pacote do cliente não encontrado.");
      }

      const pacote = pacoteSnapshot.data();
      const total = Number(pacote.quantidadeTotal || 0);
      const utilizadoAtual = Number(pacote.quantidadeUtilizada || 0);
      const saldoAtual = Number(pacote.saldoRestante ?? total - utilizadoAtual);

      if (saldoAtual <= 0) {
        throw new Error("Este pacote não possui saldo disponível.");
      }

      const saldoDepois = saldoAtual - 1;
      const quantidadeUtilizada = utilizadoAtual + 1;
      const historicoDoc = doc(historicoRef);

      consumoPacote = {
        pacoteClienteId: agendamento.pacoteClienteId,
        pacoteNome: pacote.nome,
        clienteId: agendamento.clienteId,
        clienteNome: agendamento.clienteNome,
        servicoId: agendamento.servicoId,
        servicoNome: agendamento.servicoNome,
        agendamentoId,
        quantidadeConsumida: 1,
        saldoAntes: saldoAtual,
        saldoDepois,
      };

      transaction.update(pacoteRef, {
        quantidadeUtilizada,
        saldoRestante: saldoDepois,
        status: saldoDepois <= 0 ? "esgotado" : "ativo",
        atualizadoEm: serverTimestamp(),
      });

      transaction.set(historicoDoc, {
        ...consumoPacote,
        tipo: "consumo_atendimento_finalizado",
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
