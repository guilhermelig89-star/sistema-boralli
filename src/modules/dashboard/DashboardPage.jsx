import { useMemo } from "react";

import { useAgendamentos } from "../agendamentos/hooks/useAgendamentos";
import { useClientes } from "../clientes/hooks/useClientes";
import { formatarMoeda } from "../financeiro/services/financeiroService";
import { useFinanceiro } from "../financeiro/hooks/useFinanceiro";
import { usePacotesClientes } from "../pacotes/hooks/usePacotesClientes";
import { useServicos } from "../servicos/hooks/useServicos";
import "./dashboard.css";

const filtrosFinanceiroDashboard = {
  dataInicio: "",
  dataFim: "",
  clienteId: "",
  origem: "sistema",
  status: "confirmado",
  pesquisa: "",
};

function obterHoje() {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
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
  const { clientesAtivos } = useClientes();
  const { servicosAtivos } = useServicos();
  const { agendamentos } = useAgendamentos();
  const { pacotesAtivos, pacoteEstaAcabando, calcularSaldoPacote } = usePacotesClientes();
  const { totaisMes } = useFinanceiro(filtrosFinanceiroDashboard);
  const hoje = obterHoje();

  const agendaHoje = useMemo(
    () =>
      agendamentos
        .filter((agendamento) => agendamento.data === hoje && agendamento.status !== "cancelado")
        .sort((a, b) => String(a.hora || "").localeCompare(String(b.hora || ""))),
    [agendamentos, hoje]
  );

  const proximosAtendimentos = useMemo(
    () =>
      agendaHoje.filter(
        (agendamento) => agendamento.status !== "finalizado" && agendamento.status !== "cancelado"
      ),
    [agendaHoje]
  );

  const pacotesBaixos = useMemo(
    () => pacotesAtivos.filter((pacote) => pacoteEstaAcabando(pacote)).slice(0, 5),
    [pacotesAtivos, pacoteEstaAcabando]
  );

  return (
    <section className="dashboard dashboard-real">
      <div className="dashboard-header dashboard-header-real">
        <div>
          <span className="tag">Sistema Boralli V1</span>
          <h1>Painel</h1>
          <p>Resumo do dia para acompanhar agenda, clientes, pacotes e financeiro.</p>
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
          <span>Agenda de hoje</span>
          <strong>{agendaHoje.length}</strong>
          <p>{proximosAtendimentos.length} ainda em aberto</p>
        </div>

        <div className="card card-dashboard">
          <span>Pacotes ativos</span>
          <strong>{pacotesAtivos.length}</strong>
          <p>{pacotesBaixos.length} com saldo baixo</p>
        </div>

        <div className="card card-dashboard">
          <span>Receitas do mês</span>
          <strong>{formatarMoeda(totaisMes.receitas)}</strong>
          <p>Pacotes e atendimentos avulsos</p>
        </div>
      </div>

      <div className="painel-duplo painel-dashboard">
        <div className="bloco bloco-dashboard">
          <div className="cabecalho-bloco-dashboard">
            <div>
              <h2>Próximos atendimentos</h2>
              <p>Agenda de hoje em ordem de horário.</p>
            </div>
            <button className="botao-acao-secundario" onClick={() => onNavigate("atendimento")}>Ver atendimento</button>
          </div>

          <div className="lista-dashboard">
            {proximosAtendimentos.length === 0 && (
              <div className="item-dashboard-vazio">Nenhum atendimento pendente para hoje.</div>
            )}

            {proximosAtendimentos.slice(0, 5).map((agendamento) => (
              <div className="item-dashboard" key={agendamento.id}>
                <div>
                  <strong>{agendamento.hora} - {agendamento.clienteNome}</strong>
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
