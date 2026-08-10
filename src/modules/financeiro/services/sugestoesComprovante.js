const LIMIAR_CONFIANCA = 0.65;

function normalizar(texto) {
  return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

export function encontrarCategoria(categoriaSugerida, categorias, confianca) {
  if (!categoriaSugerida || Number(confianca) < LIMIAR_CONFIANCA) return null;
  const procurada = normalizar(categoriaSugerida);
  return categorias.find((categoria) => normalizar(categoria.nome) === procurada)?.nome || null;
}

export function aplicarSugestoes(despesa, leitura, camposEditados, categorias) {
  const atualizada = { ...despesa };
  const sugeridos = [];
  const campos = ["data", "valor", "descricao", "formaPagamento"];

  for (const campo of campos) {
    if (leitura?.[campo] !== undefined && leitura[campo] !== null && leitura[campo] !== "" && !camposEditados.has(campo)) {
      atualizada[campo] = String(leitura[campo]);
      sugeridos.push(campo);
    }
  }

  const categoria = encontrarCategoria(leitura?.categoriaSugerida, categorias, leitura?.confianca);
  if (categoria && !camposEditados.has("categoria")) {
    atualizada.categoria = categoria;
    sugeridos.push("categoria");
  }

  return { despesa: atualizada, camposSugeridos: sugeridos };
}
