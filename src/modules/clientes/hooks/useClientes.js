import { useEffect, useMemo, useState } from "react";

import { observarClientes } from "../repositories/clientesRepository";
import {
  criarCliente,
  editarCliente,
  desativarCliente,
} from "../services/clientesService";

export function useClientes() {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const cancelar = observarClientes(
      (dados) => {
        setClientes(dados);
        setCarregando(false);
      },
      (erroFirebase) => {
        console.error("Erro ao sincronizar clientes", erroFirebase);
        setErro("Não foi possível carregar os clientes.");
        setCarregando(false);
      }
    );

    return () => cancelar();
  }, []);

  const clientesAtivos = useMemo(
    () => clientes.filter((cliente) => cliente.ativo !== false),
    [clientes]
  );

  async function salvarCliente(dados, id) {
    setErro(null);

    if (id) {
      return editarCliente(id, dados);
    }

    return criarCliente(dados);
  }

  async function removerCliente(id) {
    setErro(null);
    return desativarCliente(id);
  }

  return {
    clientes,
    clientesAtivos,
    carregando,
    erro,
    salvarCliente,
    removerCliente,
  };
}
