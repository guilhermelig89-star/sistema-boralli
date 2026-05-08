import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../../../shared/firebase/firebaseConfig";

const horariosRef = collection(db, "agendaHorarios");
const excecoesRef = collection(db, "agendaExcecoes");

function mapDocumento(documento) {
  return {
    id: documento.id,
    ...documento.data(),
  };
}

export function observarHorariosAtendimento(onHorarios, onErro) {
  const consulta = query(horariosRef, orderBy("diaSemana"));

  return onSnapshot(
    consulta,
    (snapshot) => {
      onHorarios(snapshot.docs.map(mapDocumento));
    },
    onErro
  );
}

export function observarExcecoesAgenda(onExcecoes, onErro) {
  const consulta = query(excecoesRef, orderBy("data"));

  return onSnapshot(
    consulta,
    (snapshot) => {
      onExcecoes(snapshot.docs.map(mapDocumento));
    },
    onErro
  );
}

export function salvarHorarioAtendimentoRegistro(dados) {
  return setDoc(
    doc(db, "agendaHorarios", String(dados.diaSemana)),
    {
      ...dados,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}

export function salvarExcecaoAgendaRegistro(dados) {
  return setDoc(
    doc(db, "agendaExcecoes", dados.data),
    {
      ...dados,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}
