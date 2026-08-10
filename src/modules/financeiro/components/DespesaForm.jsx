import { useState } from "react";
import { validarComprovante } from "../services/leituraComprovanteService";

const formasPagamento = ["Pix", "Dinheiro", "Cartão de débito", "Cartão de crédito", "Transferência", "Outro"];
function obterHoje() {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function criarDespesaInicial(categoriaInicial) {
  return {
    data: obterHoje(),
    fornecedor: "",
    descricao: "",
    categoria: categoriaInicial || "Material",
    valor: "",
    formaPagamento: "Pix",
    status: "pago",
    comprovante: null,
  };
}

function DespesaForm({ categorias = [], onSalvar, salvando }) {
  const categoriaInicial = categorias[0]?.nome || "Material";
  const [despesa, setDespesa] = useState(() => criarDespesaInicial(categoriaInicial));
  const [mensagem, setMensagem] = useState("");
  const [chaveArquivo, setChaveArquivo] = useState(0);

  function alterarCampo(campo, valor) {
    setDespesa((atual) => ({ ...atual, [campo]: valor }));
  }

  function selecionarComprovante(arquivo) {
    setMensagem("");
    if (!arquivo) {
      setDespesa((atual) => ({ ...atual, comprovante: null }));
      return;
    }

    try {
      validarComprovante(arquivo);
      setDespesa((atual) => ({ ...atual, comprovante: arquivo }));
    } catch (erro) {
      setDespesa((atual) => ({ ...atual, comprovante: null }));
      setMensagem(erro.message);
    }
  }

  async function enviar(evento) {
    evento.preventDefault();
    setMensagem("");

    try {
      if (despesa.comprovante) validarComprovante(despesa.comprovante);
      await onSalvar(despesa);
      setDespesa(criarDespesaInicial(categoriaInicial));
      setChaveArquivo((chave) => chave + 1);
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
            {categorias.map((categoria) => (
              <option key={categoria.id || categoria.nome} value={categoria.nome}>{categoria.nome}</option>
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
            <option value="pago">Paga</option>
            <option value="pendente">Pendente</option>
          </select>
        </label>

        <label>
          <span>Fornecedor</span>
          <input
            placeholder="Ex.: Distribuidora Bella"
            value={despesa.fornecedor}
            onChange={(e) => alterarCampo("fornecedor", e.target.value)}
          />
        </label>

        <label className="campo-descricao-despesa">
          <span>Descrição</span>
          <input
            placeholder="Ex.: esmaltes, gasolina, taxa da maquininha..."
            value={despesa.descricao}
            onChange={(e) => alterarCampo("descricao", e.target.value)}
          />
        </label>

        <label className="campo-comprovante-despesa">
          <span>Comprovante de pagamento (opcional)</span>
          <input
            key={chaveArquivo}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => selecionarComprovante(e.target.files?.[0] || null)}
          />
          <small>O arquivo será apenas anexado, sem leitura automática. PDF, JPG, PNG ou WEBP (até 10 MB).</small>
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
