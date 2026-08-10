import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import { initializeApp } from "firebase-admin/app";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { extrairCampos } from "./normalizacaoComprovante.js";

initializeApp();

const TIPOS_ACEITOS = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const LIMITE_BYTES = 10 * 1024 * 1024;

export const lerComprovante = onCall({ timeoutSeconds: 60, memory: "512MiB" }, async (requisicao) => {
  if (!requisicao.auth) throw new HttpsError("unauthenticated", "Faça login para ler o comprovante.");
  const { conteudo, tipo } = requisicao.data || {};
  if (!TIPOS_ACEITOS.has(tipo)) throw new HttpsError("invalid-argument", "Formato não suportado.");
  if (typeof conteudo !== "string") throw new HttpsError("invalid-argument", "Arquivo ausente.");

  const bytes = Buffer.from(conteudo, "base64");
  if (!bytes.length || bytes.length > LIMITE_BYTES) throw new HttpsError("invalid-argument", "O arquivo deve ter até 10 MB.");

  const projeto = process.env.GCLOUD_PROJECT;
  const localizacao = process.env.DOCUMENT_AI_LOCATION || "us";
  const processador = process.env.DOCUMENT_AI_PROCESSOR_ID;
  if (!processador) throw new HttpsError("failed-precondition", "Serviço de OCR não configurado.");

  try {
    const cliente = new DocumentProcessorServiceClient({ apiEndpoint: `${localizacao}-documentai.googleapis.com` });
    const [resultado] = await cliente.processDocument({
      name: cliente.processorPath(projeto, localizacao, processador),
      rawDocument: { content: conteudo, mimeType: tipo },
    });
    const documento = resultado.document;
    const texto = documento?.text || "";
    if (!texto.trim()) throw new HttpsError("invalid-argument", "Arquivo ilegível ou PDF protegido por senha.");
    const paginas = documento.pages || [];
    const confiancas = paginas.flatMap((pagina) => (pagina.blocks || []).map((bloco) => bloco.layout?.confidence).filter(Number.isFinite));
    const confianca = confiancas.length ? confiancas.reduce((soma, valor) => soma + valor, 0) / confiancas.length : 0;
    return extrairCampos(texto, confianca);
  } catch (erro) {
    if (erro instanceof HttpsError) throw erro;
    // Registra somente metadados operacionais; nunca o texto ou dados do documento.
    console.error("Falha no OCR", { codigo: erro?.code, tipo, tamanho: bytes.length });
    if ([3, 400].includes(erro?.code)) throw new HttpsError("invalid-argument", "Arquivo ilegível, protegido por senha ou inválido.");
    if ([4, 504].includes(erro?.code)) throw new HttpsError("deadline-exceeded", "Tempo limite do OCR excedido.");
    throw new HttpsError("unavailable", "Serviço de OCR indisponível.");
  }
});
