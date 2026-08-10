import {
  addDoc,
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { db, storage } from "../../../shared/firebase/firebaseConfig";

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

function nomeArquivoSeguro(nome) {
  return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function criarDespesaComComprovante(dados, arquivo) {
  if (!arquivo) return criarMovimentoFinanceiro(dados);

  const identificador = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const caminho = `comprovantes-despesas/${dados.data}/${identificador}-${nomeArquivoSeguro(arquivo.name)}`;
  const comprovanteRef = ref(storage, caminho);

  await uploadBytes(comprovanteRef, arquivo, { contentType: arquivo.type });

  try {
    const comprovanteUrl = await getDownloadURL(comprovanteRef);
    return await criarMovimentoFinanceiro({
      ...dados,
      comprovante: {
        nome: arquivo.name,
        tipo: arquivo.type,
        tamanho: arquivo.size,
        caminho,
        url: comprovanteUrl,
      },
    });
  } catch (erro) {
    await deleteObject(comprovanteRef).catch(() => {});
    throw erro;
  }
}

export async function atualizarMovimentoFinanceiro(id, dados) {
  const movimentoRef = doc(db, "movimentosFinanceiros", id);

  return updateDoc(movimentoRef, {
    ...dados,
    atualizadoEm: serverTimestamp(),
  });
}

export async function registrarRecebimentoPendencia(movimentoId, atualizacaoPendencia, novoRecebimento) {
  const lote = writeBatch(db);
  const pendenciaRef = doc(db, "movimentosFinanceiros", movimentoId);
  const recebimentoRef = doc(movimentosRef);
  const agora = serverTimestamp();

  lote.update(pendenciaRef, {
    ...atualizacaoPendencia,
    atualizadoEm: agora,
  });
  lote.set(recebimentoRef, {
    ...novoRecebimento,
    criadoEm: agora,
    atualizadoEm: agora,
  });

  return lote.commit();
}
