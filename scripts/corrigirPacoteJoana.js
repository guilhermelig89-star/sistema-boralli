import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "../src/shared/firebase/firebaseConfig.js";

const confirmou = process.argv.includes("--confirmar");
const NOME_CLIENTE = "JOANA";

function normalizarTexto(valor = "") {
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isConsumoAtivo(historico = {}) {
  return ![
    historico.estornado === true,
    historico.cancelado === true,
    historico.status === "cancelado",
    historico.status === "estornado",
    Boolean(historico.estornadoEm),
  ].some(Boolean);
}

function recalcularItensParaZeroUso(pacote = {}) {
  if (!Array.isArray(pacote.itens) || pacote.itens.length === 0) return undefined;

  return pacote.itens.map((item) => {
    const quantidadeTotal = Number(item.quantidadeTotal ?? 0);

    return {
      ...item,
      quantidadeUtilizada: 0,
      saldoRestante: quantidadeTotal,
    };
  });
}

async function executar() {
  if (!confirmou) {
    console.log("Correção cancelada.");
    console.log("Para executar a correção da cliente JOANA, rode:");
    console.log("node scripts/corrigirPacoteJoana.js --confirmar");
    process.exit(1);
  }

  const pacotesSnapshot = await getDocs(collection(db, "pacotesClientes"));
  const pacotesJoana = pacotesSnapshot.docs
    .map((documento) => ({ id: documento.id, ...documento.data() }))
    .filter((pacote) => normalizarTexto(pacote.clienteNome) === normalizarTexto(NOME_CLIENTE));

  if (pacotesJoana.length === 0) {
    throw new Error("Nenhum pacote da cliente JOANA foi encontrado.");
  }

  console.log(`Pacotes encontrados para ${NOME_CLIENTE}: ${pacotesJoana.length}`);

  let totalHistoricosEstornados = 0;
  let totalAgendamentosAtualizados = 0;

  for (const pacote of pacotesJoana) {
    const historicosSnapshot = await getDocs(
      query(collection(db, "pacotesHistorico"), where("pacoteClienteId", "==", pacote.id))
    );

    const historicosAtivos = historicosSnapshot.docs.filter((documento) => isConsumoAtivo(documento.data()));

    const agendamentosSnapshot = await getDocs(
      query(collection(db, "agendamentos"), where("pacoteClienteId", "==", pacote.id))
    );

    const batch = writeBatch(db);

    for (const historicoDoc of historicosAtivos) {
      batch.update(historicoDoc.ref, {
        estornado: true,
        cancelado: true,
        status: "cancelado",
        estornadoEm: serverTimestamp(),
        estornadoMotivo: "correcao_pacote_joana_sem_uso",
        atualizadoEm: serverTimestamp(),
      });
      totalHistoricosEstornados += 1;
    }

    for (const agendamentoDoc of agendamentosSnapshot.docs) {
      const agendamento = agendamentoDoc.data();
      const consumoAtivo = isConsumoAtivo(agendamento.consumoPacote || {});
      if (!agendamento.pacoteConsumido && !consumoAtivo) continue;

      batch.update(agendamentoDoc.ref, {
        pacoteConsumido: false,
        consumoPacote: {
          ...(agendamento.consumoPacote || {}),
          status: "cancelado",
          cancelado: true,
          estornado: true,
          estornadoEm: new Date().toISOString(),
          estornadoMotivo: "correcao_pacote_joana_sem_uso",
        },
        atualizadoEm: serverTimestamp(),
      });

      totalAgendamentosAtualizados += 1;
    }

    const quantidadeTotal = Number(pacote.quantidadeTotal ?? 0);
    const itensRecalculados = recalcularItensParaZeroUso(pacote);

    batch.update(doc(db, "pacotesClientes", pacote.id), {
      quantidadeUtilizada: 0,
      saldoRestante: quantidadeTotal,
      status: "ativo",
      ...(itensRecalculados ? { itens: itensRecalculados } : {}),
      atualizadoEm: serverTimestamp(),
    });

    await batch.commit();

    console.log(
      `Pacote ${pacote.id} (${pacote.nome || "sem_nome"}) corrigido: ${historicosAtivos.length} consumo(s) estornado(s).`
    );
  }

  console.log("\nCorreção concluída com sucesso.");
  console.log(`- Históricos estornados/cancelados: ${totalHistoricosEstornados}`);
  console.log(`- Agendamentos atualizados: ${totalAgendamentosAtualizados}`);
  console.log("- Saldo dos pacotes recalculado para zero uso.");
}

executar().catch((erro) => {
  console.error("Não foi possível concluir a correção do pacote da JOANA.");
  console.error(erro);
  process.exit(1);
});
