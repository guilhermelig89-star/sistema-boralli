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

import { consumirServicoDoPacote } from "../../src/modules/pacotes/domain/pacotesDomain.js";
import { db } from "../../src/shared/firebase/firebaseConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const caminhoCsvPadrao = path.join(__dirname, "agendamentos_importacao.csv");
const confirmou = process.argv.includes("--confirmar");
const caminhoCsv = process.argv.find((arg) => arg.endsWith(".csv")) || caminhoCsvPadrao;
const loteImportacao = `agenda-antiga-${path.basename(caminhoCsv, ".csv")}`;

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

function minutosDaHora(hora) {
  const [horas, minutos] = String(hora || "").split(":").map(Number);
  if (!Number.isFinite(horas) || !Number.isFinite(minutos)) return null;
  return horas * 60 + minutos;
}

function calcularDuracaoMinutos(inicio, fim, padrao = 60) {
  const inicioMinutos = minutosDaHora(inicio);
  const fimMinutos = minutosDaHora(fim);

  if (inicioMinutos === null || fimMinutos === null || fimMinutos <= inicioMinutos) return padrao;
  return fimMinutos - inicioMinutos;
}

function statusFinanceiro(valorFinal, valorRecebido) {
  if (valorFinal <= 0) return "pago";
  if (valorRecebido >= valorFinal) return "pago";
  if (valorRecebido > 0) return "parcial";
  return "pendente";
}

function simNao(valor) {
  const normalizado = normalizarTexto(valor);
  return normalizado === "SIM" || normalizado === "S" || normalizado === "TRUE";
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

function buscarPacote(pacotes, clienteId, pacoteNome, servicoId, linha, erros) {
  const chavePacote = normalizarTexto(pacoteNome);
  const encontrados = pacotes.filter((pacote) => {
    if (pacote.clienteId !== clienteId) return false;
    if (normalizarTexto(pacote.nome) !== chavePacote) return false;
    if (pacote.status && pacote.status !== "ativo") return false;

    if (Array.isArray(pacote.itens) && pacote.itens.length > 0) {
      return pacote.itens.some((item) => item.servicoId === servicoId && Number(item.saldoRestante ?? item.quantidadeTotal ?? 0) > 0);
    }

    return pacote.servicoId === servicoId && Number(pacote.saldoRestante ?? pacote.quantidadeTotal ?? 0) > 0;
  });

  if (encontrados.length === 0) {
    erros.push(`Linha ${linha}: pacote ativo com saldo não encontrado: ${pacoteNome}`);
    return null;
  }

  if (encontrados.length > 1) {
    erros.push(`Linha ${linha}: mais de um pacote ativo encontrado: ${pacoteNome}`);
    return null;
  }

  return encontrados[0];
}

async function carregarColecao(nome) {
  const snapshot = await getDocs(collection(db, nome));
  return snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
}

async function verificarImportacaoAnterior() {
  const consulta = query(collection(db, "agendamentos"), where("loteImportacao", "==", loteImportacao));
  const snapshot = await getDocs(consulta);
  return snapshot.size;
}

function montarRegistros(linhas, clientes, servicos, pacotes) {
  const erros = [];
  const indiceClientes = criarIndicePorNome(clientes, "nome");
  const indiceServicos = criarIndicePorNome(servicos, "nome");

  const registros = linhas.map((linha) => {
    const cliente = buscarUnico(indiceClientes, linha.cliente, "cliente", linha.linha, erros);
    const servico = buscarUnico(indiceServicos, linha.servico, "serviço", linha.linha, erros);
    const valorCobrado = numero(linha.valor_cobrado, 0);
    const valorPago = numero(linha.valor_pago, 0);
    const consumiuPacote = simNao(linha.consumiu_pacote);
    const duracaoMinutos = calcularDuracaoMinutos(linha.hora_inicio, linha.hora_fim, Number(servico?.duracaoMinutos || 60));
    const pacote = consumiuPacote && cliente && servico
      ? buscarPacote(pacotes, cliente.id, linha.pacote_nome, servico.id, linha.linha, erros)
      : null;

    if (!linha.data || !linha.hora_inicio) {
      erros.push(`Linha ${linha.linha}: data e hora_inicio são obrigatórios.`);
    }

    if (consumiuPacote && !linha.pacote_nome) {
      erros.push(`Linha ${linha.linha}: pacote_nome é obrigatório quando consumiu_pacote = sim.`);
    }

    return {
      linha,
      cliente,
      servico,
      pacote,
      consumiuPacote,
      duracaoMinutos,
      valorCobrado,
      valorPago,
      statusFinanceiro: statusFinanceiro(valorCobrado, valorPago),
    };
  });

  return { registros, erros };
}

function adicionarAgendamento(batch, registro) {
  const { linha, cliente, servico, pacote, consumiuPacote, duracaoMinutos, valorCobrado, valorPago } = registro;
  const agendamentoRef = doc(collection(db, "agendamentos"));
  const status = linha.status || "finalizado";
  const inicioIso = `${linha.data}T${linha.hora_inicio}:00`;
  const fimIso = `${linha.data}T${linha.hora_fim || linha.hora_inicio}:00`;
  const valorPendente = Math.max(0, valorCobrado - valorPago);
  let consumoPacote = null;

  if (consumiuPacote && pacote) {
    const resultadoConsumo = consumirServicoDoPacote(pacote, servico.id);
    const pacoteRef = doc(db, "pacotesClientes", pacote.id);
    const historicoRef = doc(collection(db, "pacotesHistorico"));

    Object.assign(pacote, resultadoConsumo.atualizacao);

    consumoPacote = {
      ...resultadoConsumo.consumoPacote,
      agendamentoId: agendamentoRef.id,
      importado: true,
    };

    batch.update(pacoteRef, {
      ...resultadoConsumo.atualizacao,
      atualizadoEm: serverTimestamp(),
    });
    batch.set(historicoRef, {
      ...consumoPacote,
      tipo: "consumo_importado_agenda_antiga",
      criadoEm: serverTimestamp(),
      loteImportacao,
    });
  }

  batch.set(agendamentoRef, {
    clienteId: cliente.id,
    clienteNome: cliente.nome,
    servicoId: servico.id,
    servicoNome: servico.nome,
    servicoDuracaoMinutos: duracaoMinutos,
    tempoPrevistoMinutos: duracaoMinutos,
    tempoRealMinutos: duracaoMinutos,
    tempoRealCalculado: true,
    atendimentoIniciadoEm: inicioIso,
    atendimentoFinalizadoEm: fimIso,
    tempoSugeridoOrigem: "importacao",
    tempoSugeridoMensagem: "Importado da agenda antiga.",
    pacoteClienteId: consumiuPacote && pacote ? pacote.id : "",
    pacoteNome: consumiuPacote && pacote ? pacote.nome : "",
    data: linha.data,
    hora: linha.hora_inicio,
    formaPagamento: consumiuPacote ? "pacote" : "avulso",
    valor: consumiuPacote ? 0 : valorCobrado,
    observacoes: linha.observacao || "Importado agenda antiga",
    status,
    pacoteConsumido: Boolean(consumoPacote),
    consumoPacote,
    fechamentoFinanceiro: consumiuPacote
      ? null
      : {
          valorOriginal: valorCobrado,
          descontoValor: 0,
          motivoDesconto: "",
          valorFinal: valorCobrado,
          valorRecebido: valorPago,
          valorPendente,
          formaPagamento: valorPendente > 0 && valorPago <= 0 ? "Pendente" : linha.forma_pagamento || "Não informado",
          pagamentos: valorPago > 0 ? [{ forma: linha.forma_pagamento || "Não informado", valor: valorPago }] : [],
          observacoesFinanceiras: linha.observacao || "Importado agenda antiga",
          statusFinanceiro: registro.statusFinanceiro,
        },
    statusFinanceiro: consumiuPacote ? "pacote" : registro.statusFinanceiro,
    importado: true,
    origemImportacao: "agenda_antiga_csv",
    loteImportacao,
    finalizadoEm: serverTimestamp(),
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  if (!consumiuPacote && status === "finalizado") {
    const movimentoRef = doc(collection(db, "movimentosFinanceiros"));

    batch.set(movimentoRef, {
      tipo: "receita",
      origem: "atendimento_avulso",
      agendamentoId: agendamentoRef.id,
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      servicoId: servico.id,
      servicoNome: servico.nome,
      descricao: `Importação agenda antiga - ${servico.nome}`,
      data: linha.data,
      valor: valorPago,
      valorOriginal: valorCobrado,
      descontoValor: 0,
      motivoDesconto: "",
      valorFinal: valorCobrado,
      valorRecebido: valorPago,
      valorPendente,
      formaPagamento: valorPendente > 0 && valorPago <= 0 ? "Pendente" : linha.forma_pagamento || "Não informado",
      pagamentos: valorPago > 0 ? [{ forma: linha.forma_pagamento || "Não informado", valor: valorPago }] : [],
      observacoesFinanceiras: linha.observacao || "Importado agenda antiga",
      status: registro.statusFinanceiro,
      statusFinanceiro: registro.statusFinanceiro,
      importado: true,
      origemImportacao: "agenda_antiga_csv",
      loteImportacao,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  }

  if (status === "finalizado") {
    const historicoTempoRef = doc(collection(db, "temposAtendimentoHistorico"));

    batch.set(historicoTempoRef, {
      agendamentoId: agendamentoRef.id,
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      servicoId: servico.id,
      servicoNome: servico.nome,
      data: linha.data,
      hora: linha.hora_inicio,
      tempoPrevistoMinutos: duracaoMinutos,
      tempoRealMinutos: duracaoMinutos,
      diferencaMinutos: 0,
      diferencaPercentual: 0,
      nivelAlertaTempo: "ok",
      alertaTempoExigeAtencao: false,
      tempoRealCalculado: true,
      importado: true,
      origemImportacao: "agenda_antiga_csv",
      loteImportacao,
      criadoEm: serverTimestamp(),
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
    throw new Error(`Já existem ${importadosAntes} agendamento(s) com o lote ${loteImportacao}. Limpe antes de importar de novo.`);
  }

  const [clientes, servicos, pacotes] = await Promise.all([
    carregarColecao("clientes"),
    carregarColecao("servicos"),
    carregarColecao("pacotesClientes"),
  ]);
  const { registros, erros } = montarRegistros(linhas, clientes, servicos, pacotes);

  if (erros.length > 0) {
    console.log("\nA importação encontrou problemas:");
    erros.forEach((erro) => console.log(`- ${erro}`));
    console.log("\nNada foi gravado no Firebase.");
    process.exit(1);
  }

  console.log("\nValidação concluída:");
  console.log(`- ${registros.length} agendamento(s) prontos para importar.`);
  console.log(`- ${registros.filter((registro) => registro.consumiuPacote).length} consumo(s) de pacote.`);
  console.log(`- ${registros.filter((registro) => !registro.consumiuPacote).length} recebimento(s) avulso(s).`);

  if (!confirmou) {
    console.log("\nSimulação concluída. Para gravar, rode:");
    console.log(`npm run importar:agendamentos -- --confirmar`);
    return;
  }

  const batch = writeBatch(db);
  registros.forEach((registro) => adicionarAgendamento(batch, registro));
  await batch.commit();

  console.log("\nImportação concluída com sucesso.");
}

executar().catch((erro) => {
  console.error("\nNão foi possível importar os agendamentos.");
  console.error(erro.message || erro);
  process.exit(1);
});
