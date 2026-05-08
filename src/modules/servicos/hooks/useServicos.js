import { useEffect, useMemo, useState } from "react";

import { observarServicos } from "../repositories/servicosRepository";
import {
  criarServico,
  editarServico,
  desativarServico,
} from "../services/servicosService";

export function useServicos() {
  const [servicos, setServicos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const cancelar = observarServicos(
      (dados) => {
        setServicos(dados);
        setCarregando(false);
      },
      (erroFirebase) => {
        console.error("Erro ao sincronizar servicos", erroFirebase);
        setErro("Nao foi possivel carregar os servicos.");
        setCarregando(false);
      }
    );

    return () => cancelar();
  }, []);

  const servicosAtivos = useMemo(
    () => servicos.filter((servico) => servico.ativo !== false),
    [servicos]
  );

  async function salvarServico(dados, id) {
    setErro(null);

    if (id) {
      return editarServico(id, dados);
    }

    return criarServico(dados);
  }

  async function removerServico(id) {
    setErro(null);
    return desativarServico(id);
  }

  return {
    servicos,
    servicosAtivos,
    carregando,
    erro,
    salvarServico,
    removerServico,
  };
}
