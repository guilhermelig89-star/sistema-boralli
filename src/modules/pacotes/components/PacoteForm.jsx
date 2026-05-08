import { useMemo, useState } from "react";

const pacoteInicial = {
  clienteId: "",
  servicoId: "",
  nome: "",
  quantidadeTotal: "4",
  alertaSaldoMinimo: "1",
  valorPago: "",
  formaPagamento: "",
  observacoes: "",
};

function PacoteForm({ clientes, servicos, onSalvar }) {
  const [formulario, setFormulario] = useState(pacoteInicial);

  const clienteSelecionado = useMemo(
    () => clientes.find((cliente) => cliente.id === formulario.clienteId),
    [clientes, formulario.clienteId]
  );

  const servicoSelecionado = useMemo(
    () => servicos.find((servico) => servico.id === formulario.servicoId),
    [servicos, formulario.servicoId]
  );

  function alterarCampo(campo, valor) {
    setFormulario((atual) => {
      if (campo !== "servicoId") {
        return {
          ...atual,
          [campo]: valor,
        };
      }

      const novoServico = servicos.find((servico) => servico.id === valor);

      return {
        ...atual,
        servicoId: valor,
        nome: atual.nome || novoServico?.nome || "",
        valorPago: atual.valorPago || novoServico?.valor || "",
      };
    });
  }

  async function salvar(e) {
    e.preventDefault();

    await onSalvar({
      ...formulario,
      clienteNome: clienteSelecionado?.nome || "",
      servicoNome: servicoSelecionado?.nome || "",
    });

    setFormulario(pacoteInicial);
  }

  return (
    <form className="form-cliente" onSubmit={salvar}>
      <h2>Novo pacote do cliente</h2>

      <select
        value={formulario.clienteId}
        onChange={(e) => alterarCampo("clienteId", e.target.value)}
      >
        <option value="">Selecione o cliente</option>
        {clientes.map((cliente) => (
          <option key={cliente.id} value={cliente.id}>
            {cliente.nome}
          </option>
        ))}
      </select>

      <select
        value={formulario.servicoId}
        onChange={(e) => alterarCampo("servicoId", e.target.value)}
      >
        <option value="">Selecione o serviço/combo</option>
        {servicos.map((servico) => (
          <option key={servico.id} value={servico.id}>
            {servico.nome} {servico.tipo === "combo" ? "(combo)" : ""}
          </option>
        ))}
      </select>

      <input
        placeholder="Nome do pacote"
        value={formulario.nome}
        onChange={(e) => alterarCampo("nome", e.target.value)}
      />

      <input
        placeholder="Quantidade total"
        type="number"
        min="1"
        value={formulario.quantidadeTotal}
        onChange={(e) => alterarCampo("quantidadeTotal", e.target.value)}
      />

      <input
        placeholder="Alerta de saldo mínimo"
        type="number"
        min="1"
        value={formulario.alertaSaldoMinimo}
        onChange={(e) => alterarCampo("alertaSaldoMinimo", e.target.value)}
      />

      <input
        placeholder="Valor pago"
        type="number"
        min="0"
        value={formulario.valorPago}
        onChange={(e) => alterarCampo("valorPago", e.target.value)}
      />

      <input
        placeholder="Forma de pagamento"
        value={formulario.formaPagamento}
        onChange={(e) => alterarCampo("formaPagamento", e.target.value)}
      />

      <textarea
        placeholder="Observações"
        value={formulario.observacoes}
        onChange={(e) => alterarCampo("observacoes", e.target.value)}
      />

      <button type="submit">Salvar pacote</button>
    </form>
  );
}

export default PacoteForm;
