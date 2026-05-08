import { useMemo, useState } from "react";

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

function AgendamentoForm({ clientes, servicos, pacotesAtivos, calcularSaldoPacote, pacoteEstaAcabando, onSalvar }) {
  const [formulario, setFormulario] = useState(agendamentoInicial);

  const clienteSelecionado = useMemo(
    () => clientes.find((cliente) => cliente.id === formulario.clienteId),
    [clientes, formulario.clienteId]
  );

  const servicoSelecionado = useMemo(
    () => servicos.find((servico) => servico.id === formulario.servicoId),
    [servicos, formulario.servicoId]
  );

  const pacotesDisponiveis = useMemo(
    () =>
      pacotesAtivos.filter(
        (pacote) =>
          pacote.clienteId === formulario.clienteId &&
          pacote.servicoId === formulario.servicoId &&
          calcularSaldoPacote(pacote) > 0
      ),
    [pacotesAtivos, formulario.clienteId, formulario.servicoId, calcularSaldoPacote]
  );

  const pacoteSelecionado = useMemo(
    () => pacotesDisponiveis.find((pacote) => pacote.id === formulario.pacoteClienteId),
    [pacotesDisponiveis, formulario.pacoteClienteId]
  );

  function alterarCampo(campo, valor) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
      ...(campo === "clienteId" || campo === "servicoId" ? { pacoteClienteId: "" } : {}),
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
            {pacote.nome} - saldo {calcularSaldoPacote(pacote)}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={formulario.data}
        onChange={(e) => alterarCampo("data", e.target.value)}
      />

      <input
        type="time"
        value={formulario.hora}
        onChange={(e) => alterarCampo("hora", e.target.value)}
      />

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
          <span>O horário precisa caber dentro do expediente cadastrado.</span>
        </div>
      )}

      {pacoteSelecionado && (
        <div className="aviso-pacote">
          <strong>Saldo do pacote: {calcularSaldoPacote(pacoteSelecionado)}</strong>
          {pacoteEstaAcabando(pacoteSelecionado) && <span>Este pacote está acabando.</span>}
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
