import { getFunctions, httpsCallable } from "firebase/functions";

const TAMANHO_MAXIMO = 10 * 1024 * 1024;
export const TIPOS_COMPROVANTE_ACEITOS = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function arquivoParaBase64(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result).split(",")[1]);
    leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo selecionado."));
    leitor.readAsDataURL(arquivo);
  });
}

export function validarComprovante(arquivo) {
  if (!TIPOS_COMPROVANTE_ACEITOS.includes(arquivo?.type)) {
    throw new Error("Envie o comprovante em PDF, JPG, PNG ou WEBP.");
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    throw new Error("O comprovante deve ter no máximo 10 MB.");
  }
}

export function mensagemErroLeitura(erro) {
  const codigo = erro?.code || "";
  if (codigo.includes("deadline-exceeded")) return "A leitura demorou demais. Tente novamente.";
  if (codigo.includes("failed-precondition")) {
    return "A leitura automática ainda não foi configurada. Você pode preencher e salvar manualmente.";
  }
  if (codigo.includes("not-found")) {
    return "A leitura automática ainda não foi publicada. Você pode preencher e salvar manualmente.";
  }
  if (codigo.includes("unavailable") || codigo.includes("internal")) {
    return "O serviço de leitura está indisponível. Você ainda pode preencher e salvar manualmente.";
  }
  if (codigo.includes("invalid-argument")) return erro.message || "O comprovante não pôde ser lido.";
  return "Não foi possível ler o comprovante. Confira se ele está legível ou preencha manualmente.";
}

export async function lerComprovante(arquivo) {
  validarComprovante(arquivo);
  const conteudo = await arquivoParaBase64(arquivo);
  const extrair = httpsCallable(getFunctions(), "lerComprovante", { timeout: 60_000 });

  try {
    const resposta = await extrair({ conteudo, tipo: arquivo.type });
    return resposta.data;
  } catch (erro) {
    throw new Error(mensagemErroLeitura(erro), { cause: erro });
  }
}
