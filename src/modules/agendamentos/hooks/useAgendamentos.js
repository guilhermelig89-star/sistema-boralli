import { useEffect, useMemo, useState } from "react";

import { observarAgendamentos } from "../repositories/agendamentosRepository";
import {
  cancelarAgendamento,
  criarAgendamento,
  editarAgendamento,
  excluirAgendamento,
  finalizarAgendamento,
  iniciarAgendamento,
  venderPacoteNoAtendimento,
  resolverPendenciaAgendamento,
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
    () => agendamentos.filter((item) => item.status !== "finalizado" && item.status !== "cancelado"),
    [agendamentos]
  );

  async function salvarAgendamento(dados, configuracaoAgenda) {
    setErro(null);
    return criarAgendamento(dados, agendamentos, configuracaoAgenda);
  }

  async function iniciarAtendimento(id) {
    setErro(null);
    return iniciarAgendamento(id);
  }

  async function finalizarAtendimento(id, fechamentoFinanceiro) {
    setErro(null);
    return finalizarAgendamento(id, fechamentoFinanceiro);
  }

  async function cancelarAtendimento(id) {
    setErro(null);
    return cancelarAgendamento(id);
  }

  async function salvarEdicaoAgendamento(payload, configuracaoAgenda) {
    setErro(null);
    return editarAgendamento({ ...payload, agendamentosExistentes: agendamentos, configuracaoAgenda });
  }
  async function venderPacoteDuranteAtendimento(id, vendaPacote) {
    setErro(null);
    return venderPacoteNoAtendimento(id, vendaPacote);
  }

  async function excluirAgendamentoPorId(id) {
    setErro(null);
    return excluirAgendamento(id);
  }
  async function resolverPendencia(id, resolucao) {
    setErro(null);
    return resolverPendenciaAgendamento(id, resolucao);
  }

  return {
    agendamentos,
    agendamentosAbertos,
    carregando,
    erro,
    salvarAgendamento,
    iniciarAtendimento,
    finalizarAtendimento,
    cancelarAtendimento,
    salvarEdicaoAgendamento,
    excluirAgendamentoPorId,
    venderPacoteDuranteAtendimento,
    resolverPendencia,
  };
}
