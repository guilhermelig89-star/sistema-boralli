import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../shared/firebase/firebaseConfig";

const categoriasRef = collection(db, "categoriasFinanceiras");

function mapDocumento(documento) {
  return {
    id: documento.id,
    ...documento.data(),
  };
}

export function observarCategoriasFinanceiras(onCategorias, onErro) {
  const consulta = query(categoriasRef, orderBy("nome", "asc"));

  return onSnapshot(
    consulta,
    (snapshot) => {
      onCategorias(snapshot.docs.map(mapDocumento));
    },
    onErro
  );
}

export async function criarCategoriaFinanceira(dados) {
  return addDoc(categoriasRef, {
    ...dados,
    ativo: true,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function desativarCategoriaFinanceira(id) {
  return updateDoc(doc(db, "categoriasFinanceiras", id), {
    ativo: false,
    atualizadoEm: serverTimestamp(),
  });
}
