import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { db, storage } from "../../../shared/firebase/firebaseConfig";

const configuracaoRef = doc(db, "configuracoes", "empresa");

export async function buscarConfiguracaoEmpresa() {
  const snapshot = await getDoc(configuracaoRef);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function salvarConfiguracaoEmpresaRegistro(dados) {
  await setDoc(
    configuracaoRef,
    {
      ...dados,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function enviarLogoEmpresa(arquivo, caminhoAnterior) {
  if (caminhoAnterior) {
    try {
      await deleteObject(ref(storage, caminhoAnterior));
    } catch (erro) {
      console.warn("Não foi possível remover o logotipo anterior.", erro);
    }
  }

  const extensao = arquivo.name.split(".").pop() || "png";
  const logoPath = `configuracoes/empresa/logo-${Date.now()}.${extensao}`;
  const logoRef = ref(storage, logoPath);

  await uploadBytes(logoRef, arquivo, { contentType: arquivo.type });
  const logoUrl = await getDownloadURL(logoRef);

  return { logoUrl, logoPath };
}
