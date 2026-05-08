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

const servicosRef = collection(db, "servicos");

function mapDocumento(documento) {
  return {
    id: documento.id,
    ...documento.data(),
  };
}

export function observarServicos(onServicos, onErro) {
  const consulta = query(servicosRef, orderBy("nome"));

  return onSnapshot(
    consulta,
    (snapshot) => {
      onServicos(snapshot.docs.map(mapDocumento));
    },
    onErro
  );
}

export function criarServicoRegistro(dados) {
  return addDoc(servicosRef, {
    ...dados,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export function atualizarServicoRegistro(id, dados) {
  const servicoRef = doc(db, "servicos", id);

  return updateDoc(servicoRef, {
    ...dados,
    atualizadoEm: serverTimestamp(),
  });
}
