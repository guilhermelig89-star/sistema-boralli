export function normalizarValor(valor) {
  if (!valor) return null;
  const encontrado = String(valor).match(/(?:R\$\s*)?(-?\d{1,3}(?:\.\d{3})*(?:,\d{2})|-?\d+(?:[.,]\d{2}))/i);
  if (!encontrado) return null;
  const numero = encontrado[1].replace(/\./g, "").replace(",", ".");
  return Number.isFinite(Number(numero)) ? Number(numero).toFixed(2) : null;
}

export function normalizarData(data) {
  const encontrado = String(data || "").match(/\b(0?[1-9]|[12]\d|3[01])[./-](0?[1-9]|1[0-2])[./-](20\d{2}|\d{2})\b/);
  if (!encontrado) return null;
  const ano = encontrado[3].length === 2 ? `20${encontrado[3]}` : encontrado[3];
  const candidata = new Date(`${ano}-${encontrado[2].padStart(2, "0")}-${encontrado[1].padStart(2, "0")}T00:00:00Z`);
  if (candidata.getUTCDate() !== Number(encontrado[1]) || candidata.getUTCMonth() + 1 !== Number(encontrado[2])) return null;
  return `${ano}-${encontrado[2].padStart(2, "0")}-${encontrado[1].padStart(2, "0")}`;
}

function primeiraCaptura(texto, expressoes) {
  for (const expressao of expressoes) {
    const resultado = texto.match(expressao);
    if (resultado?.[1]) return resultado[1].trim();
  }
  return null;
}

export function extrairCampos(texto, confianca = 0) {
  const data = normalizarData(texto);
  const valorTexto = primeiraCaptura(texto, [/(?:valor(?:\s+total)?|total(?:\s+pago)?)\s*[:-]?\s*(R\$\s*[\d.,]+)/i]);
  const formaPagamento = /\bpix\b/i.test(texto) ? "Pix"
    : /cart[aã]o.*cr[eé]dito/i.test(texto) ? "Cartão de crédito"
      : /cart[aã]o.*d[eé]bito/i.test(texto) ? "Cartão de débito"
        : /transfer[eê]ncia/i.test(texto) ? "Transferência" : null;
  const campos = {
    data,
    valor: normalizarValor(valorTexto),
    descricao: primeiraCaptura(texto, [/(?:descri[cç][aã]o|referente a)\s*[:-]\s*([^\n]{3,100})/i]),
    formaPagamento,
    categoriaSugerida: primeiraCaptura(texto, [/categoria\s*[:-]\s*([^\n]{3,60})/i]),
    favorecido: primeiraCaptura(texto, [/(?:favorecido|recebedor|benefici[aá]rio)\s*[:-]\s*([^\n]{3,100})/i]),
    documento: primeiraCaptura(texto, [/(?:cpf|cnpj)\s*[:-]?\s*([\d./-]+)/i]),
    identificador: primeiraCaptura(texto, [/(?:id(?:entificador)?|autentica[cç][aã]o)\s*[:-]\s*([\w.-]+)/i]),
    confianca: Math.max(0, Math.min(1, Number(confianca) || 0)),
  };
  return Object.fromEntries(Object.entries(campos).filter(([, valor]) => valor !== null && valor !== ""));
}
