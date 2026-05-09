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

function somarFormasPagamento(porForma = {}, termos = []) {
  return Object.entries(porForma).reduce((total, [forma, valor]) => {
    const formaNormalizada = forma.toLowerCase();
    const corresponde = termos.some((termo) => formaNormalizada.includes(termo));
    return corresponde ? total + Number(valor || 0) : total;
  }, 0);
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
      status: "",
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

  const finalizadosPeriodo = useMemo(
    () => agendaPeriodo.filter((agendamento) => agendamento.status === "finalizado").length,
    [agendaPeriodo]
  );

  const receitaAvulsaPrevista = useMemo(
    () =>
      proximosAtendimentos.reduce((total, agendamento) => {
        if (agendamento.pacoteClienteId) return total;
        return total + Number(agendamento.valor || 0);
      }, 0),
    [proximosAtendimentos]
  );

  const proximoAtendimento = proximosAtendimentos[0];
  const percentualConclusao = agendaPeriodo.length > 0 ? Math.round((finalizadosPeriodo / agendaPeriodo.length) * 100) : 0;
  const recebidoPix = somarFormasPagamento(totaisFiltro.porForma, ["pix"]);
  const recebidoDinheiro = somarFormasPagamento(totaisFiltro.porForma, ["dinheiro"]);
  const recebidoCartao = somarFormasPagamento(totaisFiltro.porForma, ["cartão", "cartao"]);

  const radarInteligente = useMemo(() => {
    const itens = [];

    if (proximoAtendimento) {
      itens.push({
        titulo: "Próximo atendimento",
        texto: `${proximoAtendimento.hora} - ${proximoAtendimento.clienteNome} para ${proximoAtendimento.servicoNome}.`,
        acao: "Abrir atendimento",
        destino: "atendimento",
      });
    }

    if (Number(totaisFiltro.pendente || 0) > 0) {
      itens.push({
        titulo: "Valores pendentes",
        texto: `${formatarMoeda(totaisFiltro.pendente)} ainda em aberto no período.`,
        acao: "Ver financeiro",
        destino: "financeiro",
      });
    }

    if (pacotesBaixos.length > 0) {
      itens.push({
        titulo: "Pacotes perto de acabar",
        texto: `${pacotesBaixos.length} cliente(s) com saldo baixo. Bom momento para oferecer renovação.`,
        acao: "Ver pacotes",
        destino: "pacotes",
      });
    }

    if (receitaAvulsaPrevista > 0) {
      itens.push({
        titulo: "Previsão avulsa",
        texto: `${formatarMoeda(receitaAvulsaPrevista)} em atendimentos avulsos ainda pendentes.`,
        acao: "Ver agenda",
        destino: "agenda",
      });
    }

    if (agendaPeriodo.length === 0) {
      itens.push({
        titulo: "Agenda livre",
        texto: "Nenhum horário marcado no período. Você pode encaixar novos atendimentos.",
        acao: "Agendar horário",
        destino: "agenda",
      });
    }

    if (itens.length === 0) {
      itens.push({
        titulo: "Operação tranquila",
        texto: "Nenhuma pendência importante encontrada para este período.",
        acao: "Ver atendimento",
        destino: "atendimento",
      });
    }

    return itens;
  }, [agendaPeriodo.length, pacotesBaixos.length, proximoAtendimento, receitaAvulsaPrevista, totaisFiltro.pendente]);

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

      <div className="dashboard-inteligente">
        <div className="painel-operacao-dashboard">
          <span className="rotulo-operacao-dashboard">Agora</span>
          <h2>{proximoAtendimento ? `${proximoAtendimento.hora} - ${proximoAtendimento.clienteNome}` : "Nenhum atendimento pendente"}</h2>
          <p>
            {proximoAtendimento
              ? `${proximoAtendimento.servicoNome} | ${pagamentoTexto(proximoAtendimento)}`
              : "Use o painel para acompanhar o dia e encontrar oportunidades de encaixe."}
          </p>

          <div className="metricas-operacao-dashboard">
            <div>
              <strong>{proximosAtendimentos.length}</strong>
              <span>em aberto</span>
            </div>
            <div>
              <strong>{finalizadosPeriodo}</strong>
              <span>finalizados</span>
            </div>
            <div>
              <strong>{percentualConclusao}%</strong>
              <span>conclusão</span>
            </div>
          </div>
        </div>

        <div className="radar-dashboard">
          <div className="radar-topo-dashboard">
            <div>
              <span className="rotulo-operacao-dashboard">Radar inteligente</span>
              <h2>Prioridades do período</h2>
            </div>
            <span className="contador-radar-dashboard">{radarInteligente.length}</span>
          </div>

          <div className="lista-radar-dashboard">
            {radarInteligente.slice(0, 3).map((item) => (
              <button className="item-radar-dashboard" key={item.titulo} onClick={() => onNavigate(item.destino)}>
                <strong>{item.titulo}</strong>
                <span>{item.texto}</span>
                <em>{item.acao}</em>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card-grid cards-kpi-dashboard">
        <div className="card card-dashboard card-kpi-dashboard">
          <span>Clientes ativos</span>
          <strong>{clientesAtivos.length}</strong>
          <p>Clientes disponíveis para agendar</p>
        </div>

        <div className="card card-dashboard card-kpi-dashboard">
          <span>{painelDoDia ? "Agenda do dia" : "Agenda do período"}</span>
          <strong>{agendaPeriodo.length}</strong>
          <p>{proximosAtendimentos.length} ainda em aberto</p>
        </div>

        <div className="card card-dashboard card-kpi-dashboard">
          <span>Pacotes ativos</span>
          <strong>{pacotesAtivos.length}</strong>
          <p>{pacotesBaixos.length} com saldo baixo</p>
        </div>

        <div className="card card-dashboard card-kpi-dashboard card-kpi-receita-dashboard">
          <span>Recebido no período</span>
          <strong>{formatarMoeda(totaisFiltro.recebido)}</strong>
          <p>{formatarMoeda(totaisFiltro.pendente)} pendente</p>
        </div>
      </div>

      <div className="dashboard-financeiro-indicadores">
        <div>
          <span>Recebido</span>
          <strong>{formatarMoeda(totaisFiltro.recebido)}</strong>
        </div>
        <div>
          <span>Pendente</span>
          <strong>{formatarMoeda(totaisFiltro.pendente)}</strong>
        </div>
        <div>
          <span>Pix</span>
          <strong>{formatarMoeda(recebidoPix)}</strong>
        </div>
        <div>
          <span>Dinheiro</span>
          <strong>{formatarMoeda(recebidoDinheiro)}</strong>
        </div>
        <div>
          <span>Cartão</span>
          <strong>{formatarMoeda(recebidoCartao)}</strong>
        </div>
        <div>
          <span>Descontos</span>
          <strong>{formatarMoeda(totaisFiltro.descontos)}</strong>
        </div>
        <div>
          <span>Parcial em aberto</span>
          <strong>{formatarMoeda(totaisFiltro.pendente)}</strong>
        </div>
      </div>

      <div className="painel-duplo painel-dashboard">
        <div className="bloco bloco-dashboard">
          <div className="cabecalho-bloco-dashboard">
            <div>
              <h2>{painelDoDia ? "Atendimentos do dia" : "Atendimentos do período"}</h2>
              <p>Agenda organizada por data, horário e tipo de pagamento.</p>
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
            <button onClick={() => onNavigate("clientes")}>
              <strong>Adicionar cliente</strong>
              <span>Novo cadastro para agendar depois.</span>
            </button>
            <button onClick={() => onNavigate("servicos")}>
              <strong>Cadastrar serviço</strong>
              <span>Atualize preços, duração e combos.</span>
            </button>
            <button onClick={() => onNavigate("pacotes")}>
              <strong>Vender pacote</strong>
              <span>Registre créditos consumíveis da cliente.</span>
            </button>
            <button onClick={() => onNavigate("agenda")}>
              <strong>Agendar horário</strong>
              <span>Veja encaixes e horários disponíveis.</span>
            </button>
            <button onClick={() => onNavigate("financeiro")}>
              <strong>Ver financeiro</strong>
              <span>Acompanhe receitas, despesas e DRE.</span>
            </button>
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
