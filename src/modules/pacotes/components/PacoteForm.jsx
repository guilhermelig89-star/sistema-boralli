import { useMemo, useState } from "react";

const pacoteInicial = {
  clienteId: "",
  comboId: "",
  nome: "",
  alertaSaldoMinimo: "1",
  valorPago: "",
  formaPagamento: "",
  observacoes: "",
};

function PacoteForm({ clientes, combos, onSalvar }) {
  const [formulario, setFormulario] = useState(pacoteInicial);

  const clienteSelecionado = useMemo(
    () => clientes.find((cliente) => cliente.id === formulario.clienteId),
    [clientes, formulario.clienteId]
  );

  const comboSelecionado = useMemo(
    () => combos.find((combo) => combo.id === formulario.comboId),
    [combos, formulario.comboId]
  );

  function alterarCampo(campo, valor) {
    setFormulario((atual) => {
      if (campo !== "comboId") {
        return {
          ...atual,
          [campo]: valor,
        };
      }

      const novoCombo = combos.find((combo) => combo.id === valor);

      return {
        ...atual,
        comboId: valor,
        nome: novoCombo?.nome || "",
        valorPago: novoCombo?.valor ?? "",
      };
    });
  }

  async function salvar(e) {
    e.preventDefault();

    await onSalvar({
      ...formulario,
      clienteNome: clienteSelecionado?.nome || "",
      comboNome: comboSelecionado?.nome || "",
      itens: comboSelecionado?.itens || [],
    });

    setFormulario(pacoteInicial);
  }

  return (
    <form className="form-cliente" onSubmit={salvar}>
      <h2>Vender pacote para cliente</h2>

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
        value={formulario.comboId}
        onChange={(e) => alterarCampo("comboId", e.target.value)}
      >
        <option value="">Selecione o combo</option>
        {combos.map((combo) => (
          <option key={combo.id} value={combo.id}>
            {combo.nome}
          </option>
        ))}
      </select>

      <input
        placeholder="Nome do pacote"
        value={formulario.nome}
        onChange={(e) => alterarCampo("nome", e.target.value)}
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

      {comboSelecionado && (
        <div className="resumo-combo">
          {(comboSelecionado.itens || []).map((item) => (
            <span key={item.servicoId}>
              {item.quantidade}x {item.servicoNome}
            </span>
          ))}
        </div>
      )}

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
