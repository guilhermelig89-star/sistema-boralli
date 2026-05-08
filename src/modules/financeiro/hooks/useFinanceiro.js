import { useEffect, useMemo, useState } from "react";

import { observarMovimentosFinanceiros } from "../repositories/financeiroRepository";
import {
  aplicarFiltrosFinanceiros,
  calcularTotaisFinanceiros,
  filtrarMovimentosDoMes,
} from "../services/financeiroService";

export function useFinanceiro(filtros) {
  const [movimentos, setMovimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
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

  return {
    movimentos,
    movimentosFiltrados,
    totaisFiltro,
    totaisMes,
    carregando,
    erro,
  };
}
