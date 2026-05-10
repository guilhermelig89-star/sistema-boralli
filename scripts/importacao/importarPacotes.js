import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "../../src/shared/firebase/firebaseConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const caminhoCsvPadrao = path.join(__dirname, "pacotes_importacao.csv");
const confirmou = process.argv.includes("--confirmar");
const caminhoCsv = process.argv.find((arg) => arg.endsWith(".csv")) || caminhoCsvPadrao;
const loteImportacao = `pacotes-antigos-${path.basename(caminhoCsv, ".csv")}`;

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/["']/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function numero(valor, padrao = 0) {
  const normalizado = String(valor || "").replace(",", ".");
  const convertido = Number(normalizado);
  return Number.isFinite(convertido) ? convertido : padrao;
}

function parseCsv(conteudo) {
  const linhas = [];
  let linha = [];
  let campo = "";
  let dentroDeAspas = false;

  for (let i = 0; i < conteudo.length; i += 1) {
    const char = conteudo[i];
    const proximo = conteudo[i + 1];

    if (char === '"') {
      if (dentroDeAspas && proximo === '"') {
        campo += '"';
        i += 1;
      } else {
        dentroDeAspas = !dentroDeAspas;
      }
      continue;
    }

    if (char === "," && !dentroDeAspas) {
      linha.push(campo.trim());
      campo = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !dentroDeAspas) {
      if (char === "\r" && proximo === "\n") i += 1;
      linha.push(campo.trim());
      campo = "";

      if (linha.some((valor) => valor !== "")) linhas.push(linha);
      linha = [];
      continue;
    }

    campo += char;
  }

  linha.push(campo.trim());
  if (linha.some((valor) => valor !== "")) linhas.push(linha);

  const [cabecalho, ...dados] = linhas;

  return dados.map((valores, indice) => {
    const item = { linha: indice + 2 };
    cabecalho.forEach((coluna, colunaIndice) => {
      item[coluna] = valores[colunaIndice] || "";
    });
    return item;
  });
}

function criarIndicePorNome(docs, campo = "nome") {
  return docs.reduce((indice, item) => {
    const chave = normalizarTexto(item[campo]);
    if (!chave) return indice;
    if (!indice.has(chave)) indice.set(chave, []);
    indice.get(chave).push(item);
    return indice;
  }, new Map());
}

function buscarUnico(indice, nome, tipo, linha, erros) {
  const chave = normalizarTexto(nome);
  const encontrados = indice.get(chave) || [];

  if (encontrados.length === 0) {
    erros.push(`Linha ${linha}: ${tipo} não encontrado: ${nome}`);
    return null;
  }

  if (encontrados.length > 1) {
    erros.push(`Linha ${linha}: ${tipo} duplicado com este nome: ${nome}`);
    return null;
  }

  return encontrados[0];
}

async function carregarColecao(nome) {
  const snapshot = await getDocs(collection(db, nome));
  return snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
}

async function verificarImportacaoAnterior() {
  const consulta = query(collection(db, "pacotesClientes"), where("loteImportacao", "==", loteImportacao));
  const snapshot = await getDocs(consulta);
  return snapshot.size;
}

function chaveGrupo(linha) {
  return `${normalizarTexto(linha.cliente)}__${normalizarTexto(linha.pacote_nome)}__${linha.data_venda}`;
}

function agruparLinhas(linhas) {
  return linhas.reduce((grupos, linha) => {
    const chave = chaveGrupo(linha);
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(linha);
    return grupos;
  }, new Map());
}

function montarPacotes(linhas, clientes, servicos) {
  const erros = [];
  const indiceClientes = criarIndicePorNome(clientes, "nome");
  const indiceServicos = criarIndicePorNome(servicos, "nome");
  const grupos = agruparLinhas(linhas);
  const pacotes = [];

  for (const linhasGrupo of grupos.values()) {
    const primeiraLinha = linhasGrupo[0];
    const cliente = buscarUnico(indiceClientes, primeiraLinha.cliente, "cliente", primeiraLinha.linha, erros);
    const valorPago = numero(primeiraLinha.valor_pago, 0);
    const itens = [];

    linhasGrupo.forEach((linha) => {
      const servico = buscarUnico(indiceServicos, linha.servico, "serviço", linha.linha, erros);
      const quantidadeTotal = Math.max(0, numero(linha.quantidade_total, 0));
      const quantidadeUtilizada = Math.max(0, numero(linha.quantidade_usada, 0));
      const saldoRestante = Math.max(0, quantidadeTotal - quantidadeUtilizada);

      if (!linha.data_venda) erros.push(`Linha ${linha.linha}: data_venda é obrigatória.`);
      if (quantidadeTotal <= 0) erros.push(`Linha ${linha.linha}: quantidade_total precisa ser maior que zero.`);
      if (quantidadeUtilizada > quantidadeTotal) erros.push(`Linha ${linha.linha}: quantidade_usada não pode ser maior que quantidade_total.`);

      if (servico) {
        itens.push({
          servicoId: servico.id,
          servicoNome: servico.nome,
          quantidadeTotal,
          quantidadeUtilizada,
          saldoRestante,
        });
      }
    });

    const quantidadeTotal = itens.reduce((total, item) => total + item.quantidadeTotal, 0);
    const quantidadeUtilizada = itens.reduce((total, item) => total + item.quantidadeUtilizada, 0);
    const saldoRestante = itens.reduce((total, item) => total + item.saldoRestante, 0);

    if (cliente && itens.length > 0) {
      pacotes.push({
        linha: primeiraLinha.linha,
        cliente,
        nome: primeiraLinha.pacote_nome,
        dataVenda: primeiraLinha.data_venda,
        valorPago,
        formaPagamento: primeiraLinha.forma_pagamento || "",
        observacoes: primeiraLinha.observacao || "Importado do controle antigo",
        itens,
        quantidadeTotal,
        quantidadeUtilizada,
        saldoRestante,
      });
    }
  }

  return { pacotes, erros };
}

function adicionarPacote(batch, pacote) {
  const pacoteRef = doc(collection(db, "pacotesClientes"));

  batch.set(pacoteRef, {
    clienteId: pacote.cliente.id,
    clienteNome: pacote.cliente.nome,
    comboId: "",
    comboNome: pacote.nome,
    servicoId: pacote.itens[0]?.servicoId || "",
    servicoNome: pacote.itens.map((item) => item.servicoNome).join(", "),
    nome: pacote.nome,
    itens: pacote.itens,
    quantidadeTotal: pacote.quantidadeTotal,
    quantidadeUtilizada: pacote.quantidadeUtilizada,
    saldoRestante: pacote.saldoRestante,
    alertaSaldoMinimo: 1,
    valorPago: pacote.valorPago,
    formaPagamento: pacote.formaPagamento,
    observacoes: pacote.observacoes,
    status: pacote.saldoRestante > 0 ? "ativo" : "esgotado",
    importado: true,
    origemImportacao: "pacotes_antigos_csv",
    loteImportacao,
    dataVenda: pacote.dataVenda,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  if (pacote.valorPago > 0) {
    const movimentoRef = doc(collection(db, "movimentosFinanceiros"));

    batch.set(movimentoRef, {
      tipo: "receita",
      origem: "venda_pacote",
      pacoteClienteId: pacoteRef.id,
      clienteId: pacote.cliente.id,
      clienteNome: pacote.cliente.nome,
      descricao: `Importação pacote antigo - ${pacote.nome}`,
      data: pacote.dataVenda,
      valor: pacote.valorPago,
      valorOriginal: pacote.valorPago,
      valorFinal: pacote.valorPago,
      valorRecebido: pacote.valorPago,
      valorPendente: 0,
      descontoValor: 0,
      formaPagamento: pacote.formaPagamento || "Não informado",
      pagamentos: [{ forma: pacote.formaPagamento || "Não informado", valor: pacote.valorPago }],
      status: "pago",
      statusFinanceiro: "pago",
      importado: true,
      origemImportacao: "pacotes_antigos_csv",
      loteImportacao,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  }
}

async function executar() {
  if (!fs.existsSync(caminhoCsv)) {
    throw new Error(`Arquivo não encontrado: ${caminhoCsv}`);
  }

  const conteudo = fs.readFileSync(caminhoCsv, "utf8");
  const linhas = parseCsv(conteudo);

  console.log(`Arquivo: ${caminhoCsv}`);
  console.log(`Linhas encontradas: ${linhas.length}`);

  const importadosAntes = await verificarImportacaoAnterior();
  if (importadosAntes > 0) {
    throw new Error(`Já existem ${importadosAntes} pacote(s) com o lote ${loteImportacao}. Limpe antes de importar de novo.`);
  }

  const [clientes, servicos] = await Promise.all([
    carregarColecao("clientes"),
    carregarColecao("servicos"),
  ]);
  const { pacotes, erros } = montarPacotes(linhas, clientes, servicos);

  if (erros.length > 0) {
    console.log("\nA importação encontrou problemas:");
    erros.forEach((erro) => console.log(`- ${erro}`));
    console.log("\nNada foi gravado no Firebase.");
    process.exit(1);
  }

  console.log("\nValidação concluída:");
  console.log(`- ${pacotes.length} pacote(s) prontos para importar.`);
  console.log(`- Total financeiro: R$ ${pacotes.reduce((total, pacote) => total + pacote.valorPago, 0).toFixed(2)}`);

  if (!confirmou) {
    console.log("\nSimulação concluída. Para gravar, rode:");
    console.log("npm run importar:pacotes -- --confirmar");
    return;
  }

  const batch = writeBatch(db);
  pacotes.forEach((pacote) => adicionarPacote(batch, pacote));
  await batch.commit();

  console.log("\nImportação de pacotes concluída com sucesso.");
}

executar().catch((erro) => {
  console.error("\nNão foi possível importar os pacotes.");
  console.error(erro.message || erro);
  process.exit(1);
});
