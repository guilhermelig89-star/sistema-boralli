import { useEffect, useRef, useState } from "react";
import { consumoEstaAtivo } from "../../pacotes/domain/consumoHistoricoDomain";
import { pacoteEstaFinalizado } from "../../pacotes/domain/pacotesDomain";

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

function iconeServico(nome = "") {
  const nomeNormalizado = nome.toLowerCase();
  if (nomeNormalizado.includes("pé") || nomeNormalizado.includes("pe ") || nomeNormalizado.includes("pedicure")) return "🦶";
  if (nomeNormalizado.includes("mão") || nomeNormalizado.includes("mao") || nomeNormalizado.includes("manicure")) return "💅";
  return "✨";
}

function limitarNumero(valor, minimo, maximo) {
  const convertido = Number(valor);
  const numeroSeguro = Number.isFinite(convertido) ? convertido : minimo;
  return Math.min(maximo, Math.max(minimo, numeroSeguro));
}

function obterItensSaldoCombo(pacote = {}) {
  if (Array.isArray(pacote.itens) && pacote.itens.length > 0) {
    return pacote.itens.map((item) => {
      const total = Math.max(0, Number(item.quantidadeTotal ?? item.quantidade ?? 0));
      const utilizado = limitarNumero(item.quantidadeUtilizada, 0, total);

      return {
        id: item.servicoId || item.servicoNome,
        nome: item.servicoNome || "Serviço",
        total,
        utilizado,
        restante: Math.max(0, total - utilizado),
      };
    });
  }

  const total = Math.max(0, Number(pacote.quantidadeTotal || 0));
  const utilizado = limitarNumero(pacote.quantidadeUtilizada, 0, total);

  return [
    {
      id: pacote.servicoId || pacote.nome,
      nome: pacote.servicoNome || pacote.nome || "Serviço",
      total,
      utilizado,
      restante: Math.max(0, total - utilizado),
    },
  ];
}

function QuadradinhosSaldo({ item }) {
  return (
    <div className="quadradinhos-saldo-combo" aria-label={`${item.utilizado} utilizado, ${item.restante} disponível`}>
      {Array.from({ length: item.total }).map((_, indice) => (
        <span
          className={indice < item.utilizado ? "quadradinho-combo quadradinho-combo-usado" : "quadradinho-combo quadradinho-combo-disponivel"}
          key={`${item.id}-${indice}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function CardSaldoCombo({ pacote }) {
  const itens = obterItensSaldoCombo(pacote);
  const finalizado = itens.every((item) => item.restante <= 0);

  return (
    <article className={`card-saldo-combo ${finalizado ? "card-saldo-combo-finalizado" : ""}`}>
      <header className="cabecalho-card-saldo-combo">
        <span aria-hidden="true">📦</span>
        <strong>{pacote.nome}</strong>
      </header>

      <div className="servicos-saldo-combo">
        {itens.map((item) => (
          <section className="servico-saldo-combo" key={item.id}>
            <div className="nome-servico-saldo-combo">
              <span aria-hidden="true">{iconeServico(item.nome)}</span>
              <strong>{item.nome}</strong>
            </div>
            <QuadradinhosSaldo item={item} />
            <strong className={item.restante <= 0 ? "restante-combo restante-combo-finalizado" : "restante-combo"}>
              {item.restante <= 0 ? "Finalizado" : `Restante: ${item.restante}`}
            </strong>
          </section>
        ))}
      </div>
    </article>
  );
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
  const historicoClienteEstornado = historicoCliente.filter((item) => !consumoEstaAtivo(item));
  const pacotesAtivos = pacotesCliente.filter((pacote) => !pacoteEstaFinalizado(pacote));
  const pacotesFinalizados = pacotesCliente.filter((pacote) => pacoteEstaFinalizado(pacote));
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
          <div className="bloco-historico-cliente bloco-historico-largo bloco-combos-cliente">
            <h3>Combos ativos</h3>
            {pacotesAtivos.length === 0 && <p>Nenhum combo ativo para esta cliente.</p>}
            <div className="grade-saldo-combos">
              {pacotesAtivos.map((pacote) => (
                <CardSaldoCombo pacote={pacote} key={pacote.id} />
              ))}
            </div>
          </div>

          <div className="bloco-historico-cliente bloco-historico-largo bloco-combos-cliente">
            <h3>Combos finalizados</h3>
            {pacotesFinalizados.length === 0 && <p>Nenhum combo finalizado.</p>}
            <div className="grade-saldo-combos">
              {pacotesFinalizados.map((pacote) => (
                <CardSaldoCombo pacote={pacote} key={pacote.id} />
              ))}
            </div>
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
