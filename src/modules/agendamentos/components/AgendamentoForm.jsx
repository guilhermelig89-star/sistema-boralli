import { useMemo, useState } from "react";

import { sugerirHorariosInteligentes } from "../services/agendamentosService";
import { calcularSugestaoDuracao } from "../services/tempoAtendimentoService";

const agendamentoInicial = {
  clienteId: "",
  servicoId: "",
  pacoteClienteId: "",
  data: "",
  hora: "",
  valor: "",
  formaPagamento: "avulso",
  observacoes: "",
};

function AgendamentoForm({
  clientes,
  servicos,
  pacotesAtivos,
  agendamentos,
  horarios,
  excecoes,
  sugestoesTempo,
  calcularSaldoServicoPacote,
  pacoteTemSaldoParaServico,
  onSalvar,
}) {
  const [formulario, setFormulario] = useState(agendamentoInicial);

  const clienteSelecionado = useMemo(
    () => clientes.find((cliente) => cliente.id === formulario.clienteId),
    [clientes, formulario.clienteId]
  );

  const servicoSelecionado = useMemo(
    () => servicos.find((servico) => servico.id === formulario.servicoId),
    [servicos, formulario.servicoId]
  );

  const sugestaoDuracao = useMemo(
    () =>
      calcularSugestaoDuracao({
        clienteId: formulario.clienteId,
        servico: servicoSelecionado,
        agendamentos,
        sugestoesTempo,
      }),
    [agendamentos, formulario.clienteId, servicoSelecionado, sugestoesTempo]
  );

  const sugestoesHorario = useMemo(
    () =>
      sugerirHorariosInteligentes({
        data: formulario.data,
        duracaoMinutos: sugestaoDuracao.duracaoMinutos,
        configuracaoAgenda: { horarios, excecoes },
        agendamentosExistentes: agendamentos,
      }),
    [formulario.data, sugestaoDuracao.duracaoMinutos, horarios, excecoes, agendamentos]
  );

  const pacotesDisponiveis = useMemo(
    () =>
      pacotesAtivos.filter(
        (pacote) =>
          pacote.clienteId === formulario.clienteId &&
          pacoteTemSaldoParaServico(pacote, formulario.servicoId)
      ),
    [pacotesAtivos, formulario.clienteId, formulario.servicoId, pacoteTemSaldoParaServico]
  );

  const pacoteSelecionado = useMemo(
    () => pacotesDisponiveis.find((pacote) => pacote.id === formulario.pacoteClienteId),
    [pacotesDisponiveis, formulario.pacoteClienteId]
  );

  const saldoServicoSelecionado = pacoteSelecionado
    ? calcularSaldoServicoPacote(pacoteSelecionado, formulario.servicoId)
    : 0;
  const pacoteServicoEstaAcabando =
    pacoteSelecionado &&
    saldoServicoSelecionado > 0 &&
    saldoServicoSelecionado <= Number(pacoteSelecionado.alertaSaldoMinimo || 1);
  const podeSugerirHorario = Boolean(formulario.data && formulario.servicoId);
  const temHorarioDisponivel = sugestoesHorario.recomendados.length > 0 || sugestoesHorario.outros.length > 0;

  function alterarCampo(campo, valor) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
      ...(campo === "clienteId" || campo === "servicoId" ? { pacoteClienteId: "" } : {}),
      ...(campo === "servicoId" || campo === "data" ? { hora: "" } : {}),
    }));
  }

  function escolherHorario(hora) {
    alterarCampo("hora", hora);
  }

  async function salvar(e) {
    e.preventDefault();

    await onSalvar({
      ...formulario,
      clienteNome: clienteSelecionado?.nome || "",
      servicoNome: servicoSelecionado?.nome || "",
      servicoDuracaoMinutos: sugestaoDuracao.duracaoMinutos,
      tempoPrevistoMinutos: sugestaoDuracao.duracaoMinutos,
      tempoSugeridoOrigem: sugestaoDuracao.origem,
      tempoSugeridoMensagem: sugestaoDuracao.mensagem,
      tempoSugeridoQuantidadeBase: sugestaoDuracao.quantidadeBase,
      pacoteNome: pacoteSelecionado?.nome || "",
      valor: formulario.pacoteClienteId ? 0 : formulario.valor || servicoSelecionado?.valor || 0,
    });

    setFormulario(agendamentoInicial);
  }

  return (
    <form className="form-cliente" onSubmit={salvar}>
      <h2>Novo agendamento</h2>

      <select value={formulario.clienteId} onChange={(e) => alterarCampo("clienteId", e.target.value)}>
        <option value="">Selecione o cliente</option>
        {clientes.map((cliente) => (
          <option key={cliente.id} value={cliente.id}>
            {cliente.nome}
          </option>
        ))}
      </select>

      <select value={formulario.servicoId} onChange={(e) => alterarCampo("servicoId", e.target.value)}>
        <option value="">Selecione o serviço</option>
        {servicos.map((servico) => (
          <option key={servico.id} value={servico.id}>
            {servico.nome} - {servico.duracaoMinutos || 60} min padrão
          </option>
        ))}
      </select>

      <select
        value={formulario.pacoteClienteId}
        onChange={(e) => alterarCampo("pacoteClienteId", e.target.value)}
      >
        <option value="">Pagamento avulso</option>
        {pacotesDisponiveis.map((pacote) => (
          <option key={pacote.id} value={pacote.id}>
            {pacote.nome} - saldo {calcularSaldoServicoPacote(pacote, formulario.servicoId)}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={formulario.data}
        onChange={(e) => alterarCampo("data", e.target.value)}
      />

      {servicoSelecionado && (
        <div className="sugestao-tempo-agendamento">
          <div>
            <span>Duração inteligente</span>
            <strong>{sugestaoDuracao.duracaoMinutos} min</strong>
          </div>
          <p>{sugestaoDuracao.mensagem}</p>
        </div>
      )}

      <div className="sugestoes-horario">
        <div className="topo-sugestoes-horario">
          <strong>Sugestões de horário</strong>
          {formulario.hora && <span>Selecionado: {formulario.hora}</span>}
        </div>

        {!podeSugerirHorario && (
          <p>Selecione o serviço e a data para ver os horários disponíveis.</p>
        )}

        {podeSugerirHorario && !temHorarioDisponivel && (
          <p>Nenhum horário disponível para esse serviço nesta data.</p>
        )}

        {sugestoesHorario.recomendados.length > 0 && (
          <div className="grupo-sugestoes-horario">
            <span>Melhores encaixes</span>
            <div className="botoes-horario">
              {sugestoesHorario.recomendados.map((sugestao) => (
                <button
                  type="button"
                  key={sugestao.hora}
                  className={formulario.hora === sugestao.hora ? "botao-horario ativo" : "botao-horario"}
                  onClick={() => escolherHorario(sugestao.hora)}
                >
                  <strong>{sugestao.hora}</strong>
                  <small>{sugestao.motivo}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {sugestoesHorario.outros.length > 0 && (
          <div className="grupo-sugestoes-horario">
            <span>Outros horários livres</span>
            <div className="botoes-horario compactos">
              {sugestoesHorario.outros.map((sugestao) => (
                <button
                  type="button"
                  key={sugestao.hora}
                  className={formulario.hora === sugestao.hora ? "botao-horario ativo" : "botao-horario"}
                  onClick={() => escolherHorario(sugestao.hora)}
                >
                  <strong>{sugestao.hora}</strong>
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="horario-manual">
          <span>Ou informar horário manualmente</span>
          <input
            type="time"
            value={formulario.hora}
            onChange={(e) => alterarCampo("hora", e.target.value)}
          />
        </label>
      </div>

      {!formulario.pacoteClienteId && (
        <input
          placeholder="Valor avulso"
          type="number"
          min="0"
          value={formulario.valor}
          onChange={(e) => alterarCampo("valor", e.target.value)}
        />
      )}

      {pacoteSelecionado && (
        <div className="aviso-pacote">
          <strong>Saldo para este serviço: {saldoServicoSelecionado}</strong>
          {pacoteServicoEstaAcabando && <span>Este saldo está acabando.</span>}
        </div>
      )}

      <textarea
        placeholder="Observações"
        value={formulario.observacoes}
        onChange={(e) => alterarCampo("observacoes", e.target.value)}
      />

      <button type="submit">Salvar agendamento</button>
    </form>
  );
}

export default AgendamentoForm;
