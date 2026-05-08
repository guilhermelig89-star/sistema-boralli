import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { db } from "../../../shared/firebase/firebaseConfig";

const pacotesRef = collection(db, "pacotesClientes");
const historicoRef = collection(db, "pacotesHistorico");
const movimentosFinanceirosRef = collection(db, "movimentosFinanceiros");

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
