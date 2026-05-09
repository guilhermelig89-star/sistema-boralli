import { useMemo, useState } from "react";

import { useAgendamentos } from "../agendamentos/hooks/useAgendamentos";
import { useClientes } from "../clientes/hooks/useClientes";
import {
  formatarMoeda,
  formatarOrigem,
  formatarPercentual,
  obterDataMovimento,
} from "../financeiro/services/financeiroService";
import { useFinanceiro } from "../financeiro/hooks/useFinanceiro";
import { calcularSaldoPacote, obterResumoItensPacote } from "../pacotes/domain/pacotesDomain";
import { usePacotesClientes } from "../pacotes/hooks/usePacotesClientes";
import "./relatorios.css";

function formatarDataChave(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function obterHoje() {
  return formatarDataChave(new Date());
}

function obterInicioMes() {
  const hoje = new Date();
  return formatarDataChave(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
}

function formatarData(dataChave) {
  if (!dataChave) return "-";
  const [ano, mes, dia] = dataChave.split("-");
  if (!ano || !mes || !dia) return dataChave;
  return `${dia}/${mes}/${ano}`;
}

function formatarEmissao() {
  return new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dataNoPeriodo(data, filtros) {
  if (!data) return false;
  const depoisInicio = !filtros.dataInicio || data >= filtros.dataInicio;
  const antesFim = !filtros.dataFim || data <= filtros.dataFim;
  return depoisInicio && antesFim;
}

function statusAgendamento(status) {
  if (status === "em_atendimento") return "Em atendimento";
  if (status === "finalizado") return "Finalizado";
  if (status === "cancelado") return "Cancelado";
  return "Agendado";
}

function pagamentoAgendamento(agendamento) {
  if (agendamento.pacoteClienteId) return `Pacote: ${agendamento.pacoteNome || "pacote"}`;
  return `Avulso - ${formatarMoeda(agendamento.valor)}`;
}

function nomeRelatorio(tipo) {
  if (tipo === "agenda") return "Relatório de Agenda";
  if (tipo === "pacotes") return "Relatório de Pacotes";
  return "Relatório Financeiro / DRE";
}

function statusPacote(pacote) {
  if (pacote.status === "esgotado" || calcularSaldoPacote(pacote) <= 0) return "Finalizado";
  return "Ativo";
}

function BlocoResumo({ titulo, valor, detalhe }) {
  return (
    <div className="relatorio-resumo-card">
      <span>{titulo}</span>
      <strong>{valor}</strong>
      {detalhe && <small>{detalhe}</small>}
    </div>
  );
}

function TabelaVazia({ texto }) {
  return (
    <div className="relatorio-vazio">
      {texto}
    </div>
  );
}

function RelatorioFinanceiro({ dre, movimentos }) {
  return (
    <>
      <section className="relatorio-secao">
        <h3>Resumo financeiro</h3>
        <div className="relatorio-resumo-grid">
          <BlocoResumo titulo="Receita bruta" valor={formatarMoeda(dre.receitaBruta)} />
          <BlocoResumo titulo="Despesas" valor={formatarMoeda(dre.despesas)} />
          <BlocoResumo titulo="Resultado líquido" valor={formatarMoeda(dre.resultadoLiquido)} />
          <BlocoResumo titulo="Margem líquida" valor={formatarPercentual(dre.margemLiquida)} />
        </div>
      </section>

      <section className="relatorio-secao">
        <h3>DRE do período</h3>
        <table className="relatorio-tabela">
          <tbody>
            <tr><td>Receita bruta</td><td>{formatarMoeda(dre.receitaBruta)}</td></tr>
            <tr><td>Pacotes vendidos</td><td>{formatarMoeda(dre.vendaPacotes)}</td></tr>
            <tr><td>Atendimentos avulsos</td><td>{formatarMoeda(dre.atendimentosAvulsos)}</td></tr>
            <tr><td>Outras receitas</td><td>{formatarMoeda(dre.outrasReceitas)}</td></tr>
            <tr><td>Despesas</td><td>{formatarMoeda(dre.despesas)}</td></tr>
            <tr className="linha-total"><td>Resultado líquido</td><td>{formatarMoeda(dre.resultadoLiquido)}</td></tr>
          </tbody>
        </table>
      </section>

      <section className="relatorio-duas-colunas">
        <div className="relatorio-secao">
          <h3>Receita por forma de pagamento</h3>
          {dre.porFormaPagamento.length === 0 ? (
            <TabelaVazia texto="Nenhuma receita no período." />
          ) : (
            <table className="relatorio-tabela compacta">
              <thead><tr><th>Forma</th><th>Valor</th><th>%</th></tr></thead>
              <tbody>
                {dre.porFormaPagamento.map((item) => (
                  <tr key={item.forma}>
                    <td>{item.forma}</td>
                    <td>{formatarMoeda(item.valor)}</td>
                    <td>{formatarPercentual(item.percentual)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="relatorio-secao">
          <h3>Despesas por categoria</h3>
          {!dre.porCategoriaDespesa || dre.porCategoriaDespesa.length === 0 ? (
            <TabelaVazia texto="Nenhuma despesa no período." />
          ) : (
            <table className="relatorio-tabela compacta">
              <thead><tr><th>Categoria</th><th>Valor</th><th>%</th></tr></thead>
              <tbody>
                {dre.porCategoriaDespesa.map((item) => (
                  <tr key={item.categoria}>
                    <td>{item.categoria}</td>
                    <td>{formatarMoeda(item.valor)}</td>
                    <td>{formatarPercentual(item.percentual)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="relatorio-secao quebra-evitada">
        <h3>Movimentos financeiros</h3>
        {movimentos.length === 0 ? (
          <TabelaVazia texto="Nenhum movimento encontrado." />
        ) : (
          <table className="relatorio-tabela compacta">
            <thead>
              <tr>
                <th>Data</th>
                <th>Origem</th>
                <th>Descrição</th>
                <th>Forma</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {movimentos.map((movimento) => (
                <tr key={movimento.id}>
                  <td>{formatarData(obterDataMovimento(movimento))}</td>
                  <td>{formatarOrigem(movimento.origem)}</td>
                  <td>{movimento.descricao || movimento.clienteNome || "-"}</td>
                  <td>{movimento.formaPagamento || "-"}</td>
                  <td>{formatarMoeda(movimento.tipo === "despesa" ? Number(movimento.valor || 0) * -1 : movimento.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

function RelatorioAgenda({ agendamentos }) {
  const resumo = agendamentos.reduce(
    (total, agendamento) => ({
      todos: total.todos + 1,
      abertos: total.abertos + (agendamento.status !== "finalizado" && agendamento.status !== "cancelado" ? 1 : 0),
      finalizados: total.finalizados + (agendamento.status === "finalizado" ? 1 : 0),
      cancelados: total.cancelados + (agendamento.status === "cancelado" ? 1 : 0),
    }),
    { todos: 0, abertos: 0, finalizados: 0, cancelados: 0 }
  );

  return (
    <>
      <section className="relatorio-secao">
        <h3>Resumo da agenda</h3>
        <div className="relatorio-resumo-grid">
          <BlocoResumo titulo="Total" valor={resumo.todos} />
          <BlocoResumo titulo="Em aberto" valor={resumo.abertos} />
          <BlocoResumo titulo="Finalizados" valor={resumo.finalizados} />
          <BlocoResumo titulo="Cancelados" valor={resumo.cancelados} />
        </div>
      </section>

      <section className="relatorio-secao">
        <h3>Atendimentos do período</h3>
        {agendamentos.length === 0 ? (
          <TabelaVazia texto="Nenhum agendamento encontrado." />
        ) : (
          <table className="relatorio-tabela compacta">
            <thead>
              <tr>
                <th>Data</th>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Serviço</th>
                <th>Pagamento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map((agendamento) => (
                <tr key={agendamento.id}>
                  <td>{formatarData(agendamento.data)}</td>
                  <td>{agendamento.hora || "-"}</td>
                  <td>{agendamento.clienteNome || "-"}</td>
                  <td>{agendamento.servicoNome || "-"}</td>
                  <td>{pagamentoAgendamento(agendamento)}</td>
                  <td>{statusAgendamento(agendamento.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

function RelatorioPacotes({ pacotes }) {
  const resumo = pacotes.reduce(
    (total, pacote) => {
      const finalizado = statusPacote(pacote) === "Finalizado";
      return {
        todos: total.todos + 1,
        ativos: total.ativos + (finalizado ? 0 : 1),
        finalizados: total.finalizados + (finalizado ? 1 : 0),
        saldo: total.saldo + calcularSaldoPacote(pacote),
      };
    },
    { todos: 0, ativos: 0, finalizados: 0, saldo: 0 }
  );

  return (
    <>
      <section className="relatorio-secao">
        <h3>Resumo de pacotes</h3>
        <div className="relatorio-resumo-grid">
          <BlocoResumo titulo="Pacotes" valor={resumo.todos} />
          <BlocoResumo titulo="Ativos" valor={resumo.ativos} />
          <BlocoResumo titulo="Finalizados" valor={resumo.finalizados} />
          <BlocoResumo titulo="Saldo total" valor={resumo.saldo} detalhe="serviços restantes" />
        </div>
      </section>

      <section className="relatorio-secao">
        <h3>Pacotes vendidos</h3>
        {pacotes.length === 0 ? (
          <TabelaVazia texto="Nenhum pacote encontrado." />
        ) : (
          <table className="relatorio-tabela compacta">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Pacote</th>
                <th>Itens</th>
                <th>Saldo</th>
                <th>Valor pago</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pacotes.map((pacote) => (
                <tr key={pacote.id}>
                  <td>{pacote.clienteNome || "-"}</td>
                  <td>{pacote.nome || "-"}</td>
                  <td>{obterResumoItensPacote(pacote)}</td>
                  <td>{calcularSaldoPacote(pacote)}</td>
                  <td>{formatarMoeda(pacote.valorPago)}</td>
                  <td>{statusPacote(pacote)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

function RelatoriosPage() {
  const hoje = obterHoje();
  const [filtros, setFiltros] = useState({
    tipo: "financeiro",
    dataInicio: obterInicioMes(),
    dataFim: hoje,
    clienteId: "",
  });
  const { clientesAtivos } = useClientes();
  const { agendamentos } = useAgendamentos();
  const { pacotes } = usePacotesClientes();

  const filtrosFinanceiro = useMemo(
    () => ({
      dataInicio: filtros.dataInicio,
      dataFim: filtros.dataFim,
      clienteId: filtros.clienteId,
      origem: "todos",
      status: "confirmado",
      pesquisa: "",
    }),
    [filtros.clienteId, filtros.dataFim, filtros.dataInicio]
  );

  const { movimentosFiltrados, dreFiltro } = useFinanceiro(filtrosFinanceiro);

  const clienteSelecionado = useMemo(
    () => clientesAtivos.find((cliente) => cliente.id === filtros.clienteId),
    [clientesAtivos, filtros.clienteId]
  );

  const agendamentosRelatorio = useMemo(
    () => agendamentos
      .filter((agendamento) => dataNoPeriodo(agendamento.data, filtros))
      .filter((agendamento) => !filtros.clienteId || agendamento.clienteId === filtros.clienteId)
      .sort((a, b) => `${a.data || ""} ${a.hora || ""}`.localeCompare(`${b.data || ""} ${b.hora || ""}`)),
    [agendamentos, filtros]
  );

  const pacotesRelatorio = useMemo(
    () => pacotes
      .filter((pacote) => !filtros.clienteId || pacote.clienteId === filtros.clienteId)
      .sort((a, b) => String(a.clienteNome || "").localeCompare(String(b.clienteNome || ""), "pt-BR")),
    [pacotes, filtros.clienteId]
  );

  function alterarFiltro(campo, valor) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
  }

  function imprimir() {
    window.print();
  }

  return (
    <div className="relatorios-page">
      <div className="topo-clientes no-print">
        <div>
          <h1>Relatórios</h1>
          <p>Gere documentos oficiais para impressão ou PDF.</p>
        </div>
      </div>

      <div className="relatorios-controles no-print">
        <label>
          <span>Relatório</span>
          <select value={filtros.tipo} onChange={(e) => alterarFiltro("tipo", e.target.value)}>
            <option value="financeiro">Financeiro / DRE</option>
            <option value="agenda">Agenda</option>
            <option value="pacotes">Pacotes</option>
          </select>
        </label>

        <label>
          <span>De</span>
          <input type="date" value={filtros.dataInicio} onChange={(e) => alterarFiltro("dataInicio", e.target.value)} />
        </label>

        <label>
          <span>Até</span>
          <input type="date" value={filtros.dataFim} onChange={(e) => alterarFiltro("dataFim", e.target.value)} />
        </label>

        <label>
          <span>Cliente</span>
          <select value={filtros.clienteId} onChange={(e) => alterarFiltro("clienteId", e.target.value)}>
            <option value="">Todos os clientes</option>
            {clientesAtivos.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
            ))}
          </select>
        </label>

        <button className="botao-acao" type="button" onClick={imprimir}>Imprimir / Salvar PDF</button>
      </div>

      <article className="relatorio-documento">
        <header className="relatorio-cabecalho">
          <div>
            <span className="relatorio-sistema">Sistema Boralli V1</span>
            <h2>Boralli</h2>
            <p>Documento gerado automaticamente pelo sistema.</p>
          </div>
          <div className="relatorio-titulo-oficial">
            <strong>{nomeRelatorio(filtros.tipo)}</strong>
            <span>Documento para conferência e impressão</span>
          </div>
        </header>

        <section className="relatorio-metadados">
          <div><span>Período</span><strong>{formatarData(filtros.dataInicio)} a {formatarData(filtros.dataFim)}</strong></div>
          <div><span>Cliente</span><strong>{clienteSelecionado?.nome || "Todos os clientes"}</strong></div>
          <div><span>Emissão</span><strong>{formatarEmissao()}</strong></div>
          <div><span>Responsável</span><strong>Boralli</strong></div>
        </section>

        {filtros.tipo === "financeiro" && <RelatorioFinanceiro dre={dreFiltro} movimentos={movimentosFiltrados} />}
        {filtros.tipo === "agenda" && <RelatorioAgenda agendamentos={agendamentosRelatorio} />}
        {filtros.tipo === "pacotes" && <RelatorioPacotes pacotes={pacotesRelatorio} />}

        <footer className="relatorio-rodape">
          <p>Documento emitido para controle interno e conferência operacional.</p>
          <div className="relatorio-assinatura">
            <span />
            <strong>Assinatura / conferência</strong>
          </div>
        </footer>
      </article>
    </div>
  );
}

export default RelatoriosPage;
