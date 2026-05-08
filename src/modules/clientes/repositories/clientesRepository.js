import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../../shared/firebase/firebaseConfig";

const clientesRef = collection(db, "clientes");

function mapDocumento(documento) {
  return {
    id: documento.id,
    ...documento.data(),
  };
}

export function observarClientes(onClientes, onErro) {
  const consulta = query(clientesRef, orderBy("nome"));

  return onSnapshot(
    consulta,
    (snapshot) => {
      onClientes(snapshot.docs.map(mapDocumento));
    },
    onErro
  );
}

export function criarClienteRegistro(dados) {
  return addDoc(clientesRef, {
    ...dados,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export function atualizarClienteRegistro(id, dados) {
  const clienteRef = doc(db, "clientes", id);

  return updateDoc(clienteRef, {
    ...dados,
    atualizadoEm: serverTimestamp(),
  });
}
