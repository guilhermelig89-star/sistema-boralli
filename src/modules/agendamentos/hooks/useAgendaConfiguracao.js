import { useEffect, useState } from "react";

import {
  observarExcecoesAgenda,
  observarHorariosAtendimento,
  salvarExcecaoAgendaRegistro,
  salvarHorarioAtendimentoRegistro,
} from "../repositories/agendaConfiguracaoRepository";
import {
  validarExcecaoAgenda,
  validarHorarioAtendimento,
} from "../services/agendaConfiguracaoService";

export function useAgendaConfiguracao() {
  const [horarios, setHorarios] = useState([]);
  const [excecoes, setExcecoes] = useState([]);
  const [carregandoConfiguracao, setCarregandoConfiguracao] = useState(true);
  const [erroConfiguracao, setErroConfiguracao] = useState(null);

  useEffect(() => {
    let horariosCarregados = false;
    let excecoesCarregadas = false;

    function concluirCarregamento() {
      if (horariosCarregados && excecoesCarregadas) {
        setCarregandoConfiguracao(false);
      }
    }

    const cancelarHorarios = observarHorariosAtendimento(
      (dados) => {
        horariosCarregados = true;
        setHorarios(dados);
        concluirCarregamento();
      },
      (erroFirebase) => {
        console.error("Erro ao sincronizar horários da agenda", erroFirebase);
        setErroConfiguracao("Não foi possível carregar os horários da agenda.");
        setCarregandoConfiguracao(false);
      }
    );

    const cancelarExcecoes = observarExcecoesAgenda(
      (dados) => {
        excecoesCarregadas = true;
        setExcecoes(dados);
        concluirCarregamento();
      },
      (erroFirebase) => {
        console.error("Erro ao sincronizar exceções da agenda", erroFirebase);
        setErroConfiguracao("Não foi possível carregar as exceções da agenda.");
        setCarregandoConfiguracao(false);
      }
    );

    return () => {
      cancelarHorarios();
      cancelarExcecoes();
    };
  }, []);

  async function salvarHorario(dados) {
    setErroConfiguracao(null);
    return salvarHorarioAtendimentoRegistro(validarHorarioAtendimento(dados));
  }

  async function salvarExcecao(dados) {
    setErroConfiguracao(null);
    return salvarExcecaoAgendaRegistro(validarExcecaoAgenda(dados));
  }

  return {
    horarios,
    excecoes,
    carregandoConfiguracao,
    erroConfiguracao,
    salvarHorario,
    salvarExcecao,
  };
}
