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

const clientesRef = collection(db, "clientes");

export async function listarClientes() {
  const q = query(clientesRef, orderBy("nome"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function criarCliente(dados) {
  return await addDoc(clientesRef, {
    nome: dados.nome,
    telefone: dados.telefone,
    cep: dados.cep || "",
    rua: dados.rua || "",
    numero: dados.numero || "",
    bairro: dados.bairro || "",
    cidade: dados.cidade || "Ibitinga",
    complemento: dados.complemento || "",
    referencia: dados.referencia || "",
    observacoes: dados.observacoes || "",
    ativo: true,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}
export async function editarCliente(id, dados) {
  const clienteRef = doc(db, "clientes", id);

  await updateDoc(clienteRef, {
    ...dados,
    atualizadoEm: serverTimestamp(),
  });
}
export async function desativarCliente(id) {
  const clienteRef = doc(db, "clientes", id);

  await updateDoc(clienteRef, {
    ativo: false,
    atualizadoEm: serverTimestamp(),
  });
}