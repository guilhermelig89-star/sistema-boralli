import { useRef, useState } from "react";
import { lerComprovante, validarComprovante } from "../services/leituraComprovanteService";
import { aplicarSugestoes } from "../services/sugestoesComprovante";

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
  const [lendoComprovante, setLendoComprovante] = useState(false);
  const [camposSugeridos, setCamposSugeridos] = useState([]);
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);
  const camposEditados = useRef(new Set());

  function alterarCampo(campo, valor) {
    camposEditados.current.add(campo);
    setCamposSugeridos((atuais) => atuais.filter((item) => item !== campo));
    setDespesa((atual) => ({ ...atual, [campo]: valor }));
  }

  async function selecionarComprovante(arquivo) {
    setMensagem("");
    setAguardandoConfirmacao(false);
    if (!arquivo) {
      setDespesa((atual) => ({ ...atual, comprovante: null }));
      return;
    }

    try {
      validarComprovante(arquivo);
      setDespesa((atual) => ({ ...atual, comprovante: arquivo }));
      setLendoComprovante(true);
      const leitura = await lerComprovante(arquivo);
      setDespesa((atual) => {
        const resultado = aplicarSugestoes(atual, leitura, camposEditados.current, categorias);
        setCamposSugeridos(resultado.camposSugeridos);
        return resultado.despesa;
      });
      setAguardandoConfirmacao(true);
      setMensagem(Object.keys(leitura || {}).length
        ? "Sugestões extraídas. Confira os dados antes do lançamento."
        : "Nenhum dado foi reconhecido. Preencha manualmente e confira antes do lançamento.");
    } catch (erro) {
      setMensagem(erro.message);
    } finally {
      setLendoComprovante(false);
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
      camposEditados.current.clear();
      setCamposSugeridos([]);
      setAguardandoConfirmacao(false);
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
        <label className={camposSugeridos.includes("data") ? "campo-sugerido" : ""}>
          <span>Data {camposSugeridos.includes("data") && <em>Sugestão do comprovante</em>}</span>
          <input type="date" value={despesa.data} onChange={(e) => alterarCampo("data", e.target.value)} />
        </label>

        <label className={camposSugeridos.includes("categoria") ? "campo-sugerido" : ""}>
          <span>Categoria {camposSugeridos.includes("categoria") && <em>Sugestão do comprovante</em>}</span>
          <select value={despesa.categoria} onChange={(e) => alterarCampo("categoria", e.target.value)}>
            {categorias.map((categoria) => (
              <option key={categoria.id || categoria.nome} value={categoria.nome}>{categoria.nome}</option>
            ))}
          </select>
        </label>

        <label className={camposSugeridos.includes("valor") ? "campo-sugerido" : ""}>
          <span>Valor {camposSugeridos.includes("valor") && <em>Sugestão do comprovante</em>}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={despesa.valor}
            onChange={(e) => alterarCampo("valor", e.target.value)}
          />
        </label>

        <label className={camposSugeridos.includes("formaPagamento") ? "campo-sugerido" : ""}>
          <span>Forma de pagamento {camposSugeridos.includes("formaPagamento") && <em>Sugestão do comprovante</em>}</span>
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

        <label className={`campo-descricao-despesa ${camposSugeridos.includes("descricao") ? "campo-sugerido" : ""}`}>
          <span>Descrição {camposSugeridos.includes("descricao") && <em>Sugestão do comprovante</em>}</span>
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
            disabled={lendoComprovante}
            onChange={(e) => selecionarComprovante(e.target.files?.[0] || null)}
          />
          <small>Envie o comprovante do Pix em PDF, JPG, PNG ou WEBP (até 10 MB).</small>
        </label>
      </div>

      {lendoComprovante && <div className="aviso-leitura-comprovante" role="status">Lendo o comprovante e buscando sugestões…</div>}
      {aguardandoConfirmacao && (
        <div className="aviso-confirmacao-comprovante" role="alert">
          <strong>Confira antes de lançar.</strong> Os dados extraídos são sugestões e precisam ser conferidos antes do lançamento.
        </div>
      )}

      <div className="rodape-despesa-form">
        <button className="botao-acao" type="submit" disabled={salvando || lendoComprovante}>
          {salvando ? "Salvando..." : "Salvar despesa"}
        </button>
        {mensagem && <span>{mensagem}</span>}
      </div>
    </form>
  );
}

export default DespesaForm;
