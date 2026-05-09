import { useState } from "react";

const categoriasDespesa = [
  "Material",
  "Transporte",
  "Aluguel",
  "Taxas",
  "Marketing",
  "Alimentação",
  "Manutenção",
  "Outros",
];

const formasPagamento = ["Pix", "Dinheiro", "Cartão de débito", "Cartão de crédito", "Transferência", "Outro"];

function obterHoje() {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function criarDespesaInicial() {
  return {
    data: obterHoje(),
    descricao: "",
    categoria: "Material",
    valor: "",
    formaPagamento: "Pix",
    status: "confirmado",
  };
}

function DespesaForm({ onSalvar, salvando }) {
  const [despesa, setDespesa] = useState(criarDespesaInicial);
  const [mensagem, setMensagem] = useState("");

  function alterarCampo(campo, valor) {
    setDespesa((atual) => ({ ...atual, [campo]: valor }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setMensagem("");

    try {
      await onSalvar(despesa);
      setDespesa(criarDespesaInicial());
      setMensagem("Despesa lançada com sucesso.");
    } catch (erro) {
      setMensagem(erro.message || "Não foi possível lançar a despesa.");
    }
  }

  return (
    <form className="despesa-form" onSubmit={enviar}>
      <div className="cabecalho-despesa-form">
        <div>
          <h2>Lançar despesa</h2>
          <p>Registre custos para o DRE mostrar o resultado real do período.</p>
        </div>
      </div>

      <div className="campos-despesa-form">
        <label>
          <span>Data</span>
          <input type="date" value={despesa.data} onChange={(e) => alterarCampo("data", e.target.value)} />
        </label>

        <label>
          <span>Categoria</span>
          <select value={despesa.categoria} onChange={(e) => alterarCampo("categoria", e.target.value)}>
            {categoriasDespesa.map((categoria) => (
              <option key={categoria} value={categoria}>{categoria}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Valor</span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={despesa.valor}
            onChange={(e) => alterarCampo("valor", e.target.value)}
          />
        </label>

        <label>
          <span>Forma de pagamento</span>
          <select value={despesa.formaPagamento} onChange={(e) => alterarCampo("formaPagamento", e.target.value)}>
            {formasPagamento.map((forma) => (
              <option key={forma} value={forma}>{forma}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Status</span>
          <select value={despesa.status} onChange={(e) => alterarCampo("status", e.target.value)}>
            <option value="confirmado">Confirmada</option>
            <option value="pendente">Pendente</option>
          </select>
        </label>

        <label className="campo-descricao-despesa">
          <span>Descrição</span>
          <input
            placeholder="Ex.: esmaltes, gasolina, taxa da maquininha..."
            value={despesa.descricao}
            onChange={(e) => alterarCampo("descricao", e.target.value)}
          />
        </label>
      </div>

      <div className="rodape-despesa-form">
        <button className="botao-acao" type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar despesa"}
        </button>
        {mensagem && <span>{mensagem}</span>}
      </div>
    </form>
  );
}

export default DespesaForm;
