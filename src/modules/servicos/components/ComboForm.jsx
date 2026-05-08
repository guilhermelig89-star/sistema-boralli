import { useMemo, useState } from "react";

const comboInicial = {
  nome: "",
  valor: "",
  servicoId: "",
  quantidade: "1",
  observacoes: "",
  itens: [],
};

function ComboForm({ servicos, onSalvar }) {
  const [formulario, setFormulario] = useState(comboInicial);

  const servicoSelecionado = useMemo(
    () => servicos.find((servico) => servico.id === formulario.servicoId),
    [servicos, formulario.servicoId]
  );

  function alterarCampo(campo, valor) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function adicionarItem() {
    const quantidade = Number(formulario.quantidade || 0);

    if (!servicoSelecionado || quantidade <= 0) {
      alert("Selecione um serviço e informe a quantidade.");
      return;
    }

    setFormulario((atual) => {
      const itemExistente = atual.itens.find((item) => item.servicoId === servicoSelecionado.id);
      const itens = itemExistente
        ? atual.itens.map((item) =>
            item.servicoId === servicoSelecionado.id
              ? { ...item, quantidade: Number(item.quantidade || 0) + quantidade }
              : item
          )
        : [
            ...atual.itens,
            {
              servicoId: servicoSelecionado.id,
              servicoNome: servicoSelecionado.nome,
              quantidade,
            },
          ];

      return {
        ...atual,
        itens,
        servicoId: "",
        quantidade: "1",
      };
    });
  }

  function removerItem(servicoId) {
    setFormulario((atual) => ({
      ...atual,
      itens: atual.itens.filter((item) => item.servicoId !== servicoId),
    }));
  }

  async function salvar(e) {
    e.preventDefault();
    await onSalvar(formulario);
    setFormulario(comboInicial);
  }

  return (
    <form className="form-cliente" onSubmit={salvar}>
      <h2>Novo combo</h2>

      <input
        placeholder="Nome do combo"
        value={formulario.nome}
        onChange={(e) => alterarCampo("nome", e.target.value)}
      />

      <input
        placeholder="Valor do combo"
        type="number"
        min="0"
        value={formulario.valor}
        onChange={(e) => alterarCampo("valor", e.target.value)}
      />

      <select value={formulario.servicoId} onChange={(e) => alterarCampo("servicoId", e.target.value)}>
        <option value="">Adicionar serviço ao combo</option>
        {servicos.map((servico) => (
          <option key={servico.id} value={servico.id}>
            {servico.nome}
          </option>
        ))}
      </select>

      <input
        placeholder="Quantidade"
        type="number"
        min="1"
        value={formulario.quantidade}
        onChange={(e) => alterarCampo("quantidade", e.target.value)}
      />

      <button type="button" className="botao-cancelar" onClick={adicionarItem}>
        Adicionar item
      </button>

      <div className="resumo-combo">
        {formulario.itens.length === 0 && <span>Nenhum serviço adicionado ao combo.</span>}
        {formulario.itens.map((item) => (
          <div className="item-combo" key={item.servicoId}>
            <span>
              {item.quantidade}x {item.servicoNome}
            </span>
            <button type="button" onClick={() => removerItem(item.servicoId)}>
              Remover
            </button>
          </div>
        ))}
      </div>

      <textarea
        placeholder="Observações"
        value={formulario.observacoes}
        onChange={(e) => alterarCampo("observacoes", e.target.value)}
      />

      <button type="submit">Salvar combo</button>
    </form>
  );
}

export default ComboForm;
