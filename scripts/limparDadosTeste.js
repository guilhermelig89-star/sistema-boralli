import { collection, getDocs, writeBatch } from "firebase/firestore";

import { db } from "../src/shared/firebase/firebaseConfig.js";

const confirmou = process.argv.includes("--confirmar");

const colecoesParaLimpar = [
  "clientes",
  "agendamentos",
  "movimentosFinanceiros",
  "pacotesClientes",
  "pacotesHistorico",
  "temposAtendimentoHistorico",
  "sugestoesTempoAtendimento",
];

async function apagarColecao(nomeColecao) {
  const snapshot = await getDocs(collection(db, nomeColecao));

  if (snapshot.empty) {
    console.log(`- ${nomeColecao}: nenhum documento encontrado.`);
    return 0;
  }

  let totalApagado = 0;
  let batch = writeBatch(db);
  let operacoesNoBatch = 0;

  for (const documento of snapshot.docs) {
    batch.delete(documento.ref);
    operacoesNoBatch += 1;
    totalApagado += 1;

    if (operacoesNoBatch === 450) {
      await batch.commit();
      batch = writeBatch(db);
      operacoesNoBatch = 0;
    }
  }

  if (operacoesNoBatch > 0) {
    await batch.commit();
  }

  console.log(`- ${nomeColecao}: ${totalApagado} documento(s) apagado(s).`);
  return totalApagado;
}

async function executar() {
  if (!confirmou) {
    console.log("Limpeza cancelada.");
    console.log("Para apagar os dados operacionais, rode:");
    console.log("npm run limpar:dados -- --confirmar");
    process.exit(1);
  }

  console.log("Limpando dados operacionais do Firebase...");
  console.log("Serviços, combos cadastrados, horários e categorias serão preservados.\n");

  let total = 0;

  for (const nomeColecao of colecoesParaLimpar) {
    total += await apagarColecao(nomeColecao);
  }

  console.log(`\nLimpeza concluída. Total apagado: ${total} documento(s).`);
}

executar().catch((erro) => {
  console.error("Não foi possível concluir a limpeza.");
  console.error(erro);
  process.exit(1);
});
