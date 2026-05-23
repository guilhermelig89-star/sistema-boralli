import { useState } from "react";
import { corrigirPacoteInconsistente, listarInconsistenciasPacotes, recalcularTodosPacotes } from "./services/reparoPacotesService";
import "./administracao.css";

export default function RepararPacotesPage() {
  const [itens, setItens] = useState([]);
  const [simulacao, setSimulacao] = useState(null);
  const [loading, setLoading] = useState(false);

  async function carregar() { setLoading(true); try { setItens(await listarInconsistenciasPacotes()); } finally { setLoading(false); } }
  async function simularCorrecao(pacoteId) { setLoading(true); try { setSimulacao(await corrigirPacoteInconsistente({ pacoteId, simulacao: true })); } finally { setLoading(false); } }
  async function aplicarCorrecao() { if (!simulacao) return; if (!confirm("Aplicar correção do pacote?")) return; setLoading(true); try { await corrigirPacoteInconsistente({ pacoteId: simulacao.pacoteId, simulacao: false }); setSimulacao(null); await carregar(); } finally { setLoading(false); } }
  async function simularRecalculo() { setLoading(true); try { setSimulacao({ tipo: "global", itens: await recalcularTodosPacotes({ simulacao: true }) }); } finally { setLoading(false); } }
  async function aplicarRecalculo() { if (!simulacao?.tipo) return; if (!confirm("Aplicar recálculo global de pacotes?")) return; setLoading(true); try { await recalcularTodosPacotes({ simulacao: false }); setSimulacao(null); await carregar(); } finally { setLoading(false); } }

  return <main className="reparo-page"><h1>Administração &gt; Reparar pacotes</h1>
    <div className="reparo-acoes"><button onClick={carregar} disabled={loading}>Listar inconsistências</button><button onClick={simularRecalculo} disabled={loading}>Recalcular todos os pacotes (simular)</button>{simulacao?.tipo && <button onClick={aplicarRecalculo} disabled={loading}>Aplicar recálculo global</button>}</div>
    {simulacao && <section className="reparo-box"><h2>Modo simulação</h2><pre>{JSON.stringify(simulacao, null, 2)}</pre>{!simulacao.tipo && <button onClick={aplicarCorrecao} disabled={loading}>Confirmar correção do pacote</button>}</section>}
    <section className="reparo-box"><h2>Inconsistências encontradas</h2>{itens.map((i) => <article key={i.id} className="reparo-item"><strong>{i.problema}</strong><p>Cliente: {i.cliente || "-"} | Pacote: {i.pacote || "-"} | Serviço: {i.servico || "-"} | Agendamento: {i.agendamentoId || "-"}</p><p>Ação sugerida: {i.acao}</p>{i.pacoteId && <button onClick={() => simularCorrecao(i.pacoteId)} disabled={loading}>Corrigir pacote (simular)</button>}</article>)}{!itens.length && <p>Nenhuma inconsistência listada.</p>}</section>
  </main>;
}
