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

const consumoLocksRef = collection(db, "pacotesConsumoLocks");

function buildConsumoLockId(agendamentoId, contexto = "finalizacao") {
  return `${contexto}__${agendamentoId}`;
}

function historicoConsumoAtivo(historico = {}) {
  return !(
    historico.estornado === true ||
    historico.cancelado === true ||
    historico.valido === false ||
    historico.status === "estornado" ||
    historico.status === "cancelado"
  );
}

async function buscarConsumoAtivoPorAgendamento(transaction, agendamentoId) {
  const historicoSnapshot = await transaction.get(historicoRef);
  const ativos = historicoSnapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((item) => item.agendamentoId === agendamentoId && historicoConsumoAtivo(item));

  if (ativos.length === 0) return null;

  ativos.sort((a, b) => {
    const aCriado = a.criadoEm?.seconds || 0;
    const bCriado = b.criadoEm?.seconds || 0;
    return bCriado - aCriado;
  });
  return ativos[0];
}

async function validarESinalizarConsumoPacote(transaction, { agendamento, agendamentoId, tipoHistorico, contextoLock = "finalizacao" }) {
  if (!agendamento.pacoteClienteId) return null;
  if (agendamento.pacoteConsumido === true || agendamento.consumoPacote?.agendamentoId) {
    throw new Error("Este atendimento já possui consumo de pacote registrado.");
  }

  const lockId = buildConsumoLockId(agendamentoId, contextoLock);
  const lockRef = doc(consumoLocksRef, lockId);
  const lockSnapshot = await transaction.get(lockRef);

  if (lockSnapshot.exists()) {
    throw new Error("Consumo de pacote já processado para este agendamento.");
  }

  const pacoteRef = doc(pacotesRef, agendamento.pacoteClienteId);
  const pacoteSnapshot = await transaction.get(pacoteRef);

  if (!pacoteSnapshot.exists()) {
    throw new Error("Pacote do cliente não encontrado.");
  }

  const pacote = { id: pacoteSnapshot.id, ...pacoteSnapshot.data() };
  const resultadoConsumo = consumirServicoDoPacote(pacote, agendamento.servicoId);
  const consumoPacote = { ...resultadoConsumo.consumoPacote, agendamentoId };
  const historicoDocRef = doc(historicoRef, `${agendamentoId}__${tipoHistorico}`);
  const historicoSnapshot = await transaction.get(historicoDocRef);

  if (historicoSnapshot.exists()) {
    throw new Error("Histórico de consumo já registrado para este agendamento.");
  }

  transaction.update(pacoteRef, { ...resultadoConsumo.atualizacao, atualizadoEm: serverTimestamp() });
  transaction.set(historicoDocRef, { ...consumoPacote, tipo: tipoHistorico, criadoEm: serverTimestamp() });
  transaction.set(lockRef, {
    agendamentoId,
    pacoteClienteId: agendamento.pacoteClienteId,
    clienteId: agendamento.clienteId || "",
    tipoHistorico,
    contexto: contextoLock,
    criadoEm: serverTimestamp(),
  });

  return consumoPacote;
}

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
  return runTransaction(db, async (transaction) => {
    const agendamentoRef = doc(db, "agendamentos", agendamentoId);
    const agendamentoSnapshot = await transaction.get(agendamentoRef);

    if (!agendamentoSnapshot.exists()) {
      throw new Error("Agendamento não encontrado.");
    }

    const agendamento = agendamentoSnapshot.data();
    const atualizacaoAgendamento = {
      status: "cancelado",
      canceladoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    };

    if (agendamento.pacoteClienteId) {
      const historicoAtivo = await buscarConsumoAtivoPorAgendamento(transaction, agendamentoId);
      if (!historicoAtivo) {
        transaction.update(agendamentoRef, atualizacaoAgendamento);
        return;
      }
      const historicoDocRef = doc(historicoRef, historicoAtivo.id);
      const historico = historicoAtivo;

      const pacoteRef = doc(pacotesRef, agendamento.pacoteClienteId);
      const pacoteSnapshot = await transaction.get(pacoteRef);
      if (!pacoteSnapshot.exists()) {
        throw new Error("Pacote do cliente não encontrado para estorno do cancelamento.");
      }

      const pacote = pacoteSnapshot.data();
      const quantidadeConsumida = Math.max(1, numero(historico.quantidadeConsumida || 1));
      const quantidadeUtilizadaAtual = numero(pacote.quantidadeUtilizada, 0);
      const quantidadeUtilizadaDepois = quantidadeUtilizadaAtual - quantidadeConsumida;

      if (quantidadeUtilizadaDepois < 0) {
        throw new Error("Inconsistência detectada no estorno do pacote.");
      }

      const saldoRestanteAtual = numero(pacote.saldoRestante, 0);
      const saldoRestanteDepois = saldoRestanteAtual + quantidadeConsumida;
      const atualizacaoPacote = {
        quantidadeUtilizada: quantidadeUtilizadaDepois,
        saldoRestante: saldoRestanteDepois,
        status: saldoRestanteDepois > 0 ? "ativo" : "esgotado",
        atualizadoEm: serverTimestamp(),
      };

      if (Array.isArray(pacote.itens) && pacote.itens.length > 0 && historico.servicoId) {
        const indiceItem = pacote.itens.findIndex((item) => item.servicoId === historico.servicoId);
        if (indiceItem >= 0) {
          const itemAtual = pacote.itens[indiceItem];
          const itemUtilizadoAtual = numero(itemAtual.quantidadeUtilizada, 0);
          const itemUtilizadoDepois = itemUtilizadoAtual - quantidadeConsumida;
          if (itemUtilizadoDepois < 0) {
            throw new Error("Inconsistência detectada no item do pacote após cancelamento.");
          }

          atualizacaoPacote.itens = pacote.itens.map((item, indice) => {
            if (indice !== indiceItem) return item;
            return {
              ...item,
              quantidadeUtilizada: itemUtilizadoDepois,
              saldoRestante: numero(item.saldoRestante, 0) + quantidadeConsumida,
            };
          });
        }
      }

      transaction.update(pacoteRef, atualizacaoPacote);
      transaction.update(historicoDocRef, {
        estornado: true,
        estornadoEm: serverTimestamp(),
        estornadoMotivo: "cancelamento_agendamento",
        cancelado: true,
        status: "cancelado",
        valido: false,
        atualizadoEm: serverTimestamp(),
      });

      atualizacaoAgendamento.pacoteConsumido = false;
      atualizacaoAgendamento.statusFinanceiro = "nao_lancar";
      atualizacaoAgendamento.consumoPacote = {
        ...(agendamento.consumoPacote || {}),
        status: "cancelado",
        cancelado: true,
        estornado: true,
        historicoId: historicoAtivo.id,
        estornadoEm: new Date().toISOString(),
      };
    }

    transaction.update(agendamentoRef, atualizacaoAgendamento);
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
      consumoPacote = await validarESinalizarConsumoPacote(transaction, {
        agendamento,
        agendamentoId,
        tipoHistorico: "consumo_atendimento_finalizado",
        contextoLock: "finalizacao",
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

export function resolverPendenciaAgendamentoRegistro(agendamentoId, resolucao = {}) {
  return runTransaction(db, async (transaction) => {
    const agendamentoRef = doc(db, "agendamentos", agendamentoId);
    const agendamentoSnapshot = await transaction.get(agendamentoRef);

    if (!agendamentoSnapshot.exists()) {
      throw new Error("Agendamento não encontrado.");
    }

    const agendamento = agendamentoSnapshot.data();
    const acao = texto(resolucao.acao);
    const motivoPendencia = texto(resolucao.motivoPendencia, agendamento.status === "em_atendimento" ? "atendimento_aberto" : "agendamento_vencido");
    const observacaoPendencia = texto(resolucao.observacaoPendencia);
    const resolvidoEmIso = new Date().toISOString();
    const possuiPacote = Boolean(agendamento.pacoteClienteId);

    if (!acao) {
      throw new Error("Selecione uma ação para resolver a pendência.");
    }

    if (acao === "finalizar_real") {
      if (agendamento.status !== "em_atendimento") {
        throw new Error("A finalização com horário real exige atendimento iniciado.");
      }

      const resumoTempo = calcularTempoFinalizacao(agendamento, { atendimentoFinalizadoEm: resolucao.horarioRealTermino });
      if (!resumoTempo.tempoRealCalculado) {
        throw new Error("Informe um horário real de término válido.");
      }
      const fechamento = normalizarFechamentoFinanceiro(agendamento, resolucao.fechamentoFinanceiro || {});
      let consumoPacote = null;
      let movimentoFinanceiroId = "";

      if (agendamento.pacoteClienteId) {
        consumoPacote = await validarESinalizarConsumoPacote(transaction, {
          agendamento,
          agendamentoId,
          tipoHistorico: "consumo_atendimento_finalizado",
          contextoLock: "pendencia_finalizacao_real",
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
          descricao: `Fechamento manual de atendimento - ${agendamento.servicoNome}`,
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

      transaction.update(agendamentoRef, {
        status: "finalizado",
        pacoteConsumido: Boolean(consumoPacote),
        consumoPacote,
        fechamentoFinanceiro: agendamento.pacoteClienteId ? null : fechamento,
        movimentoFinanceiroId,
        statusFinanceiro: agendamento.pacoteClienteId ? "pacote" : fechamento.statusFinanceiro,
        ...resumoTempo,
        finalizadoEm: serverTimestamp(),
        motivoPendencia,
        observacaoPendencia,
        resolvidoManual: true,
        resolvidoEm: resolvidoEmIso,
        atualizadoEm: serverTimestamp(),
      });
      return;
    }

    const mapaStatus = {
      realizado_manual: "finalizado",
      nao_compareceu: "nao_compareceu",
      cliente_cancelou: "cancelado",
      remarcar: "agendado",
      cancelar_atendimento: "cancelado",
      nao_realizado: "nao_realizado",
    };
    const proximoStatus = mapaStatus[acao];
    if (!proximoStatus) throw new Error("Ação de resolução inválida.");
    const atualizacao = {
      status: proximoStatus,
      motivoPendencia,
      observacaoPendencia,
      resolvidoManual: true,
      resolvidoEm: resolvidoEmIso,
      atualizadoEm: serverTimestamp(),
      statusFinanceiro: ["nao_compareceu", "cancelado", "nao_realizado"].includes(proximoStatus)
        ? "nao_lancar"
        : agendamento.statusFinanceiro || "pendente",
    };

    if (acao === "realizado_manual") {
      const consumirPacote = possuiPacote
        ? resolucao.consumirPacote !== false
        : false;
      const lancarFinanceiro = possuiPacote
        ? Boolean(resolucao.lancarFinanceiro)
        : resolucao.lancarFinanceiro !== false;
      let consumoPacote = null;
      let fechamentoFinanceiro = null;
      let movimentoFinanceiroId = "";

      if (consumirPacote) {
        if (agendamento.consumoPacote?.agendamentoId) {
          throw new Error("Este atendimento já possui consumo de pacote registrado.");
        }
        consumoPacote = await validarESinalizarConsumoPacote(transaction, {
          agendamento,
          agendamentoId,
          tipoHistorico: "consumo_atendimento_realizado_manual",
          contextoLock: "pendencia_realizado_manual",
        });
      }

      if (lancarFinanceiro) {
        const fechamento = normalizarFechamentoFinanceiro(agendamento, resolucao.fechamentoFinanceiro || {});
        const movimentoDoc = doc(movimentosFinanceirosRef);
        movimentoFinanceiroId = movimentoDoc.id;
        fechamentoFinanceiro = fechamento;

        transaction.set(movimentoDoc, {
          tipo: "receita",
          origem: "atendimento_avulso",
          agendamentoId,
          clienteId: agendamento.clienteId,
          clienteNome: agendamento.clienteNome,
          servicoId: agendamento.servicoId,
          servicoNome: agendamento.servicoNome,
          descricao: `Realizado manualmente - ${agendamento.servicoNome}`,
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

      atualizacao.finalizadoEm = serverTimestamp();
      atualizacao.pacoteConsumido = Boolean(consumoPacote);
      atualizacao.consumoPacote = consumoPacote;
      atualizacao.fechamentoFinanceiro = fechamentoFinanceiro;
      atualizacao.movimentoFinanceiroId = movimentoFinanceiroId;
      atualizacao.statusFinanceiro = consumoPacote
        ? "pacote"
        : fechamentoFinanceiro?.statusFinanceiro || "nao_lancar";
    }

    transaction.update(agendamentoRef, atualizacao);
  });
}

export function corrigirConsumoPacoteFinalizadoRegistro(agendamentoId) {
  return runTransaction(db, async (transaction) => {
    const agendamentoRef = doc(db, "agendamentos", agendamentoId);
    const agendamentoSnapshot = await transaction.get(agendamentoRef);

    if (!agendamentoSnapshot.exists()) throw new Error("Agendamento não encontrado.");

    const agendamento = agendamentoSnapshot.data();
    if (agendamento.status !== "finalizado") throw new Error("A correção só pode ser feita em atendimento finalizado.");
    if (!agendamento.pacoteClienteId) throw new Error("Este atendimento não possui pacote vinculado.");
    if (agendamento.pacoteConsumido === true) throw new Error("Este atendimento já possui consumo de pacote.");
    if (agendamento.consumoPacote?.agendamentoId) throw new Error("Consumo de pacote já registrado para este agendamento.");

    const consumoPacote = await validarESinalizarConsumoPacote(transaction, {
      agendamento,
      agendamentoId,
      tipoHistorico: "consumo_atendimento_ajuste_manual_finalizado",
      contextoLock: "correcao_manual",
    });
    transaction.update(agendamentoRef, {
      pacoteConsumido: true,
      consumoPacote,
      ajusteManualPacote: true,
      ajusteManualPacoteEm: serverTimestamp(),
      statusFinanceiro: "pacote",
      atualizadoEm: serverTimestamp(),
    });
  });
}

export function venderPacoteNoAtendimentoRegistro(agendamentoId, vendaPacote = {}) {
  return runTransaction(db, async (transaction) => {
    const agendamentoRef = doc(db, "agendamentos", agendamentoId);
    const agendamentoSnapshot = await transaction.get(agendamentoRef);

    if (!agendamentoSnapshot.exists()) {
      throw new Error("Agendamento não encontrado.");
    }

    const agendamento = agendamentoSnapshot.data();

    if (agendamento.status !== "em_atendimento") {
      throw new Error("A venda de pacote no atendimento só pode ser feita em atendimento em andamento.");
    }

    if (agendamento.pacoteClienteId) {
      throw new Error("Este agendamento já está vinculado a um pacote.");
    }

    const comboId = texto(vendaPacote.comboId);
    const comboNome = texto(vendaPacote.comboNome);
    const nome = texto(vendaPacote.nome, comboNome ? `Pacote ${comboNome}` : "Pacote");
    const formaPagamento = texto(vendaPacote.formaPagamento);
    const valorPago = Math.max(0, numero(vendaPacote.valorPago, 0));
    const itens = Array.isArray(vendaPacote.itens) ? vendaPacote.itens : [];

    if (!comboId || !itens.length) {
      throw new Error("Selecione um pacote válido para vender no atendimento.");
    }
    if (!formaPagamento) {
      throw new Error("Informe a forma de pagamento da venda do pacote.");
    }

    const itemServicoAtual = itens.find((item) => item.servicoId === agendamento.servicoId);
    if (!itemServicoAtual || numero(itemServicoAtual.quantidade, 0) <= 0) {
      throw new Error("O pacote selecionado não possui saldo para o serviço do atendimento atual.");
    }

    const pacoteDoc = doc(pacotesRef);
    const totalItens = itens.reduce((acc, item) => acc + Math.max(0, numero(item.quantidade, 0)), 0);
    const itensPacote = itens
      .map((item) => ({
        servicoId: item.servicoId,
        servicoNome: texto(item.servicoNome),
        quantidadeTotal: Math.max(0, numero(item.quantidade, 0)),
        quantidadeUtilizada: item.servicoId === agendamento.servicoId ? 1 : 0,
        saldoRestante: Math.max(0, numero(item.quantidade, 0) - (item.servicoId === agendamento.servicoId ? 1 : 0)),
      }))
      .filter((item) => item.servicoId && item.quantidadeTotal > 0);
    const quantidadeUtilizada = 1;
    const saldoRestante = Math.max(0, totalItens - quantidadeUtilizada);
    const historicoDoc = doc(historicoRef);
    const movimentoDoc = doc(movimentosFinanceirosRef);

    transaction.set(pacoteDoc, {
      clienteId: agendamento.clienteId,
      clienteNome: agendamento.clienteNome,
      comboId,
      comboNome,
      servicoId: itensPacote[0]?.servicoId || "",
      servicoNome: itensPacote.map((item) => item.servicoNome).join(", "),
      nome,
      itens: itensPacote,
      quantidadeTotal: totalItens,
      quantidadeUtilizada,
      saldoRestante,
      alertaSaldoMinimo: Math.max(1, numero(vendaPacote.alertaSaldoMinimo, 1)),
      valorPago,
      formaPagamento,
      observacoes: texto(vendaPacote.observacoes),
      totalAvulso: numero(vendaPacote.totalAvulso, 0),
      economiaValor: numero(vendaPacote.economiaValor, 0),
      economiaPercentual: numero(vendaPacote.economiaPercentual, 0),
      fraseEconomia: texto(vendaPacote.fraseEconomia),
      status: saldoRestante > 0 ? "ativo" : "esgotado",
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });

    transaction.set(historicoDoc, {
      pacoteClienteId: pacoteDoc.id,
      pacoteNome: nome,
      clienteId: agendamento.clienteId,
      clienteNome: agendamento.clienteNome,
      servicoId: agendamento.servicoId,
      servicoNome: agendamento.servicoNome,
      quantidadeConsumida: 1,
      saldoAntes: Math.max(0, numero(itemServicoAtual.quantidade, 0)),
      saldoDepois: Math.max(0, numero(itemServicoAtual.quantidade, 0) - 1),
      saldoTotalDepois: saldoRestante,
      agendamentoId,
      tipo: "consumo_atendimento_pacote_vendido_na_hora",
      criadoEm: serverTimestamp(),
    });

    transaction.set(movimentoDoc, {
      tipo: "receita",
      origem: "venda_pacote",
      pacoteClienteId: pacoteDoc.id,
      agendamentoId,
      clienteId: agendamento.clienteId,
      clienteNome: agendamento.clienteNome,
      descricao: `Venda do pacote ${nome}`,
      data: dataHoje(),
      valor: valorPago,
      formaPagamento,
      status: "confirmado",
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });

    transaction.update(agendamentoRef, {
      pacoteClienteId: pacoteDoc.id,
      pacoteNome: nome,
      formaPagamento: "pacote",
      valor: 0,
      statusFinanceiro: "pacote",
      vendaPacoteNoAtendimento: {
        pacoteClienteId: pacoteDoc.id,
        movimentoFinanceiroId: movimentoDoc.id,
        convertidoEm: new Date().toISOString(),
      },
      atualizadoEm: serverTimestamp(),
    });

    return {
      pacoteClienteId: pacoteDoc.id,
      pacoteNome: nome,
      saldoRestante,
      saldoServicoRestante: Math.max(0, numero(itemServicoAtual.quantidade, 0) - 1),
    };
  });
}
