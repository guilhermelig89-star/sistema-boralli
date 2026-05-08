import { useEffect, useMemo, useState } from "react";

import { observarAgendamentos } from "../repositories/agendamentosRepository";
import {
  criarAgendamento,
  finalizarAgendamento,
} from "../services/agendamentosService";

export function useAgendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const cancelar = observarAgendamentos(
      (dados) => {
        setAgendamentos(dados);
        setCarregando(false);
      },
      (erroFirebase) => {
        console.error("Erro ao sincronizar agendamentos", erroFirebase);
        setErro("Não foi possível carregar os agendamentos.");
        setCarregando(false);
      }
    );

    return () => cancelar();
  }, []);

  const agendamentosAbertos = useMemo(
    () => agendamentos.filter((item) => item.status !== "finalizado"),
    [agendamentos]
  );

  async function salvarAgendamento(dados) {
    setErro(null);
    return criarAgendamento(dados);
  }

  async function finalizarAtendimento(id) {
    setErro(null);
    return finalizarAgendamento(id);
  }

  return {
    agendamentos,
    agendamentosAbertos,
    carregando,
    erro,
    salvarAgendamento,
    finalizarAtendimento,
  };
}
