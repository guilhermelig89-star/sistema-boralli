import {
  addDoc,
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../shared/firebase/firebaseConfig";

const movimentosRef = collection(db, "movimentosFinanceiros");

function mapDocumento(documento) {
  return {
    id: documento.id,
    ...documento.data(),
  };
}

export function observarMovimentosFinanceiros(onMovimentos, onErro) {
  const consulta = query(movimentosRef, orderBy("criadoEm", "desc"));

  return onSnapshot(
    consulta,
    (snapshot) => {
      onMovimentos(snapshot.docs.map(mapDocumento));
    },
    onErro
  );
}

export async function criarMovimentoFinanceiro(dados) {
  return addDoc(movimentosRef, {
    ...dados,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function atualizarMovimentoFinanceiro(id, dados) {
  const movimentoRef = doc(db, "movimentosFinanceiros", id);

  return updateDoc(movimentoRef, {
    ...dados,
    atualizadoEm: serverTimestamp(),
  });
}
