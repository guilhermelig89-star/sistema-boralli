import { useEffect, useState } from "react";

import {
  observarSugestoesTempoAtendimento,
  revisarDuracaoPadraoServico,
  salvarSugestaoTempoClienteServico,
} from "../repositories/tempoAtendimentoRepository";

export function useSugestoesTempoAtendimento() {
  const [sugestoesTempo, setSugestoesTempo] = useState([]);
  const [carregandoSugestoesTempo, setCarregandoSugestoesTempo] = useState(true);
  const [erroSugestoesTempo, setErroSugestoesTempo] = useState(null);

  useEffect(() => {
    const cancelar = observarSugestoesTempoAtendimento(
      (dados) => {
        setSugestoesTempo(dados);
        setCarregandoSugestoesTempo(false);
      },
      (erroFirebase) => {
        console.error("Erro ao sincronizar sugestões de tempo", erroFirebase);
        setErroSugestoesTempo("Não foi possível carregar as sugestões de tempo.");
        setCarregandoSugestoesTempo(false);
      }
    );

    return () => cancelar();
  }, []);

  async function salvarAjusteClienteServico(dados) {
    setErroSugestoesTempo(null);
    return salvarSugestaoTempoClienteServico(dados);
  }

  async function revisarTempoPadraoServico(servicoId, duracaoMinutos) {
    setErroSugestoesTempo(null);
    return revisarDuracaoPadraoServico(servicoId, duracaoMinutos);
  }

  return {
    sugestoesTempo,
    carregandoSugestoesTempo,
    erroSugestoesTempo,
    salvarAjusteClienteServico,
    revisarTempoPadraoServico,
  };
}
