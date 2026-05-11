import { useState } from "react";

function AgendamentoEditModal({ agendamento, clientes, servicos, onSalvar, onCancelar, onExcluir }) {
  const [formulario, setFormulario] = useState({
    ...agendamento,
    desconto: agendamento.desconto || 0,
    statusFinanceiro: agendamento.statusFinanceiro || "pendente",
  });


  function alterarCampo(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
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
    await onSalvar(formulario);
  }

  return (
    <div className="modal-tempo-backdrop" role="presentation">
      <section className="modal-tempo modal-tempo-leve" role="dialog" aria-modal="true">
        <div className="modal-tempo-topo"><h2>Editar agendamento</h2></div>
        <form className="form-cliente" onSubmit={salvar}>
          <select value={formulario.clienteId} onChange={(e) => alterarCampo("clienteId", e.target.value)}>
            {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
          </select>
          <select value={formulario.servicoId} onChange={(e) => trocarServico(e.target.value)}>
            {servicos.map((servico) => <option key={servico.id} value={servico.id}>{servico.nome}</option>)}
          </select>
          <input type="date" value={formulario.data || ""} onChange={(e) => alterarCampo("data", e.target.value)} />
          <input type="time" value={formulario.hora || ""} onChange={(e) => alterarCampo("hora", e.target.value)} />
          <input type="number" value={formulario.servicoDuracaoMinutos || 0} onChange={(e) => alterarCampo("servicoDuracaoMinutos", Number(e.target.value))} placeholder="Duração (min)" />
          <input type="number" value={formulario.valor || 0} onChange={(e) => alterarCampo("valor", Number(e.target.value))} placeholder="Valor" />
          <input type="number" value={formulario.desconto || 0} onChange={(e) => alterarCampo("desconto", Number(e.target.value))} placeholder="Desconto" />
          <select value={formulario.status || "agendado"} onChange={(e) => alterarCampo("status", e.target.value)}>
            <option value="agendado">Agendado</option><option value="confirmado">Confirmado</option><option value="em_atendimento">Em atendimento</option><option value="finalizado">Finalizado</option><option value="cancelado">Cancelado</option>
          </select>
          <input placeholder="Forma de pagamento" value={formulario.formaPagamento || ""} onChange={(e) => alterarCampo("formaPagamento", e.target.value)} />
          <select value={formulario.statusFinanceiro || "pendente"} onChange={(e) => alterarCampo("statusFinanceiro", e.target.value)}>
            <option value="pendente">Pendente</option><option value="parcial">Parcial</option><option value="pago">Pago</option>
          </select>
          <textarea placeholder="Observação" value={formulario.observacoes || ""} onChange={(e) => alterarCampo("observacoes", e.target.value)} />

          <div className="modal-tempo-acoes">
            <button type="submit">Salvar alterações</button>
            <button type="button" className="botao-tempo-neutro" onClick={onCancelar}>Cancelar edição</button>
            <button type="button" className="botao-desativar" onClick={onExcluir}>Excluir agendamento</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AgendamentoEditModal;
