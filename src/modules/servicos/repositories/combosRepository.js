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

const combosRef = collection(db, "combos");

function mapDocumento(documento) {
  return {
    id: documento.id,
    ...documento.data(),
  };
}

export function observarCombos(onCombos, onErro) {
  const consulta = query(combosRef, orderBy("nome"));

  return onSnapshot(
    consulta,
    (snapshot) => {
      onCombos(snapshot.docs.map(mapDocumento));
    },
    onErro
  );
}

export function criarComboRegistro(dados) {
  return addDoc(combosRef, {
    ...dados,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export function atualizarComboRegistro(id, dados) {
  const comboRef = doc(db, "combos", id);

  return updateDoc(comboRef, {
    ...dados,
    atualizadoEm: serverTimestamp(),
  });
}
