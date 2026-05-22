import { useEffect, useMemo, useState } from "react";

import { buscarConfiguracaoEmpresa } from "../modules/configuracoes/repositories/configuracaoEmpresaRepository";

const MARCA_PADRAO = {
  nomeFantasia: "Sistema Boralli",
  subtitulo: "Nails & Autocuidado",
  logoUrl: "",
};

const GRUPOS_MENU = [
  {
    id: "atendimentoGrupo",
    nome: "Atendimento",
    itens: [
      { id: "agenda", nome: "Agenda" },
      { id: "atendimento", nome: "Modo Atendimento" },
      // Pendências e Histórico de atendimentos podem entrar aqui quando virarem telas dedicadas.
    ],
  },
  {
    id: "clientesGrupo",
    nome: "Clientes",
    itens: [
      { id: "clientes", nome: "Cadastro de clientes" },
      { id: "pacotes", nome: "Pacotes/Combos do cliente" },
      // Histórico do cliente já está dentro da tela de clientes (sem rota separada).
    ],
  },
  {
    id: "financeiroGrupo",
    nome: "Financeiro",
    itens: [
      { id: "financeiro", nome: "Receitas e despesas" },
      // Relatórios financeiros permanecem também no módulo Relatórios.
    ],
  },
  {
    id: "configuracoesGrupo",
    nome: "Configurações",
    itens: [
      { id: "configuracoesEmpresa", nome: "Dados da empresa" },
      { id: "servicos", nome: "Serviços" },
      { id: "pacotes", nome: "Pacotes/Combos" },
      // Preferências do sistema podem entrar aqui quando houver tela dedicada.
    ],
  },
  {
    id: "relatoriosGrupo",
    nome: "Relatórios",
    itens: [{ id: "relatorios", nome: "Relatórios e impressões" }],
  },
];

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

  const [gruposAbertos, setGruposAbertos] = useState(() =>
    GRUPOS_MENU.reduce((acc, grupo) => ({ ...acc, [grupo.id]: true }), {})
  );

  function alternarGrupo(grupoId) {
    setGruposAbertos((estadoAtual) => ({
      ...estadoAtual,
      [grupoId]: !estadoAtual[grupoId],
    }));
  }

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

      <nav className="menu-nav">
        {GRUPOS_MENU.map((grupo) => {
          const aberto = gruposAbertos[grupo.id];

          return (
            <section className="menu-grupo" key={grupo.id}>
              <button
                type="button"
                className={`menu-grupo-toggle ${aberto ? "aberto" : ""}`}
                onClick={() => alternarGrupo(grupo.id)}
              >
                <span>{grupo.nome}</span>
                <span className="menu-grupo-icone" aria-hidden="true">
                  {aberto ? "−" : "+"}
                </span>
              </button>

              {aberto && (
                <div className="menu-subabas">
                  {grupo.itens.map((item) => (
                    <button
                      key={`${grupo.id}-${item.id}-${item.nome}`}
                      className={`menu-subaba ${telaAtual === item.id ? "ativo" : ""}`}
                      onClick={() => setTelaAtual(item.id)}
                    >
                      {item.nome}
                    </button>
                  ))}
                </div>
              )}
            </section>
          );
        })}

        <button
          className={`menu-painel ${telaAtual === "dashboard" ? "ativo" : ""}`}
          onClick={() => setTelaAtual("dashboard")}
        >
          Painel
        </button>
      </nav>
    </aside>
  );
}

export default Menu;
