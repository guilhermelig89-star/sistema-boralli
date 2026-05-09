import { useEffect, useMemo, useState } from "react";

import { criarMovimentoFinanceiro, observarMovimentosFinanceiros } from "../repositories/financeiroRepository";
import {
  aplicarFiltrosFinanceiros,
  calcularDreFinanceiro,
  calcularTotaisFinanceiros,
  filtrarMovimentosDoMes,
  prepararDespesaManual,
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
  };
}
