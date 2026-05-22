import { useEffect, useRef, useState } from "react";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataHora(item) {
  if (item.data) {
    return `${item.data}${item.hora ? ` ${item.hora}` : ""}`;
  }

  if (item.criadoEm?.toDate) {
    return item.criadoEm.toDate().toLocaleDateString("pt-BR");
  }

  return "-";
}

function chaveDataHora(item) {
  return `${item.data || ""} ${item.hora || ""}`;
}

function statusTexto(status) {
  if (status === "em_atendimento") return "em atendimento";
  if (status === "finalizado") return "finalizado";
  if (status === "cancelado") return "cancelado";
  return "agendado";
}

function statusPacote(pacote, calcularSaldoPacote) {
  const saldo = calcularSaldoPacote(pacote);
  if (saldo <= 0 || pacote.status === "esgotado") return "Finalizado";
  return `${saldo} restante`;
}

function resumoUsoPacote(pacote, calcularSaldoPacote) {
  const total = Number(pacote.quantidadeTotal || 0);
  const saldo = calcularSaldoPacote(pacote);
  const usados = Math.max(0, total - saldo);
  return `${usados}/${total} serviços usados • ${saldo} restante`;
}

function ClienteHistorico({
  cliente,
  agendamentos,
  pacotes,
  historicoPacotes,
  movimentos,
  calcularSaldoPacote,
  onFechar,
}) {
  const [abaAtual, setAbaAtual] = useState(null);
  const abasRef = useRef(null);

  useEffect(() => {
    function aoClicarFora(evento) {
      if (!abasRef.current?.contains(evento.target)) {
        setAbaAtual(null);
      }
    }

    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  if (!cliente) return null;

  const hoje = new Date().toISOString().slice(0, 10);
  const agendamentosCliente = agendamentos
    .filter((item) => item.clienteId === cliente.id)
    .sort((a, b) => chaveDataHora(a).localeCompare(chaveDataHora(b)));
  const proximosAgendamentos = agendamentosCliente
    .filter((item) => item.data >= hoje && item.status !== "finalizado" && item.status !== "cancelado")
    .slice(0, 5);
  const ultimosAtendimentos = agendamentosCliente
    .filter((item) => item.status === "finalizado" || item.status === "cancelado")
    .slice()
    .reverse()
    .slice(0, 5);
  const pacotesCliente = pacotes.filter((item) => item.clienteId === cliente.id);
  const pacotesAtivos = pacotesCliente.filter((pacote) => calcularSaldoPacote(pacote) > 0 && pacote.status !== "esgotado");
  const pacotesFinalizados = pacotesCliente.filter((pacote) => calcularSaldoPacote(pacote) <= 0 || pacote.status === "esgotado");
  const historicoCliente = historicoPacotes
    .filter((item) => item.clienteId === cliente.id)
    .slice()
    .reverse()
    .slice(0, 6);
  const movimentosCliente = movimentos
    .filter((item) => item.clienteId === cliente.id)
    .slice(0, 8);
  const totalRecebido = movimentosCliente.reduce((total, movimento) => {
    if ((movimento.status || "confirmado") !== "confirmado") return total;
    if (movimento.tipo !== "receita") return total;
    return total + Number(movimento.valor || 0);
  }, 0);

  return (
    <section className="overlay-historico-cliente" role="dialog" aria-modal="true" aria-label={`Histórico de ${cliente.nome}`}>
      <div className="lista-clientes historico-cliente">
      <div className="topo-historico-cliente">
        <div>
          <h2>Histórico da cliente</h2>
          <p>{cliente.nome}</p>
        </div>
        <button type="button" onClick={onFechar}>Fechar</button>
      </div>

      <div className="abas-historico-cliente" role="tablist" aria-label="Histórico da cliente" ref={abasRef}>
        <button
          type="button"
          className={abaAtual === "agenda" ? "ativo" : ""}
          onClick={() => setAbaAtual((atual) => (atual === "agenda" ? null : "agenda"))}
        >
          Agenda
        </button>
        <button
          type="button"
          className={abaAtual === "pacotes" ? "ativo" : ""}
          onClick={() => setAbaAtual((atual) => (atual === "pacotes" ? null : "pacotes"))}
        >
          Pacotes
        </button>
        <button
          type="button"
          className={abaAtual === "financeiro" ? "ativo" : ""}
          onClick={() => setAbaAtual((atual) => (atual === "financeiro" ? null : "financeiro"))}
        >
          Financeiro
        </button>
      </div>

      {abaAtual === "agenda" && (
        <div className="grade-historico-cliente">
          <div className="bloco-historico-cliente">
            <h3>Próximos agendamentos</h3>
            {proximosAgendamentos.length === 0 && <p>Nenhum agendamento futuro encontrado.</p>}
            {proximosAgendamentos.map((agendamento) => (
              <div className="item-historico-cliente" key={agendamento.id}>
                <strong>{agendamento.servicoNome || "Atendimento"}</strong>
                <span>{formatarDataHora(agendamento)} - {statusTexto(agendamento.status)}</span>
              </div>
            ))}
          </div>

          <div className="bloco-historico-cliente">
            <h3>Últimos atendimentos</h3>
            {ultimosAtendimentos.length === 0 && <p>Nenhum atendimento finalizado ou cancelado.</p>}
            {ultimosAtendimentos.map((agendamento) => (
              <div className="item-historico-cliente" key={agendamento.id}>
                <strong>{agendamento.servicoNome || "Atendimento"}</strong>
                <span>{formatarDataHora(agendamento)} - {statusTexto(agendamento.status)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {abaAtual === "pacotes" && (
        <div className="grade-historico-cliente">
          <div className="bloco-historico-cliente">
            <h3>Pacotes ativos</h3>
            {pacotesAtivos.length === 0 && <p>Nenhum pacote ativo para esta cliente.</p>}
            {pacotesAtivos.map((pacote) => (
              <div className="item-historico-cliente" key={pacote.id}>
                <strong>{pacote.nome}</strong>
                <span>{resumoUsoPacote(pacote, calcularSaldoPacote)}</span>
              </div>
            ))}
          </div>

          <div className="bloco-historico-cliente">
            <h3>Pacotes finalizados</h3>
            {pacotesFinalizados.length === 0 && <p>Nenhum pacote finalizado.</p>}
            {pacotesFinalizados.map((pacote) => (
              <div className="item-historico-cliente" key={pacote.id}>
                <strong>{pacote.nome}</strong>
                <span>{statusPacote(pacote, calcularSaldoPacote)}</span>
              </div>
            ))}
          </div>

          <div className="bloco-historico-cliente bloco-historico-largo">
            <h3>Últimos usos de pacote</h3>
            {historicoCliente.length === 0 && <p>Nenhum consumo de pacote registrado.</p>}
            {historicoCliente.map((item) => (
              <div className="item-historico-cliente" key={item.id}>
                <strong>{item.servicoNome}</strong>
                <span>{item.pacoteNome} • Uso {item.saldoDepois + 1} de {item.saldoAntes + 1} (restam {item.saldoDepois})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {abaAtual === "financeiro" && (
        <div className="grade-historico-cliente">
          <div className="bloco-historico-cliente">
            <h3>Resumo financeiro</h3>
            <div className="resumo-historico-cliente">
              <span>{formatarMoeda(totalRecebido)} recebido</span>
              <span>{movimentosCliente.length} movimentos</span>
            </div>
          </div>

          <div className="bloco-historico-cliente">
            <h3>Últimos movimentos</h3>
            {movimentosCliente.length === 0 && <p>Nenhum movimento financeiro encontrado.</p>}
            {movimentosCliente.map((movimento) => (
              <div className="item-historico-cliente" key={movimento.id}>
                <strong>{formatarMoeda(movimento.valor)}</strong>
                <span>{movimento.descricao || movimento.origem || "Movimento"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </section>
  );
}

export default ClienteHistorico;
