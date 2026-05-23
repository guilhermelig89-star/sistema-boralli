import { collection, doc, getDocs, query, runTransaction, serverTimestamp, where } from "firebase/firestore";
import { db } from "../src/shared/firebase/firebaseConfig.js";

const PREVIEW = process.argv.includes("--preview") || !process.argv.includes("--aplicar");
const HELP = process.argv.includes("--help") || process.argv.includes("-h");

const CORRECOES = [
  {
    clienteNome: 'BIANCA "RENATA"',
    itensEsperados: [
      { servicoIncludes: "mão", quantidadeTotal: 4, quantidadeUtilizada: 3 },
      { servicoIncludes: "pé", quantidadeTotal: 1, quantidadeUtilizada: 1 },
    ],
  },
  {
    clienteNome: "RENATA - PADARIA",
    itensEsperados: [
      { servicoIncludes: "mão", quantidadeTotal: 4, quantidadeUtilizada: 3 },
      { servicoIncludes: "pé", quantidadeTotal: 1, quantidadeUtilizada: 1 },
    ],
  },
  {
    clienteNome: "JOANA",
    itensEsperados: [
      { servicoIncludes: "mão", quantidadeTotal: 4, quantidadeUtilizada: 1 },
      { servicoIncludes: "pé", quantidadeTotal: 2, quantidadeUtilizada: 1 },
    ],
  },
];

const normalizar = (v = "") =>
  String(v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const calcularItem = (item = {}) => {
  const total = Number(item.quantidadeTotal ?? item.quantidade ?? 0);
  const usada = Number(item.quantidadeUtilizada ?? 0);
  return { total, usada, restante: Math.max(0, total - usada) };
};

function montarEstadoPacote(pacote) {
  const itens = Array.isArray(pacote.itens) ? pacote.itens : [];
  const totais = itens.reduce(
    (acc, item) => {
      const calc = calcularItem(item);
      acc.total += calc.total;
      acc.usada += calc.usada;
      acc.restante += calc.restante;
      return acc;
    },
    { total: 0, usada: 0, restante: 0 }
  );

  return {
    id: pacote.id,
    clienteNome: pacote.clienteNome,
    nome: pacote.nome,
    status: pacote.status,
    quantidadeTotal: pacote.quantidadeTotal,
    quantidadeUtilizada: pacote.quantidadeUtilizada,
    saldoRestante: pacote.saldoRestante,
    itens,
    totais,
  };
}

function aplicarEstadoEsperado(pacote, correcao) {
  const itensAtualizados = (pacote.itens || []).map((item) => {
    const nomeItem = normalizar(item.servicoNome || item.nome || "");
    const regra = correcao.itensEsperados.find((r) => nomeItem.includes(normalizar(r.servicoIncludes)));
    if (!regra) return item;

    const quantidadeTotal = Number(regra.quantidadeTotal);
    const quantidadeUtilizada = Number(regra.quantidadeUtilizada);
    return {
      ...item,
      quantidadeTotal,
      quantidadeUtilizada,
      saldoRestante: Math.max(0, quantidadeTotal - quantidadeUtilizada),
    };
  });

  const quantidadeTotal = itensAtualizados.reduce((t, item) => t + Number(item.quantidadeTotal || 0), 0);
  const quantidadeUtilizada = itensAtualizados.reduce((t, item) => t + Number(item.quantidadeUtilizada || 0), 0);
  const saldoRestante = itensAtualizados.reduce((t, item) => t + Math.max(0, Number(item.saldoRestante || 0)), 0);

  return {
    itens: itensAtualizados,
    quantidadeTotal,
    quantidadeUtilizada,
    saldoRestante,
    status: saldoRestante > 0 ? "ativo" : "esgotado",
    atualizadoEm: serverTimestamp(),
  };
}

async function buscarPacotePorCliente(clienteNome) {
  const snap = await getDocs(query(collection(db, "pacotesClientes"), where("clienteNome", "==", clienteNome)));
  if (!snap.empty) return snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const todos = await getDocs(collection(db, "pacotesClientes"));
  return todos.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => normalizar(p.clienteNome) === normalizar(clienteNome));
}

async function executar() {
  if (HELP) {
    console.log("Uso da ferramenta administrativa: Corrigir saldos reais dos pacotes");
    console.log("\nComandos:");
    console.log("- Preview (não altera dados): npm run corrigir:saldos-reais-pacotes");
    console.log("- Aplicar correções:         npm run corrigir:saldos-reais-pacotes:aplicar");
    console.log("- Ajuda:                     npm run corrigir:saldos-reais-pacotes:ajuda");
    console.log("\nAlternativa direta:");
    console.log("- node scripts/corrigirSaldosReaisPacotes.js --preview");
    console.log("- node scripts/corrigirSaldosReaisPacotes.js --aplicar");
    return;
  }

  console.log(PREVIEW ? "[PREVIEW] Nenhuma alteração será aplicada." : "[APLICAR] Aplicando correções.");

  for (const correcao of CORRECOES) {
    const encontrados = await buscarPacotePorCliente(correcao.clienteNome);
    if (encontrados.length === 0) {
      console.log(`\nCliente: ${correcao.clienteNome} -> pacote não encontrado`);
      continue;
    }

    const pacote = encontrados[0];
    const antes = montarEstadoPacote(pacote);
    const depois = aplicarEstadoEsperado(pacote, correcao);

    console.log(`\nCliente: ${correcao.clienteNome}`);
    console.log("ANTES:", JSON.stringify(antes, null, 2));
    console.log("DEPOIS:", JSON.stringify({ ...antes, ...depois }, null, 2));

    if (!PREVIEW) {
      await runTransaction(db, async (transaction) => {
        const pacoteRef = doc(db, "pacotesClientes", pacote.id);
        const pacoteSnap = await transaction.get(pacoteRef);
        if (!pacoteSnap.exists()) throw new Error(`Pacote ${pacote.id} não encontrado durante transação.`);
        transaction.update(pacoteRef, depois);
      });
    }
  }
}

executar().catch((erro) => {
  console.error("Falha ao corrigir saldos reais dos pacotes.");
  console.error(erro);
  process.exit(1);
});
