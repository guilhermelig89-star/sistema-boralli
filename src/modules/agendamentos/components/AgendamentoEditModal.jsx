import { useMemo, useState } from "react";

function horaParaMinutos(hora) {
  const [h, m] = String(hora || "").split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function minutosParaHora(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function AgendamentoEditModal({
  agendamento,
  clientes,
  servicos,
  pacotesAtivos,
  calcularSaldoServicoPacote,
  pacoteTemSaldoParaServico,
  onSalvar,
  onCancelar,
  onExcluir,
}) {
  const [formulario, setFormulario] = useState({
    ...agendamento,
    desconto: agendamento.desconto || 0,
    statusFinanceiro: agendamento.statusFinanceiro || "pendente",
    formaPagamento: agendamento.pacoteClienteId ? "pacote" : "avulso",
  });

  const pacotesDisponiveis = useMemo(
    () =>
      (pacotesAtivos || []).filter(
        (pacote) =>
          pacote.clienteId === formulario.clienteId &&
          pacoteTemSaldoParaServico?.(pacote, formulario.servicoId)
      ),
    [pacotesAtivos, formulario.clienteId, formulario.servicoId, pacoteTemSaldoParaServico]
  );

  const pacoteSelecionado = useMemo(
    () => pacotesDisponiveis.find((pacote) => pacote.id === formulario.pacoteClienteId),
    [pacotesDisponiveis, formulario.pacoteClienteId]
  );

  const saldoServicoSelecionado = pacoteSelecionado
    ? calcularSaldoServicoPacote?.(pacoteSelecionado, formulario.servicoId) || 0
    : 0;


  function alterarCampo(campo, valor) {
    setFormulario((atual) => {
      if (campo === "hora") {
        const inicio = horaParaMinutos(valor);
        const duracao = Number(atual.servicoDuracaoMinutos) || 0;
        return {
          ...atual,
          hora: valor,
          horaFim: inicio !== null ? minutosParaHora(inicio + duracao) : atual.horaFim,
        };
      }

      if (campo === "formaPagamento") {
        if (valor === "pacote") {
          return { ...atual, formaPagamento: "pacote" };
        }

        return {
          ...atual,
          formaPagamento: valor,
          pacoteClienteId: "",
          pacoteNome: "",
          valor: Number(atual.valor || 0),
        };
      }

      if (campo === "pacoteClienteId") {
        const pacote = pacotesDisponiveis.find((item) => item.id === valor);
        return {
          ...atual,
          pacoteClienteId: valor,
          pacoteNome: pacote?.nome || "",
          formaPagamento: valor ? "pacote" : "avulso",
          valor: valor ? 0 : Number(atual.valor || 0),
        };
      }

      if (campo === "clienteId" || campo === "servicoId") {
        return {
          ...atual,
          [campo]: valor,
          ...(atual.formaPagamento === "pacote" ? { pacoteClienteId: "", pacoteNome: "" } : {}),
        };
      }

      return { ...atual, [campo]: valor };
    });
  }

  function alterarDuracao(valor) {
    const duracao = Number(valor) || 0;
    setFormulario((atual) => {
      const inicio = horaParaMinutos(atual.hora);
      return {
        ...atual,
        servicoDuracaoMinutos: duracao,
        tempoPrevistoMinutos: duracao,
        horaFim: inicio !== null ? minutosParaHora(inicio + duracao) : atual.horaFim,
      };
    });
  }

  function alterarHoraFim(valor) {
    setFormulario((atual) => {
      const inicio = horaParaMinutos(atual.hora);
      const fim = horaParaMinutos(valor);
      const duracao = inicio !== null && fim !== null && fim > inicio ? fim - inicio : atual.servicoDuracaoMinutos;
      return { ...atual, horaFim: valor, servicoDuracaoMinutos: duracao, tempoPrevistoMinutos: duracao };
    });
  }

  function trocarServico(servicoId) {
    const servico = servicos.find((item) => item.id === servicoId);
    setFormulario((atual) => ({
      ...atual,
      servicoId,
      servicoNome: servico?.nome || "",
      servicoDuracaoMinutos: servico?.duracaoMinutos || atual.servicoDuracaoMinutos,
      tempoPrevistoMinutos: servico?.duracaoMinutos || atual.tempoPrevistoMinutos,
      valor: Number(servico?.valor ?? atual.valor ?? 0),
    }));
  }

  async function salvar(e) {
    e.preventDefault();
    const dadosSalvar = {
      ...formulario,
      pacoteClienteId: formulario.formaPagamento === "pacote" ? formulario.pacoteClienteId || "" : "",
      pacoteNome: formulario.formaPagamento === "pacote" ? formulario.pacoteNome || "" : "",
      valor: formulario.formaPagamento === "pacote" ? 0 : Number(formulario.valor || 0),
    };

    if (dadosSalvar.formaPagamento === "pacote" && !dadosSalvar.pacoteClienteId) {
      alert("Selecione um pacote da cliente para vincular este atendimento.");
      return;
    }

    if (dadosSalvar.formaPagamento === "pacote" && saldoServicoSelecionado <= 0) {
      alert("O pacote selecionado não possui saldo para este serviço.");
      return;
    }

    await onSalvar(dadosSalvar);
  }

  return (
    <div className="modal-tempo-backdrop" role="presentation">
      <section className="modal-tempo modal-tempo-leve" role="dialog" aria-modal="true">
        <div className="modal-tempo-topo"><h2>Editar agendamento</h2></div>
        <form className="form-cliente form-edicao-agendamento" onSubmit={salvar}>
          <select value={formulario.clienteId} onChange={(e) => alterarCampo("clienteId", e.target.value)}>
            {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
          </select>
          <select value={formulario.servicoId} onChange={(e) => trocarServico(e.target.value)}>
            {servicos.map((servico) => <option key={servico.id} value={servico.id}>{servico.nome}</option>)}
          </select>
          <input type="date" value={formulario.data || ""} onChange={(e) => alterarCampo("data", e.target.value)} />
          <input type="time" value={formulario.hora || ""} onChange={(e) => alterarCampo("hora", e.target.value)} />
          <input type="number" value={formulario.servicoDuracaoMinutos || 0} onChange={(e) => alterarDuracao(e.target.value)} placeholder="Duração prevista (min)" />
          <input type="time" value={formulario.horaFim || ""} onChange={(e) => alterarHoraFim(e.target.value)} placeholder="Horário de término" />
          <input type="number" value={formulario.valor || 0} onChange={(e) => alterarCampo("valor", Number(e.target.value))} placeholder="Valor" />
          <input type="number" value={formulario.desconto || 0} onChange={(e) => alterarCampo("desconto", Number(e.target.value))} placeholder="Desconto" />
          <select value={formulario.status || "agendado"} onChange={(e) => alterarCampo("status", e.target.value)}>
            <option value="agendado">Agendado</option><option value="confirmado">Confirmado</option><option value="em_atendimento">Em atendimento</option><option value="finalizado">Finalizado</option><option value="cancelado">Cancelado</option>
          </select>
          <select value={formulario.formaPagamento || "avulso"} onChange={(e) => alterarCampo("formaPagamento", e.target.value)}>
            <option value="avulso">Avulso</option>
            <option value="pacote">Pacote</option>
          </select>
          {formulario.formaPagamento === "pacote" && (
            <>
              <select value={formulario.pacoteClienteId || ""} onChange={(e) => alterarCampo("pacoteClienteId", e.target.value)}>
                <option value="">Selecione o pacote da cliente</option>
                {pacotesDisponiveis.map((pacote) => (
                  <option key={pacote.id} value={pacote.id}>
                    {pacote.nome}
                  </option>
                ))}
              </select>
              <small>Saldo restante para o serviço: {saldoServicoSelecionado}</small>
            </>
          )}
          {formulario.formaPagamento === "avulso" && (
            <select value={formulario.statusFinanceiro || "pendente"} onChange={(e) => alterarCampo("statusFinanceiro", e.target.value)}>
              <option value="pendente">Pendente</option><option value="parcial">Parcial</option><option value="pago">Pago</option>
            </select>
          )}
          <textarea placeholder="Observação" value={formulario.observacoes || ""} onChange={(e) => alterarCampo("observacoes", e.target.value)} />

          <div className="modal-acoes-edicao">
            <button type="submit" className="botao-tempo-cliente">Salvar alterações</button>
            <button type="button" className="botao-tempo-neutro" onClick={onCancelar}>Cancelar edição</button>
            <button type="button" className="botao-desativar" onClick={onExcluir}>Excluir agendamento</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AgendamentoEditModal;
