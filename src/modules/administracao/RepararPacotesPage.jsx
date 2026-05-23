import { useState } from "react";
import {
  aplicarCorrecaoPacoteERecarregar,
  corrigirPacoteInconsistente,
  listarInconsistenciasPacotes,
  recalcularTodosPacotes,
} from "./services/reparoPacotesService";
import "./administracao.css";

export default function RepararPacotesPage() {
  const [itens, setItens] = useState([]);
  const [simulacao, setSimulacao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resumo, setResumo] = useState(null);

  async function carregar() { setLoading(true); try { setItens(await listarInconsistenciasPacotes()); } finally { setLoading(false); } }
  async function simularCorrecao(pacoteId) { setLoading(true); try { setResumo(null); setSimulacao(await corrigirPacoteInconsistente({ pacoteId, simulacao: true })); } finally { setLoading(false); } }
  async function aplicarCorrecao(pacoteId = simulacao?.pacoteId) { if (!pacoteId) return; if (!confirm("Aplicar correção do pacote?")) return; setLoading(true); try { const r = await aplicarCorrecaoPacoteERecarregar({ pacoteId }); setResumo(r); setItens(r.inconsistenciasAtualizadas || []); setSimulacao(null); } finally { setLoading(false); } }
  async function simularRecalculo() { setLoading(true); try { setResumo(null); setSimulacao({ tipo: "global", itens: await recalcularTodosPacotes({ simulacao: true }) }); } finally { setLoading(false); } }
  async function aplicarRecalculo() { if (!simulacao?.tipo) return; if (!confirm("Aplicar recálculo global de pacotes?")) return; setLoading(true); try { const itensCorrigidos = await recalcularTodosPacotes({ simulacao: false }); setResumo({ tipo: "global", itens: itensCorrigidos, consumosCorrigidos: itensCorrigidos.reduce((s, x) => s + (x.consumosCorrigidos || 0), 0) }); setSimulacao(null); await carregar(); } finally { setLoading(false); } }

  return <main className="reparo-page"><h1>Administração &gt; Reparar pacotes</h1>
    <div className="reparo-acoes"><button onClick={carregar} disabled={loading}>Listar inconsistências</button><button onClick={simularRecalculo} disabled={loading}>Simular recálculo global</button>{simulacao?.tipo && <button onClick={aplicarRecalculo} disabled={loading}>Aplicar correção global</button>}</div>
    {simulacao && <section className="reparo-box"><h2>Modo simulação</h2><pre>{JSON.stringify(simulacao, null, 2)}</pre>{!simulacao.tipo && <button onClick={() => aplicarCorrecao(simulacao.pacoteId)} disabled={loading}>Aplicar correção</button>}</section>}
    {resumo && <section className="reparo-box"><h2>Resumo da correção</h2>{resumo.mensagemPosCorrecao && <p>{resumo.mensagemPosCorrecao}</p>}{Array.isArray(resumo.pendencias) && resumo.pendencias.length > 0 && <><h3>Inconsistências ainda pendentes</h3><ul>{resumo.pendencias.map((p) => <li key={p.chave}><strong>{p.problema}</strong> | Agendamento: {p.agendamentoId} | Ação: {p.acao}</li>)}</ul></>}<pre>{JSON.stringify(resumo, null, 2)}</pre></section>}
    <section className="reparo-box"><h2>Inconsistências encontradas</h2>{itens.map((i) => <article key={i.id} className="reparo-item"><strong>{i.problema}</strong><p>Cliente: {i.cliente || "-"} | Pacote: {i.pacote || "-"} | Serviço: {i.servico || "-"} | Agendamento: {i.agendamentoId || "-"}</p><p>Ação sugerida: {i.acao}</p>{i.pacoteId && <><button onClick={() => simularCorrecao(i.pacoteId)} disabled={loading}>Simular</button><button onClick={() => aplicarCorrecao(i.pacoteId)} disabled={loading}>Aplicar correção</button></>}</article>)}{!itens.length && <p>Nenhuma inconsistência listada.</p>}</section>
  </main>;
}
