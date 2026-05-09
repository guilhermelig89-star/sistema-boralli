import { useState } from "react";

function CategoriasDespesa({ categorias, carregando, salvando, erro, onSalvar, onRemover }) {
  const [nome, setNome] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function enviar(evento) {
    evento.preventDefault();
    setMensagem("");

    try {
      await onSalvar(nome);
      setNome("");
      setMensagem("Categoria cadastrada.");
    } catch (erroSalvar) {
      setMensagem(erroSalvar.message || "Não foi possível cadastrar a categoria.");
    }
  }

  async function remover(categoria) {
    setMensagem("");

    try {
      await onRemover(categoria);
      setMensagem("Categoria removida da lista.");
    } catch (erroRemover) {
      setMensagem(erroRemover.message || "Não foi possível remover a categoria.");
    }
  }

  return (
    <div className="categorias-despesa">
      <div className="cabecalho-categorias-despesa">
        <div>
          <h2>Categorias de despesa</h2>
          <p>Cadastre os tipos de custo que aparecem no lançamento e no DRE.</p>
        </div>
      </div>

      <form className="form-categoria-despesa" onSubmit={enviar}>
        <label>
          <span>Nova categoria</span>
          <input
            placeholder="Ex.: Combustível, Produtos, Taxa da maquininha"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </label>
        <button className="botao-acao-secundario" type="submit" disabled={salvando}>Adicionar</button>
      </form>

      <div className="lista-categorias-despesa">
        {carregando && <span>Carregando categorias...</span>}

        {!carregando && categorias.map((categoria) => (
          <div className="item-categoria-despesa" key={categoria.id}>
            <div>
              <strong>{categoria.nome}</strong>
              <span>{categoria.padrao ? "Padrão do sistema" : "Cadastrada"}</span>
            </div>
            {!categoria.padrao && (
              <button type="button" onClick={() => remover(categoria)} disabled={salvando}>Remover</button>
            )}
          </div>
        ))}
      </div>

      {(mensagem || erro) && <p className="mensagem-categoria-despesa">{mensagem || erro}</p>}
    </div>
  );
}

export default CategoriasDespesa;
