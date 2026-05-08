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

const formasPagamento = [
  "Pix",
  "Dinheiro",
  "Cartão de débito",
  "Cartão de crédito",
  "Transferência",
  "Outro",
];

function descreverItensCombo(combo) {
  return (combo?.itens || [])
    .map((item) => `${item.quantidade}x ${item.servicoNome}`)
    .join(" + ");
}

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
        nome: novoCombo ? `Pacote ${novoCombo.nome}` : "",
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
    <form className="form-cliente form-pacote" onSubmit={salvar}>
      <div className="titulo-form-pacote">
        <h2>Nova venda de pacote</h2>
        <p>Escolha a cliente, selecione o combo vendido e confirme o pagamento recebido.</p>
      </div>

      <label className="campo-pacote">
        <span>Cliente</span>
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
      </label>

      <label className="campo-pacote campo-pacote-destaque">
        <span>Combo vendido</span>
        <select
          value={formulario.comboId}
          onChange={(e) => alterarCampo("comboId", e.target.value)}
        >
          <option value="">Selecione o combo</option>
          {combos.map((combo) => (
            <option key={combo.id} value={combo.id}>
              {combo.nome} - {descreverItensCombo(combo)}
            </option>
          ))}
        </select>
      </label>

      <label className="campo-pacote">
        <span>Nome do pacote da cliente</span>
        <input
          placeholder="Ex: Pacote 4 mãos"
          value={formulario.nome}
          onChange={(e) => alterarCampo("nome", e.target.value)}
        />
      </label>

      <label className="campo-pacote">
        <span>Avisar quando restar</span>
        <input
          type="number"
          min="1"
          value={formulario.alertaSaldoMinimo}
          onChange={(e) => alterarCampo("alertaSaldoMinimo", e.target.value)}
        />
      </label>

      <label className="campo-pacote">
        <span>Valor pago pela cliente</span>
        <input
          type="number"
          min="0"
          value={formulario.valorPago}
          onChange={(e) => alterarCampo("valorPago", e.target.value)}
        />
      </label>

      <label className="campo-pacote">
        <span>Forma de pagamento</span>
        <select
          value={formulario.formaPagamento}
          onChange={(e) => alterarCampo("formaPagamento", e.target.value)}
        >
          <option value="">Selecione a forma de pagamento</option>
          {formasPagamento.map((formaPagamento) => (
            <option key={formaPagamento} value={formaPagamento}>
              {formaPagamento}
            </option>
          ))}
        </select>
      </label>

      {comboSelecionado && (
        <div className="resumo-combo resumo-venda-pacote">
          <strong>Resumo do combo: {comboSelecionado.nome}</strong>
          {(comboSelecionado.itens || []).map((item) => (
            <span key={item.servicoId}>
              {item.quantidade}x {item.servicoNome}
            </span>
          ))}
        </div>
      )}

      {combos.length === 0 && (
        <div className="aviso-pacote">
          <strong>Nenhum combo cadastrado.</strong>
          <span>Cadastre os combos na tela Serviços, aba Combos, antes de vender pacotes.</span>
        </div>
      )}

      <label className="campo-pacote campo-pacote-observacoes">
        <span>Observações</span>
        <textarea
          placeholder="Informações extras sobre a venda"
          value={formulario.observacoes}
          onChange={(e) => alterarCampo("observacoes", e.target.value)}
        />
      </label>

      <button type="submit">Salvar pacote vendido</button>
    </form>
  );
}

export default PacoteForm;
