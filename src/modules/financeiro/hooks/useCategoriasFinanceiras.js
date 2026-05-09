import { useEffect, useMemo, useState } from "react";

import {
  criarCategoriaFinanceira,
  desativarCategoriaFinanceira,
  observarCategoriasFinanceiras,
} from "../repositories/categoriasFinanceirasRepository";

const categoriasPadraoDespesa = [
  "Material",
  "Transporte",
  "Aluguel",
  "Taxas",
  "Marketing",
  "Alimentação",
  "Manutenção",
  "Outros",
];

function normalizarNome(nome) {
  return String(nome || "").trim();
}

function chaveNome(nome) {
  return normalizarNome(nome).toLocaleLowerCase("pt-BR");
}

function criarCategoriasPadrao() {
  return categoriasPadraoDespesa.map((nome) => ({
    id: `padrao-${chaveNome(nome)}`,
    nome,
    tipo: "despesa",
    ativo: true,
    padrao: true,
  }));
}

function unirCategoriasPadrao(categoriasFirebase) {
  const categoriasAtivas = categoriasFirebase.filter((categoria) => categoria.ativo !== false && categoria.tipo === "despesa");
  const mapa = new Map();

  criarCategoriasPadrao().forEach((categoria) => {
    mapa.set(chaveNome(categoria.nome), categoria);
  });

  categoriasAtivas.forEach((categoria) => {
    mapa.set(chaveNome(categoria.nome), categoria);
  });

  return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export function useCategoriasFinanceiras() {
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const cancelar = observarCategoriasFinanceiras(
      (dados) => {
        setCategorias(dados);
        setCarregando(false);
      },
      (erroFirebase) => {
        console.error("Erro ao sincronizar categorias financeiras", erroFirebase);
        setErro("Não foi possível carregar as categorias.");
        setCarregando(false);
      }
    );

    return () => cancelar();
  }, []);

  const categoriasDespesa = useMemo(() => unirCategoriasPadrao(categorias), [categorias]);

  async function salvarCategoria(nome) {
    const nomeTratado = normalizarNome(nome);

    if (!nomeTratado) {
      throw new Error("Informe o nome da categoria.");
    }

    const jaExiste = categoriasDespesa.some((categoria) => chaveNome(categoria.nome) === chaveNome(nomeTratado));
    if (jaExiste) {
      throw new Error("Essa categoria já existe.");
    }

    setSalvando(true);
    setErro(null);

    try {
      await criarCategoriaFinanceira({
        nome: nomeTratado,
        tipo: "despesa",
      });
    } catch (erroFirebase) {
      console.error("Erro ao salvar categoria financeira", erroFirebase);
      setErro("Não foi possível salvar a categoria.");
      throw erroFirebase;
    } finally {
      setSalvando(false);
    }
  }

  async function removerCategoria(categoria) {
    if (categoria.padrao) return;

    setSalvando(true);
    setErro(null);

    try {
      await desativarCategoriaFinanceira(categoria.id);
    } catch (erroFirebase) {
      console.error("Erro ao desativar categoria financeira", erroFirebase);
      setErro("Não foi possível remover a categoria.");
      throw erroFirebase;
    } finally {
      setSalvando(false);
    }
  }

  return {
    categoriasDespesa,
    carregando,
    salvando,
    erro,
    salvarCategoria,
    removerCategoria,
  };
}
