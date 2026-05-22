import { useEffect, useMemo, useState } from "react";

import { buscarConfiguracaoEmpresa } from "../modules/configuracoes/repositories/configuracaoEmpresaRepository";

const MARCA_PADRAO = {
  nomeFantasia: "Sistema Boralli",
  subtitulo: "Nails & Autocuidado",
  logoUrl: "",
};

function Menu({ telaAtual, setTelaAtual }) {
  const [marcaEmpresa, setMarcaEmpresa] = useState(MARCA_PADRAO);

  useEffect(() => {
    async function carregarMarca() {
      try {
        const dados = await buscarConfiguracaoEmpresa();
        if (!dados) {
          return;
        }

        setMarcaEmpresa({
          nomeFantasia: dados.nomeFantasia?.trim() || "Sistema Boralli",
          subtitulo: dados.subtitulo?.trim() || "Nails & Autocuidado",
          logoUrl: dados.logoUrl || "",
        });
      } catch (erro) {
        console.warn("Não foi possível carregar a identidade da empresa.", erro);
      }
    }

    carregarMarca();
  }, []);

  const iniciais = useMemo(() => {
    return marcaEmpresa.nomeFantasia
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join("");
  }, [marcaEmpresa.nomeFantasia]);

  const itens = [
    { id: "atendimento", nome: "Atendimento" },
    { id: "dashboard", nome: "Painel" },
    { id: "clientes", nome: "Clientes" },
    { id: "servicos", nome: "Serviços" },
    { id: "pacotes", nome: "Pacotes" },
    { id: "agenda", nome: "Agendamentos" },
    { id: "financeiro", nome: "Financeiro" },
    { id: "relatorios", nome: "Relatórios" },
    { id: "configuracoesEmpresa", nome: "Configurações da Empresa" },
  ];

  return (
    <aside className="menu">
      <div className="menu-logo">
        {marcaEmpresa.logoUrl ? (
          <img className="menu-logo-imagem" src={marcaEmpresa.logoUrl} alt={`Logotipo ${marcaEmpresa.nomeFantasia}`} />
        ) : (
          <div className="menu-logo-placeholder" aria-hidden="true">
            {iniciais || "SB"}
          </div>
        )}
        <div className="menu-logo-texto">
          <h2>{marcaEmpresa.nomeFantasia || "Sistema Boralli"}</h2>
          {marcaEmpresa.subtitulo && <span>{marcaEmpresa.subtitulo}</span>}
        </div>
      </div>

      <nav>
        {itens.map((item) => (
          <button
            key={item.id}
            className={telaAtual === item.id ? "ativo" : ""}
            onClick={() => setTelaAtual(item.id)}
          >
            {item.nome}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Menu;
