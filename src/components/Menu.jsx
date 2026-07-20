import { useEffect, useMemo, useRef, useState } from "react";

import { buscarConfiguracaoEmpresa } from "../modules/configuracoes/repositories/configuracaoEmpresaRepository";
import { useAgendamentos } from "../modules/agendamentos/hooks/useAgendamentos";
import { filtrarPendenciasAgendamentos } from "../modules/agendamentos/services/pendenciasAgendamentosService";
import { MENU_GROUPS } from "../navigation/menuConfig";
import { SCREENS } from "../navigation/screens";

const MARCA_PADRAO = {
  nomeFantasia: "Sistema Boralli",
  subtitulo: "Nails & Autocuidado",
  logoUrl: "",
};

const GRUPOS_MENU = MENU_GROUPS;

function Menu({ telaAtual, setTelaAtual }) {
  const [marcaEmpresa, setMarcaEmpresa] = useState(MARCA_PADRAO);
  const { agendamentos } = useAgendamentos();
  const totalPendenciasAtendimento = useMemo(
    () => filtrarPendenciasAgendamentos(agendamentos).length,
    [agendamentos]
  );

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
    GRUPOS_MENU.reduce((acc, grupo) => ({ ...acc, [grupo.id]: false }), {})
  );
  const menuRef = useRef(null);

  useEffect(() => {
    function fecharGruposAoClicarFora(evento) {
      if (!menuRef.current || menuRef.current.contains(evento.target)) {
        return;
      }

      setGruposAbertos((estadoAtual) =>
        Object.fromEntries(Object.keys(estadoAtual).map((id) => [id, false]))
      );
    }

    document.addEventListener("mousedown", fecharGruposAoClicarFora);

    return () => {
      document.removeEventListener("mousedown", fecharGruposAoClicarFora);
    };
  }, []);

  function alternarGrupo(grupoId) {
    setGruposAbertos((estadoAtual) => ({
      ...estadoAtual,
      [grupoId]: !estadoAtual[grupoId],
    }));
  }

  return (
    <aside className="menu" ref={menuRef}>
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
                aria-expanded={aberto}
                aria-controls={`${grupo.id}-subabas`}
                onClick={() => alternarGrupo(grupo.id)}
              >
                <span className="menu-grupo-nome">
                  {grupo.nome}
                  {grupo.id === "atendimentoGrupo" && totalPendenciasAtendimento > 0 && (
                    <span
                      className="menu-pendencias-badge"
                      title={`${totalPendenciasAtendimento} pendência${totalPendenciasAtendimento === 1 ? "" : "s"} no atendimento`}
                      aria-label={`${totalPendenciasAtendimento} pendência${totalPendenciasAtendimento === 1 ? "" : "s"}`}
                    >
                      <span aria-hidden="true">!</span>
                      {totalPendenciasAtendimento}
                    </span>
                  )}
                </span>
                <span className="menu-grupo-icone" aria-hidden="true">
                  {aberto ? "−" : "+"}
                </span>
              </button>

              {aberto && (
                <div className="menu-subabas" id={`${grupo.id}-subabas`}>
                  {grupo.itens.map((item) => (
                    <button
                      type="button"
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
          type="button"
          className={`menu-painel ${telaAtual === SCREENS.DASHBOARD ? "ativo" : ""}`}
          onClick={() => setTelaAtual(SCREENS.DASHBOARD)}
        >
          Painel
        </button>
      </nav>
    </aside>
  );
}

export default Menu;
