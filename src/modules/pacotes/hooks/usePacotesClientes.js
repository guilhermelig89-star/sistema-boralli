import { useEffect, useMemo, useState } from "react";

import {
  observarPacotesClientes,
  observarHistoricoPacotes,
} from "../repositories/pacotesRepository";
import {
  criarPacoteCliente,
  estornarConsumoPacote,
  recalcularPacotePorHistoricoAtivo,
  calcularSaldoPacote,
  calcularSaldoServicoPacote,
  pacoteEstaAcabando,
  pacoteTemSaldoParaServico,
} from "../services/pacotesService";

export function usePacotesClientes() {
  const [pacotes, setPacotes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const cancelarPacotes = observarPacotesClientes(
      (dados) => {
        setPacotes(dados);
        setCarregando(false);
      },
      (erroFirebase) => {
        console.error("Erro ao sincronizar pacotes", erroFirebase);
        setErro("Não foi possível carregar os pacotes.");
        setCarregando(false);
      }
    );

    const cancelarHistorico = observarHistoricoPacotes(
      setHistorico,
      (erroFirebase) => {
        console.error("Erro ao sincronizar histórico de pacotes", erroFirebase);
      }
    );

    return () => {
      cancelarPacotes();
      cancelarHistorico();
    };
  }, []);

  const pacotesAtivos = useMemo(
    () => pacotes.filter((pacote) => pacote.status === "ativo" && calcularSaldoPacote(pacote) > 0),
    [pacotes]
  );

  async function salvarPacote(dados) {
    setErro(null);
    return criarPacoteCliente(dados);
  }

  async function estornarConsumo(dados) {
    setErro(null);
    return estornarConsumoPacote(dados);
  }

  async function recalcularPacote(dados) {
    setErro(null);
    return recalcularPacotePorHistoricoAtivo(dados);
  }

  return {
    pacotes,
    pacotesAtivos,
    historico,
    carregando,
    erro,
    salvarPacote,
    estornarConsumo,
    recalcularPacote,
    calcularSaldoPacote,
    calcularSaldoServicoPacote,
    pacoteEstaAcabando,
    pacoteTemSaldoParaServico,
  };
}
