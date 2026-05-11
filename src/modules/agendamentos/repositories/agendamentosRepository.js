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
  deleteDoc,
  arrayUnion,
} from "firebase/firestore";

import { consumirServicoDoPacote } from "../../pacotes/domain/pacotesDomain";
import { calcularTempoFinalizacao } from "../services/tempoAtendimentoService";
import { db } from "../../../shared/firebase/firebaseConfig";

const agendamentosRef = collection(db, "agendamentos");
const pacotesRef = collection(db, "pacotesClientes");
const historicoRef = collection(db, "pacotesHistorico");
const movimentosFinanceirosRef = collection(db, "movimentosFinanceiros");
const temposAtendimentoHistoricoRef = collection(db, "temposAtendimentoHistorico");

function mapDocumento(documento) {
  return {
    id: documento.id,
    ...documento.data(),
  };
}

function numero(valor, padrao = 0) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : padrao;
}

function texto(valor, padrao = "") {
  return String(valor || padrao).trim();
}

function dataHoje() {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function normalizarFechamentoFinanceiro(agendamento, fechamentoFinanceiro = {}) {
  const valorOriginal = numero(fechamentoFinanceiro.valorOriginal, numero(agendamento.valor, 0));
  const descontoValor = Math.min(valorOriginal, Math.max(0, numero(fechamentoFinanceiro.descontoValor, 0)));
  const valorFinal = Math.max(0, numero(fechamentoFinanceiro.valorFinal, valorOriginal - descontoValor));
  const valorRecebido = Math.min(valorFinal, Math.max(0, numero(fechamentoFinanceiro.valorRecebido, 0)));
  const valorPendente = Math.max(0, numero(fechamentoFinanceiro.valorPendente, valorFinal - valorRecebido));
  let statusFinanceiro = fechamentoFinanceiro.statusFinanceiro || "pago";

  if (valorPendente > 0 && valorRecebido > 0) statusFinanceiro = "parcial";
  if (valorPendente > 0 && valorRecebido <= 0) statusFinanceiro = "pendente";
  if (valorPendente <= 0) statusFinanceiro = "pago";

  return {
    valorOriginal,
    descontoValor,
    motivoDesconto: texto(fechamentoFinanceiro.motivoDesconto),
    valorFinal,
    valorRecebido,
    valorPendente,
    formaPagamento: texto(fechamentoFinanceiro.formaPagamento, statusFinanceiro === "pendente" ? "Fiado/Pendente" : "Não informado"),
    pagamentos: Array.isArray(fechamentoFinanceiro.pagamentos) ? fechamentoFinanceiro.pagamentos : [],
    observacoesFinanceiras: texto(fechamentoFinanceiro.observacoesFinanceiras),
    statusFinanceiro,
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

export function iniciarAgendamentoRegistro(agendamentoId) {
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
      throw new Error("Não é possível iniciar um agendamento cancelado.");
    }

    const iniciadoAgora = new Date().toISOString();

    transaction.update(agendamentoRef, {
      status: "em_atendimento",
      atendimentoIniciadoEm: iniciadoAgora,
      iniciadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  });
}

export function cancelarAgendamentoRegistro(agendamentoId) {
  return updateDoc(doc(db, "agendamentos", agendamentoId), {
    status: "cancelado",
    canceladoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export function atualizarAgendamentoRegistro(agendamentoId, dadosAtualizados, historicoAlteracoes = []) {
  return updateDoc(doc(db, "agendamentos", agendamentoId), {
    ...dadosAtualizados,
    historicoAlteracoes: arrayUnion(...historicoAlteracoes),
    atualizadoEm: serverTimestamp(),
  });
}

export function excluirAgendamentoRegistro(agendamentoId) {
  return deleteDoc(doc(db, "agendamentos", agendamentoId));
}

export function finalizarAgendamentoRegistro(agendamentoId, fechamentoFinanceiro = {}) {
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

    const resumoTempo = calcularTempoFinalizacao(agendamento);
    const fechamento = normalizarFechamentoFinanceiro(agendamento, fechamentoFinanceiro);
    let consumoPacote = null;
    let movimentoFinanceiroId = "";

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
    } else {
      const movimentoDoc = doc(movimentosFinanceirosRef);
      movimentoFinanceiroId = movimentoDoc.id;

      transaction.set(movimentoDoc, {
        tipo: "receita",
        origem: "atendimento_avulso",
        agendamentoId,
        clienteId: agendamento.clienteId,
        clienteNome: agendamento.clienteNome,
        servicoId: agendamento.servicoId,
        servicoNome: agendamento.servicoNome,
        descricao: `Fechamento de atendimento - ${agendamento.servicoNome}`,
        data: dataHoje(),
        valor: fechamento.valorRecebido,
        valorOriginal: fechamento.valorOriginal,
        descontoValor: fechamento.descontoValor,
        motivoDesconto: fechamento.motivoDesconto,
        valorFinal: fechamento.valorFinal,
        valorRecebido: fechamento.valorRecebido,
        valorPendente: fechamento.valorPendente,
        formaPagamento: fechamento.formaPagamento,
        pagamentos: fechamento.pagamentos,
        observacoesFinanceiras: fechamento.observacoesFinanceiras,
        status: fechamento.statusFinanceiro,
        statusFinanceiro: fechamento.statusFinanceiro,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });
    }

    if (resumoTempo.tempoRealCalculado) {
      const historicoTempoDoc = doc(temposAtendimentoHistoricoRef);

      transaction.set(historicoTempoDoc, {
        agendamentoId,
        clienteId: agendamento.clienteId,
        clienteNome: agendamento.clienteNome,
        servicoId: agendamento.servicoId,
        servicoNome: agendamento.servicoNome,
        data: agendamento.data,
        hora: agendamento.hora,
        ...resumoTempo,
        criadoEm: serverTimestamp(),
      });
    }

    transaction.update(agendamentoRef, {
      status: "finalizado",
      pacoteConsumido: Boolean(consumoPacote),
      consumoPacote,
      fechamentoFinanceiro: agendamento.pacoteClienteId ? null : fechamento,
      movimentoFinanceiroId,
      statusFinanceiro: agendamento.pacoteClienteId ? "pacote" : fechamento.statusFinanceiro,
      ...resumoTempo,
      finalizadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });

    return {
      agendamentoId,
      clienteId: agendamento.clienteId,
      clienteNome: agendamento.clienteNome,
      servicoId: agendamento.servicoId,
      servicoNome: agendamento.servicoNome,
      fechamentoFinanceiro: agendamento.pacoteClienteId ? null : fechamento,
      statusFinanceiro: agendamento.pacoteClienteId ? "pacote" : fechamento.statusFinanceiro,
      ...resumoTempo,
    };
  });
}
