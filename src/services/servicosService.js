import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";

const servicosRef = collection(db, "servicos");

export async function listarServicos() {
  const q = query(servicosRef, orderBy("nome"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function criarServico(dados) {
  return await addDoc(servicosRef, {
    nome: dados.nome,
    tipo: dados.tipo || "avulso",
    valor: Number(dados.valor) || 0,
    duracaoMinutos: Number(dados.duracaoMinutos) || 60,
    ativo: true,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function editarServico(id, dados) {
  const servicoRef = doc(db, "servicos", id);

  await updateDoc(servicoRef, {
    nome: dados.nome,
    tipo: dados.tipo || "avulso",
    valor: Number(dados.valor) || 0,
    duracaoMinutos: Number(dados.duracaoMinutos) || 60,
    atualizadoEm: serverTimestamp(),
  });
}

export async function desativarServico(id) {
  const servicoRef = doc(db, "servicos", id);

  await updateDoc(servicoRef, {
    ativo: false,
    atualizadoEm: serverTimestamp(),
  });
}