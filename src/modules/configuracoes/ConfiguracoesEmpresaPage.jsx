import { useState } from "react";

import { useConfiguracaoEmpresa } from "./hooks/useConfiguracaoEmpresa";
import "./configuracoes.css";

function ConfiguracoesEmpresaPage() {
  const { configuracao, carregando, salvando, erro, atualizarCampo, salvarConfiguracao } = useConfiguracaoEmpresa();
  const [arquivoLogo, setArquivoLogo] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erroFormulario, setErroFormulario] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMensagem("");
    setErroFormulario("");

    try {
      await salvarConfiguracao(arquivoLogo);
      setMensagem("Configurações salvas com sucesso.");
      setArquivoLogo(null);
    } catch (erroSalvar) {
      setErroFormulario(erroSalvar.message || "Não foi possível salvar as configurações.");
    }
  }

  if (carregando) {
    return <section className="pagina-modulo"><h1>Configurações da Empresa</h1><p>Carregando...</p></section>;
  }

  return (
    <section className="pagina-modulo pagina-configuracoes-empresa">
      <div className="cabecalho-config">
        <h1>Configurações da Empresa</h1>
        <p>Defina os dados padrão para relatórios, impressões e cabeçalhos.</p>
      </div>

      <form className="card-form-config" onSubmit={handleSubmit}>
        <div className="grid-config">
          {[
            ["nomeEmpresa", "Nome da empresa"],
            ["nomeFantasia", "Nome fantasia"],
            ["telefone", "Telefone"],
            ["whatsapp", "WhatsApp"],
            ["instagram", "Instagram"],
            ["endereco", "Endereço"],
            ["cidade", "Cidade"],
            ["documentoFiscal", "Documento fiscal"],
          ].map(([campo, label]) => (
            <label className="campo-config-empresa" key={campo}>
              <span>{label}</span>
              <input value={configuracao[campo]} onChange={(e) => atualizarCampo(campo, e.target.value)} />
            </label>
          ))}

          <label className="campo-config-empresa campo-largo">
            <span>Texto do rodapé</span>
            <textarea
              rows={3}
              value={configuracao.textoRodape}
              onChange={(e) => atualizarCampo("textoRodape", e.target.value)}
            />
          </label>

          <label className="campo-config-empresa">
            <span>Cor principal</span>
            <input
              type="color"
              value={configuracao.corPrincipal || "#5b8def"}
              onChange={(e) => atualizarCampo("corPrincipal", e.target.value)}
            />
          </label>

          <label className="campo-config-empresa campo-largo">
            <span>Logotipo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setArquivoLogo(e.target.files?.[0] || null)}
            />
            {configuracao.logoUrl && (
              <div className="preview-logo">
                <img src={configuracao.logoUrl} alt="Logotipo da empresa" />
                <small>Você pode substituir o logotipo a qualquer momento.</small>
              </div>
            )}
          </label>
        </div>

        {erro && <p className="mensagem-erro">{erro}</p>}
        {erroFormulario && <p className="mensagem-erro">{erroFormulario}</p>}
        {mensagem && <p className="mensagem-sucesso">{mensagem}</p>}

        <button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar configurações"}
        </button>
      </form>
    </section>
  );
}

export default ConfiguracoesEmpresaPage;
