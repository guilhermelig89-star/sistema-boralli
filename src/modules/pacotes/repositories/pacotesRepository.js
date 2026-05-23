import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  runTransaction,
} from "firebase/firestore";

import { db } from "../../../shared/firebase/firebaseConfig";

const pacotesRef = collection(db, "pacotesClientes");
const historicoRef = collection(db, "pacotesHistorico");
const movimentosFinanceirosRef = collection(db, "movimentosFinanceiros");
const auditoriaRef = collection(db, "pacotesConsumoAuditoria");

function mapDocumento(documento) {
  return {
    id: documento.id,
    ...documento.data(),
  };
}

export function observarPacotesClientes(onPacotes, onErro) {
  const consulta = query(pacotesRef, orderBy("clienteNome"));

  return onSnapshot(
    consulta,
    (snapshot) => {
      onPacotes(snapshot.docs.map(mapDocumento));
    },
    onErro
  );
}

export function observarHistoricoPacotes(onHistorico, onErro) {
  const consulta = query(historicoRef, orderBy("criadoEm"));

  return onSnapshot(
    consulta,
    (snapshot) => {
      onHistorico(snapshot.docs.map(mapDocumento));
    },
    onErro
  );
}

export function criarPacoteClienteRegistro(dados) {
  const batch = writeBatch(db);
  const pacoteDoc = doc(pacotesRef);

  batch.set(pacoteDoc, {
    ...dados,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  if (Number(dados.valorPago || 0) > 0) {
    const movimentoDoc = doc(movimentosFinanceirosRef);

    batch.set(movimentoDoc, {
      tipo: "receita",
      origem: "venda_pacote",
      pacoteClienteId: pacoteDoc.id,
      clienteId: dados.clienteId,
      clienteNome: dados.clienteNome,
      descricao: `Venda do pacote ${dados.nome}`,
      valor: Number(dados.valorPago || 0),
      formaPagamento: dados.formaPagamento || "",
      status: "confirmado",
      criadoEm: serverTimestamp(),
    });
  }

  return batch.commit();
}

export async function estornarConsumoPacoteRegistro({ historicoId, motivo = "" }) {
  if (!historicoId) {
    throw new Error("Selecione um consumo para estornar.");
  }

  return runTransaction(db, async (transaction) => {
    const historicoDocRef = doc(historicoRef, historicoId);
    const historicoSnap = await transaction.get(historicoDocRef);

    if (!historicoSnap.exists()) {
      throw new Error("Histórico de consumo não encontrado.");
    }

    const historico = historicoSnap.data();

    if (historico.estornadoEm) {
      throw new Error("Este consumo já foi estornado.");
    }

    const pacoteClienteId = historico.pacoteClienteId;
    if (!pacoteClienteId) {
      throw new Error("Consumo sem pacote vinculado.");
    }

    const pacoteDocRef = doc(pacotesRef, pacoteClienteId);
    const pacoteSnap = await transaction.get(pacoteDocRef);

    if (!pacoteSnap.exists()) {
      throw new Error("Pacote não encontrado para estorno.");
    }

    const pacote = pacoteSnap.data();
    const quantidadeConsumida = Math.max(1, Number(historico.quantidadeConsumida || 1));
    const quantidadeUtilizadaAtual = Number(pacote.quantidadeUtilizada || 0);
    const quantidadeUtilizadaDepois = quantidadeUtilizadaAtual - quantidadeConsumida;

    if (quantidadeUtilizadaDepois < 0) {
      throw new Error("Inconsistência detectada: quantidade utilizada ficaria negativa.");
    }

    const saldoRestanteAtual = Number(pacote.saldoRestante || 0);
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
        const itemUtilizadoAtual = Number(itemAtual.quantidadeUtilizada || 0);
        const itemUtilizadoDepois = itemUtilizadoAtual - quantidadeConsumida;
        if (itemUtilizadoDepois < 0) {
          throw new Error("Inconsistência detectada no item do pacote após estorno.");
        }

        const itensAtualizados = pacote.itens.map((item, indice) => {
          if (indice !== indiceItem) return item;
          return {
            ...item,
            quantidadeUtilizada: itemUtilizadoDepois,
            saldoRestante: Number(item.saldoRestante || 0) + quantidadeConsumida,
          };
        });

        atualizacaoPacote.itens = itensAtualizados;
      }
    }

    transaction.update(pacoteDocRef, atualizacaoPacote);

    transaction.update(historicoDocRef, {
      estornadoEm: serverTimestamp(),
      estornadoMotivo: String(motivo || "").trim(),
      estornado: true,
      valido: false,
    });

    const auditoriaDocRef = doc(auditoriaRef);
    transaction.set(auditoriaDocRef, {
      tipo: "estorno_consumo_pacote",
      historicoId,
      pacoteClienteId,
      clienteId: historico.clienteId || "",
      clienteNome: historico.clienteNome || "",
      servicoId: historico.servicoId || "",
      servicoNome: historico.servicoNome || "",
      quantidadeEstornada: quantidadeConsumida,
      saldoPacoteAntes: saldoRestanteAtual,
      saldoPacoteDepois: saldoRestanteDepois,
      quantidadeUtilizadaAntes: quantidadeUtilizadaAtual,
      quantidadeUtilizadaDepois,
      motivo: String(motivo || "").trim(),
      criadoEm: serverTimestamp(),
    });
  });
}

function historicoEstaAtivo(historico = {}) {
  return !(
    historico.estornado === true ||
    historico.cancelado === true ||
    historico.valido === false ||
    historico.status === "estornado" ||
    historico.status === "cancelado" ||
    historico.removido === true
  );
}

function numeroSeguro(valor, padrao = 0) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : padrao;
}

export async function recalcularPacotePorHistoricoAtivoRegistro({ pacoteId }) {
  if (!pacoteId) throw new Error("Pacote inválido para recálculo.");

  return runTransaction(db, async (transaction) => {
    const pacoteDocRef = doc(pacotesRef, pacoteId);
    const pacoteSnap = await transaction.get(pacoteDocRef);

    if (!pacoteSnap.exists()) {
      throw new Error("Pacote não encontrado para recálculo.");
    }

    const pacote = pacoteSnap.data();
    const historicoSnap = await transaction.get(historicoRef);
    const historicosAtivos = historicoSnap.docs
      .map((documento) => ({ id: documento.id, ...documento.data() }))
      .filter((historico) => historico.pacoteClienteId === pacoteId && historicoEstaAtivo(historico));

    const quantidadeTotal = Math.max(0, numeroSeguro(pacote.quantidadeTotal, 0));
    const quantidadeUtilizada = Math.min(
      quantidadeTotal,
      historicosAtivos.reduce((total, historico) => total + Math.max(1, numeroSeguro(historico.quantidadeConsumida, 1)), 0)
    );
    const saldoRestante = Math.max(0, quantidadeTotal - quantidadeUtilizada);

    const atualizacaoPacote = {
      quantidadeUtilizada,
      saldoRestante,
      status: saldoRestante > 0 ? "ativo" : "esgotado",
      atualizadoEm: serverTimestamp(),
    };

    if (Array.isArray(pacote.itens) && pacote.itens.length > 0) {
      const consumoPorServico = new Map();
      historicosAtivos.forEach((historico) => {
        const chave = historico.servicoId || historico.servicoNome || "sem_servico";
        consumoPorServico.set(chave, (consumoPorServico.get(chave) || 0) + Math.max(1, numeroSeguro(historico.quantidadeConsumida, 1)));
      });

      atualizacaoPacote.itens = pacote.itens.map((item) => {
        const quantidadeItem = Math.max(0, numeroSeguro(item.quantidadeTotal ?? item.quantidade, 0));
        const chave = item.servicoId || item.servicoNome || "sem_servico";
        const quantidadeUtilizadaItem = Math.min(quantidadeItem, consumoPorServico.get(chave) || 0);

        return {
          ...item,
          quantidadeUtilizada: quantidadeUtilizadaItem,
          saldoRestante: Math.max(0, quantidadeItem - quantidadeUtilizadaItem),
        };
      });
    }

    transaction.update(pacoteDocRef, atualizacaoPacote);

    transaction.set(doc(auditoriaRef), {
      tipo: "recalculo_manual_pacote",
      pacoteClienteId: pacoteId,
      clienteId: pacote.clienteId || "",
      clienteNome: pacote.clienteNome || "",
      quantidadeTotal,
      quantidadeUtilizada,
      saldoRestante,
      historicoAtivoConsiderado: historicosAtivos.length,
      criadoEm: serverTimestamp(),
    });
  });
}
