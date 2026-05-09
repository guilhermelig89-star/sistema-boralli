import { useMemo, useState } from "react";

import { useAgendamentos } from "../agendamentos/hooks/useAgendamentos";
import { useClientes } from "../clientes/hooks/useClientes";
import { formatarMoeda } from "../financeiro/services/financeiroService";
import { useFinanceiro } from "../financeiro/hooks/useFinanceiro";
import { usePacotesClientes } from "../pacotes/hooks/usePacotesClientes";
import { useServicos } from "../servicos/hooks/useServicos";
import "./dashboard.css";

function formatarDataChave(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function obterHoje() {
  return formatarDataChave(new Date());
}

function obterInicioMes(dataReferencia = new Date()) {
  return formatarDataChave(new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), 1));
}

function obterFimMes(dataReferencia = new Date()) {
  return formatarDataChave(new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() + 1, 0));
}

function adicionarDias(dataChave, quantidadeDias) {
  const [ano, mes, dia] = dataChave.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setDate(data.getDate() + quantidadeDias);
  return formatarDataChave(data);
}

function formatarData(dataChave) {
  if (!dataChave) return "-";

  const [ano, mes, dia] = dataChave.split("-");
  if (!ano || !mes || !dia) return dataChave;

  return `${dia}/${mes}/${ano}`;
}

function dataEstaNoPeriodo(data, periodo) {
  if (!data) return false;
  const depoisDoInicio = !periodo.inicio || data >= periodo.inicio;
  const antesDoFim = !periodo.fim || data <= periodo.fim;

  return depoisDoInicio && antesDoFim;
}

function periodoEhDia(periodo) {
  return Boolean(periodo.inicio && periodo.fim && periodo.inicio === periodo.fim);
}

function descreverPeriodo(periodo) {
  if (periodoEhDia(periodo)) return formatarData(periodo.inicio);
  if (periodo.inicio && periodo.fim) return `${formatarData(periodo.inicio)} a ${formatarData(periodo.fim)}`;
  if (periodo.inicio) return `a partir de ${formatarData(periodo.inicio)}`;
  if (periodo.fim) return `até ${formatarData(periodo.fim)}`;
  return "todo o período";
}

function statusTexto(status) {
  if (status === "em_atendimento") return "Em atendimento";
  if (status === "finalizado") return "Finalizado";
  if (status === "cancelado") return "Cancelado";
  return "Agendado";
}

function pagamentoTexto(agendamento) {
  if (agendamento.pacoteClienteId) return `Pacote: ${agendamento.pacoteNome || "pacote"}`;
  return `Avulso - ${formatarMoeda(agendamento.valor)}`;
}

function DashboardPage({ onNavigate }) {
  const hoje = obterHoje();
  const [periodo, setPeriodo] = useState(() => ({ inicio: hoje, fim: hoje }));
  const { clientesAtivos } = useClientes();
  const { servicosAtivos } = useServicos();
  const { agendamentos } = useAgendamentos();
  const { pacotesAtivos, pacoteEstaAcabando, calcularSaldoPacote } = usePacotesClientes();

  const filtrosFinanceiroDashboard = useMemo(
    () => ({
      dataInicio: periodo.inicio,
      dataFim: periodo.fim,
      clienteId: "",
      origem: "sistema",
      status: "confirmado",
      pesquisa: "",
    }),
    [periodo.fim, periodo.inicio]
  );

  const { totaisFiltro } = useFinanceiro(filtrosFinanceiroDashboard);
  const painelDoDia = periodoEhDia(periodo);
  const periodoDescricao = descreverPeriodo(periodo);

  const agendaPeriodo = useMemo(
    () =>
      agendamentos
        .filter((agendamento) => dataEstaNoPeriodo(agendamento.data, periodo) && agendamento.status !== "cancelado")
        .sort((a, b) =>
          `${a.data || ""} ${a.hora || ""}`.localeCompare(`${b.data || ""} ${b.hora || ""}`)
        ),
    [agendamentos, periodo]
  );

  const proximosAtendimentos = useMemo(
    () =>
      agendaPeriodo.filter(
        (agendamento) => agendamento.status !== "finalizado" && agendamento.status !== "cancelado"
      ),
    [agendaPeriodo]
  );

  const pacotesBaixos = useMemo(
    () => pacotesAtivos.filter((pacote) => pacoteEstaAcabando(pacote)).slice(0, 5),
    [pacotesAtivos, pacoteEstaAcabando]
  );

  function definirPeriodoHoje() {
    setPeriodo({ inicio: hoje, fim: hoje });
  }

  function definirProximosDias() {
    setPeriodo({ inicio: hoje, fim: adicionarDias(hoje, 6) });
  }

  function definirMesAtual() {
    const agora = new Date();
    setPeriodo({ inicio: obterInicioMes(agora), fim: obterFimMes(agora) });
  }

  return (
    <section className="dashboard dashboard-real">
      <div className="dashboard-header dashboard-header-real">
        <div>
          <span className="tag">Sistema Boralli V1</span>
          <h1>Painel</h1>
          <p>Resumo de {periodoDescricao} para acompanhar agenda, clientes, pacotes e financeiro.</p>

          <div className="dashboard-filtros-periodo" aria-label="Filtro de período do painel">
            <label className="campo-periodo-dashboard">
              <span>De</span>
              <input
                type="date"
                value={periodo.inicio}
                onChange={(event) => setPeriodo((atual) => ({ ...atual, inicio: event.target.value }))}
              />
            </label>

            <label className="campo-periodo-dashboard">
              <span>Até</span>
              <input
                type="date"
                value={periodo.fim}
                onChange={(event) => setPeriodo((atual) => ({ ...atual, fim: event.target.value }))}
              />
            </label>

            <div className="atalhos-periodo-dashboard">
              <button type="button" onClick={definirPeriodoHoje}>Hoje</button>
              <button type="button" onClick={definirProximosDias}>7 dias</button>
              <button type="button" onClick={definirMesAtual}>Mês atual</button>
            </div>
          </div>
        </div>

        <div className="acoes-dashboard-topo">
          <button className="botao-acao" onClick={() => onNavigate("agenda")}>Novo agendamento</button>
          <button className="botao-acao-secundario" onClick={() => onNavigate("atendimento")}>Abrir atendimento</button>
        </div>
      </div>

      <div className="card-grid">
        <div className="card card-dashboard">
          <span>Clientes ativos</span>
          <strong>{clientesAtivos.length}</strong>
          <p>Clientes disponíveis para agendar</p>
        </div>

        <div className="card card-dashboard">
          <span>{painelDoDia ? "Agenda do dia" : "Agenda do período"}</span>
          <strong>{agendaPeriodo.length}</strong>
          <p>{proximosAtendimentos.length} ainda em aberto</p>
        </div>

        <div className="card card-dashboard">
          <span>Pacotes ativos</span>
          <strong>{pacotesAtivos.length}</strong>
          <p>{pacotesBaixos.length} com saldo baixo</p>
        </div>

        <div className="card card-dashboard">
          <span>Receitas do período</span>
          <strong>{formatarMoeda(totaisFiltro.receitas)}</strong>
          <p>Pacotes e atendimentos avulsos</p>
        </div>
      </div>

      <div className="painel-duplo painel-dashboard">
        <div className="bloco bloco-dashboard">
          <div className="cabecalho-bloco-dashboard">
            <div>
              <h2>{painelDoDia ? "Atendimentos do dia" : "Atendimentos do período"}</h2>
              <p>Agenda organizada por data e horário.</p>
            </div>
            <button className="botao-acao-secundario" onClick={() => onNavigate("atendimento")}>Ver atendimento</button>
          </div>

          <div className="lista-dashboard">
            {proximosAtendimentos.length === 0 && (
              <div className="item-dashboard-vazio">Nenhum atendimento pendente neste período.</div>
            )}

            {proximosAtendimentos.slice(0, 5).map((agendamento) => (
              <div className="item-dashboard" key={agendamento.id}>
                <div>
                  <strong>
                    {painelDoDia ? agendamento.hora : `${formatarData(agendamento.data)} ${agendamento.hora}`} - {agendamento.clienteNome}
                  </strong>
                  <span>{agendamento.servicoNome} | {pagamentoTexto(agendamento)}</span>
                </div>
                <span className="badge-tipo badge-combo">{statusTexto(agendamento.status)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bloco bloco-dashboard">
          <div className="cabecalho-bloco-dashboard">
            <div>
              <h2>Ações rápidas</h2>
              <p>Acessos mais usados no dia a dia.</p>
            </div>
          </div>

          <div className="acoes-rapidas-dashboard">
            <button onClick={() => onNavigate("clientes")}>Adicionar cliente</button>
            <button onClick={() => onNavigate("servicos")}>Cadastrar serviço</button>
            <button onClick={() => onNavigate("pacotes")}>Vender pacote</button>
            <button onClick={() => onNavigate("agenda")}>Agendar horário</button>
            <button onClick={() => onNavigate("financeiro")}>Ver financeiro</button>
          </div>
        </div>
      </div>

      <div className="bloco bloco-dashboard bloco-pacotes-dashboard">
        <div className="cabecalho-bloco-dashboard">
          <div>
            <h2>Pacotes com atenção</h2>
            <p>Clientes com saldo baixo para acompanhar antes do próximo atendimento.</p>
          </div>
          <button className="botao-acao-secundario" onClick={() => onNavigate("pacotes")}>Ver pacotes</button>
        </div>

        <div className="lista-dashboard lista-pacotes-dashboard">
          {pacotesBaixos.length === 0 && (
            <div className="item-dashboard-vazio">Nenhum pacote com saldo baixo agora.</div>
          )}

          {pacotesBaixos.map((pacote) => (
            <div className="item-dashboard" key={pacote.id}>
              <div>
                <strong>{pacote.clienteNome}</strong>
                <span>{pacote.nome} | {calcularSaldoPacote(pacote)} restante</span>
              </div>
              <span className="badge-tipo badge-alerta">Saldo baixo</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bloco bloco-dashboard bloco-servicos-dashboard">
        <div className="cabecalho-bloco-dashboard">
          <div>
            <h2>Catálogo</h2>
            <p>{servicosAtivos.length} serviços ativos cadastrados para agenda e pacotes.</p>
          </div>
          <button className="botao-acao-secundario" onClick={() => onNavigate("servicos")}>Ver serviços</button>
        </div>
      </div>
    </section>
  );
}

export default DashboardPage;
