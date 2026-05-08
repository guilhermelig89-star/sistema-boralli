import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../../shared/firebase/firebaseConfig";

const pacotesRef = collection(db, "pacotesClientes");
const historicoRef = collection(db, "pacotesHistorico");

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
  return addDoc(pacotesRef, {
    ...dados,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}
