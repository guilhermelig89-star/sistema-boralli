import { useMemo, useState } from "react";

import { gerarHorariosDisponiveis } from "../services/agendamentosService";

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

  const horariosDisponiveis = useMemo(
    () =>
      gerarHorariosDisponiveis({
        data: formulario.data,
        duracaoMinutos: servicoSelecionado?.duracaoMinutos || 60,
        configuracaoAgenda: { horarios, excecoes },
        agendamentosExistentes: agendamentos,
      }),
    [formulario.data, servicoSelecionado?.duracaoMinutos, horarios, excecoes, agendamentos]
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

  function alterarCampo(campo, valor) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
      ...(campo === "clienteId" || campo === "servicoId" ? { pacoteClienteId: "" } : {}),
      ...(campo === "servicoId" || campo === "data" ? { hora: "" } : {}),
    }));
  }

  async function salvar(e) {
    e.preventDefault();

    await onSalvar({
      ...formulario,
      clienteNome: clienteSelecionado?.nome || "",
      servicoNome: servicoSelecionado?.nome || "",
      servicoDuracaoMinutos: servicoSelecionado?.duracaoMinutos || 60,
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
            {servico.nome} - {servico.duracaoMinutos || 60} min
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

      <select
        value={formulario.hora}
        onChange={(e) => alterarCampo("hora", e.target.value)}
        disabled={!formulario.data || !formulario.servicoId || horariosDisponiveis.length === 0}
      >
        <option value="">
          {!formulario.data || !formulario.servicoId
            ? "Selecione data e serviço"
            : horariosDisponiveis.length === 0
              ? "Nenhum horário disponível"
              : "Selecione o horário"}
        </option>
        {horariosDisponiveis.map((hora) => (
          <option key={hora} value={hora}>
            {hora}
          </option>
        ))}
      </select>

      {!formulario.pacoteClienteId && (
        <input
          placeholder="Valor avulso"
          type="number"
          min="0"
          value={formulario.valor}
          onChange={(e) => alterarCampo("valor", e.target.value)}
        />
      )}

      {servicoSelecionado && (
        <div className="aviso-pacote">
          <strong>Duração do serviço: {servicoSelecionado.duracaoMinutos || 60} min</strong>
          <span>Somente horários livres dentro do expediente aparecem para seleção.</span>
        </div>
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
