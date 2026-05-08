import { useEffect, useMemo, useState } from "react";

import { observarCombos } from "../repositories/combosRepository";
import { criarCombo, editarCombo, desativarCombo } from "../services/combosService";

export function useCombos() {
  const [combos, setCombos] = useState([]);
  const [carregandoCombos, setCarregandoCombos] = useState(true);
  const [erroCombos, setErroCombos] = useState(null);

  useEffect(() => {
    const cancelar = observarCombos(
      (dados) => {
        setCombos(dados);
        setCarregandoCombos(false);
      },
      (erroFirebase) => {
        console.error("Erro ao sincronizar combos", erroFirebase);
        setErroCombos("Não foi possível carregar os combos.");
        setCarregandoCombos(false);
      }
    );

    return () => cancelar();
  }, []);

  const combosAtivos = useMemo(
    () => combos.filter((combo) => combo.ativo !== false),
    [combos]
  );

  async function salvarCombo(dados, id) {
    setErroCombos(null);

    if (id) {
      return editarCombo(id, dados);
    }

    return criarCombo(dados);
  }

  async function removerCombo(id) {
    setErroCombos(null);
    return desativarCombo(id);
  }

  return {
    combos,
    combosAtivos,
    carregandoCombos,
    erroCombos,
    salvarCombo,
    removerCombo,
  };
}
