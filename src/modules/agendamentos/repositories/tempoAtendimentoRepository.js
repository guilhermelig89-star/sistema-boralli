import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { atualizarServicoRegistro } from "../../servicos/repositories/servicosRepository";
import { db } from "../../../shared/firebase/firebaseConfig";

const sugestoesTempoRef = collection(db, "sugestoesTempoAtendimento");

function mapDocumento(documento) {
  return {
    id: documento.id,
    ...documento.data(),
  };
}

function montarIdClienteServico(clienteId, servicoId) {
  return `${clienteId}_${servicoId}`.replaceAll("/", "-");
}

export function observarSugestoesTempoAtendimento(onSugestoes, onErro) {
  const consulta = query(sugestoesTempoRef, orderBy("atualizadoEm", "desc"));

  return onSnapshot(
    consulta,
    (snapshot) => {
      onSugestoes(snapshot.docs.map(mapDocumento));
    },
    onErro
  );
}

export function salvarSugestaoTempoClienteServico(dados) {
  const sugestaoRef = doc(
    db,
    "sugestoesTempoAtendimento",
    montarIdClienteServico(dados.clienteId, dados.servicoId)
  );

  return setDoc(
    sugestaoRef,
    {
      tipo: "cliente_servico",
      clienteId: dados.clienteId,
      clienteNome: dados.clienteNome || "",
      servicoId: dados.servicoId,
      servicoNome: dados.servicoNome || "",
      duracaoMinutos: Number(dados.duracaoMinutos || 0),
      quantidadeBase: Number(dados.quantidadeBase || 1),
      origem: dados.origem || "alerta_finalizacao",
      origemAgendamentoId: dados.origemAgendamentoId || "",
      tempoPrevistoMinutos: Number(dados.tempoPrevistoMinutos || 0),
      tempoRealMinutos: Number(dados.tempoRealMinutos || 0),
      ativo: true,
      atualizadoEm: serverTimestamp(),
      criadoEm: dados.criadoEm || serverTimestamp(),
    },
    { merge: true }
  );
}

export function revisarDuracaoPadraoServico(servicoId, duracaoMinutos) {
  return atualizarServicoRegistro(servicoId, {
    duracaoMinutos: Number(duracaoMinutos || 0),
  });
}
