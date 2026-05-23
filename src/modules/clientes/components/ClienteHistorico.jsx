import { useEffect, useRef, useState } from "react";
import { consumoEstaAtivo } from "../../pacotes/domain/consumoHistoricoDomain";

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

function statusPacote(pacote, historicoAtivoDoPacote = []) {
  const total = Number(pacote.quantidadeTotal || 0);
  const usados = (Array.isArray(historicoAtivoDoPacote) ? historicoAtivoDoPacote : []).reduce(
    (acc, item) => acc + Math.max(1, Number(item?.quantidadeConsumida || 1)),
    0
  );
  const saldo = Math.max(0, total - usados);
  if (saldo <= 0 || pacote.status === "esgotado") return "Finalizado";
  return `${saldo} restante`;
}

function resumoUsoPacote(pacote, historicoAtivoDoPacote = []) {
  const total = Number(pacote.quantidadeTotal || 0);
  const historicoSeguro = Array.isArray(historicoAtivoDoPacote) ? historicoAtivoDoPacote : [];
  const usados = historicoSeguro.reduce((acc, item) => acc + Math.max(1, Number(item?.quantidadeConsumida || 1)), 0);
  const saldo = Math.max(0, total - usados);
  return `${usados}/${total} serviços usados • ${saldo} restante`;
}

function ClienteHistorico({
  cliente,
  agendamentos,
  pacotes,
  historicoPacotes,
  movimentos,
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

  const agendamentosSeguro = Array.isArray(agendamentos) ? agendamentos : [];
  const pacotesSeguro = Array.isArray(pacotes) ? pacotes : [];
  const historicoPacotesSeguro = Array.isArray(historicoPacotes) ? historicoPacotes : [];
  const movimentosSeguro = Array.isArray(movimentos) ? movimentos : [];

  const hoje = new Date().toISOString().slice(0, 10);
  const agendamentosCliente = agendamentosSeguro
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
  const pacotesCliente = pacotesSeguro.filter((item) => item.clienteId === cliente.id);
  const pacotesPorId = pacotesCliente.reduce((acc, pacote) => {
    acc[pacote.id] = pacote;
    return acc;
  }, {});
  const historicoCliente = historicoPacotesSeguro
    .filter((item) => item.clienteId === cliente.id)
    .slice();
  const historicoClienteAtivo = historicoCliente.filter(consumoEstaAtivo);
  const historicoAtivoPorPacote = historicoClienteAtivo.reduce((acc, item) => {
    if (!item.pacoteClienteId) return acc;
    if (!acc[item.pacoteClienteId]) acc[item.pacoteClienteId] = [];
    acc[item.pacoteClienteId].push(item);
    return acc;
  }, {});
  const historicoClienteEstornado = historicoCliente.filter((item) => !consumoEstaAtivo(item));
  const pacotesAtivos = pacotesCliente.filter((pacote) => statusPacote(pacote, historicoAtivoPorPacote[pacote.id] || []) !== "Finalizado");
  const pacotesFinalizados = pacotesCliente.filter((pacote) => statusPacote(pacote, historicoAtivoPorPacote[pacote.id] || []) === "Finalizado");
  const historicoClienteAtivoOrdenado = historicoClienteAtivo.slice().reverse();
  const ultimosUsosPacote = historicoClienteAtivoOrdenado.slice(0, 6).map((item) => {
    const usosDoPacote = historicoClienteAtivoOrdenado.filter((consumo) => consumo.pacoteClienteId === item.pacoteClienteId);
    const numeroUso = usosDoPacote.findIndex((consumo) => consumo.id === item.id) + 1;
    const totalPacote = Number(pacotesPorId[item.pacoteClienteId]?.quantidadeTotal || item.saldoAntes || 0);

    return {
      ...item,
      numeroUso,
      totalPacote,
    };
  });
  const movimentosCliente = movimentosSeguro
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
                <span>{resumoUsoPacote(pacote, historicoAtivoPorPacote[pacote.id] || [])}</span>
              </div>
            ))}
          </div>

          <div className="bloco-historico-cliente">
            <h3>Pacotes finalizados</h3>
            {pacotesFinalizados.length === 0 && <p>Nenhum pacote finalizado.</p>}
            {pacotesFinalizados.map((pacote) => (
              <div className="item-historico-cliente" key={pacote.id}>
                <strong>{pacote.nome}</strong>
                <span>{statusPacote(pacote, historicoAtivoPorPacote[pacote.id] || [])}</span>
              </div>
            ))}
          </div>

          <div className="bloco-historico-cliente bloco-historico-largo">
            <h3>Últimos usos ativos de pacote</h3>
            {ultimosUsosPacote.length === 0 && <p>Nenhum consumo de pacote registrado.</p>}
            {ultimosUsosPacote.map((item) => (
              <div className="item-historico-cliente" key={item.id}>
                <strong>{item.servicoNome}</strong>
                <span>{item.pacoteNome} • Uso {item.numeroUso} de {item.totalPacote} (restam {item.saldoDepois})</span>
              </div>
            ))}
          </div>

          <div className="bloco-historico-cliente bloco-historico-largo">
            <h3>Auditoria de estornos/cancelamentos</h3>
            {historicoClienteEstornado.length === 0 && <p>Nenhum estorno/cancelamento encontrado.</p>}
            {historicoClienteEstornado.map((item) => (
              <div className="item-historico-cliente" key={item.id}>
                <strong>{item.servicoNome || "Consumo sem serviço"}</strong>
                <span>
                  {item.pacoteNome || "Pacote"} • {item.status || (item.estornado ? "estornado" : "cancelado")}
                </span>
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
