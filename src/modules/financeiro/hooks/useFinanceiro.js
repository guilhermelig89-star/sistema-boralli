import { useEffect, useMemo, useState } from "react";

import {
  criarMovimentoFinanceiro,
  observarMovimentosFinanceiros,
  registrarRecebimentoPendencia,
} from "../repositories/financeiroRepository";
import {
  aplicarFiltrosFinanceiros,
  calcularDreFinanceiro,
  calcularTotaisFinanceiros,
  filtrarMovimentosDoMes,
  prepararDespesaManual,
  prepararRecebimentoPendente,
} from "../services/financeiroService";

export function useFinanceiro(filtros) {
  const [movimentos, setMovimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const cancelar = observarMovimentosFinanceiros(
      (dados) => {
        setMovimentos(dados);
        setCarregando(false);
      },
      (erroFirebase) => {
        console.error("Erro ao sincronizar financeiro", erroFirebase);
        setErro("Não foi possível carregar os movimentos financeiros.");
        setCarregando(false);
      }
    );

    return () => cancelar();
  }, []);

  const movimentosFiltrados = useMemo(
    () => aplicarFiltrosFinanceiros(movimentos, filtros),
    [movimentos, filtros]
  );

  const movimentosDoMes = useMemo(
    () => filtrarMovimentosDoMes(movimentos),
    [movimentos]
  );

  const totaisFiltro = useMemo(
    () => calcularTotaisFinanceiros(movimentosFiltrados),
    [movimentosFiltrados]
  );

  const totaisMes = useMemo(
    () => calcularTotaisFinanceiros(movimentosDoMes),
    [movimentosDoMes]
  );

  const dreFiltro = useMemo(
    () => calcularDreFinanceiro(movimentosFiltrados),
    [movimentosFiltrados]
  );

  async function salvarDespesa(dados) {
    setSalvando(true);
    setErro(null);

    try {
      await criarMovimentoFinanceiro(prepararDespesaManual(dados));
    } catch (erroFirebase) {
      console.error("Erro ao salvar despesa", erroFirebase);
      setErro("Não foi possível salvar a despesa.");
      throw erroFirebase;
    } finally {
      setSalvando(false);
    }
  }

  async function registrarPagamentoPendente(movimentoId, dados) {
    const movimento = movimentos.find((item) => item.id === movimentoId);

    setSalvando(true);
    setErro(null);

    try {
      const { atualizacaoPendencia, novoRecebimento } = prepararRecebimentoPendente(movimento, dados);

      await registrarRecebimentoPendencia(movimentoId, atualizacaoPendencia, novoRecebimento);
    } catch (erroFirebase) {
      console.error("Erro ao registrar pagamento pendente", erroFirebase);
      setErro("Não foi possível registrar o pagamento da pendência.");
      throw erroFirebase;
    } finally {
      setSalvando(false);
    }
  }

  return {
    movimentos,
    movimentosFiltrados,
    totaisFiltro,
    totaisMes,
    dreFiltro,
    carregando,
    salvando,
    erro,
    salvarDespesa,
    registrarPagamentoPendente,
  };
}
