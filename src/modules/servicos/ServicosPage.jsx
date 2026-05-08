import { useMemo, useState } from "react";

import "./servicos.css";
import ComboForm from "./components/ComboForm";
import CombosTable from "./components/CombosTable";
import ServicoForm from "./components/ServicoForm";
import ServicosTable from "./components/ServicosTable";
import { useCombos } from "./hooks/useCombos";
import { useServicos } from "./hooks/useServicos";

function ServicosPage() {
  const [pesquisa, setPesquisa] = useState("");
  const [servicoEditando, setServicoEditando] = useState(null);
  const [abaAtual, setAbaAtual] = useState("servicos");

  const {
    servicosAtivos,
    carregando,
    erro,
    salvarServico,
    removerServico,
  } = useServicos();
  const {
    combosAtivos,
    carregandoCombos,
    erroCombos,
    salvarCombo,
    removerCombo,
  } = useCombos();

  const servicosFiltrados = useMemo(() => {
    const termo = pesquisa.toLowerCase();

    return servicosAtivos.filter((servico) =>
      servico.nome?.toLowerCase().includes(termo) ||
      servico.categoria?.toLowerCase().includes(termo)
    );
  }, [servicosAtivos, pesquisa]);

  async function salvarFormulario(dados) {
    try {
      await salvarServico(dados, servicoEditando?.id);
      setServicoEditando(null);
    } catch (erroSalvar) {
      alert(erroSalvar.message || "Não foi possível salvar o serviço.");
    }
  }

  async function salvarFormularioCombo(dados) {
    try {
      await salvarCombo(dados);
    } catch (erroSalvar) {
      alert(erroSalvar.message || "Não foi possível salvar o combo.");
    }
  }

  async function desativar(id) {
    try {
      await removerServico(id);
    } catch (erroDesativar) {
      alert(erroDesativar.message || "Não foi possível desativar o serviço.");
    }
  }

  async function desativarCombo(id) {
    try {
      await removerCombo(id);
    } catch (erroDesativar) {
      alert(erroDesativar.message || "Não foi possível desativar o combo.");
    }
  }

  return (
    <div>
      <div className="topo-clientes topo-com-abas">
        <div>
          <h1>Serviços</h1>
          <p>Cadastre o catálogo de serviços e monte combos para venda de pacotes.</p>
        </div>

        <div className="abas-modulo" role="tablist" aria-label="Seções de serviços">
          <button
            type="button"
            className={abaAtual === "servicos" ? "ativo" : ""}
            onClick={() => setAbaAtual("servicos")}
          >
            Serviços
          </button>
          <button
            type="button"
            className={abaAtual === "combos" ? "ativo" : ""}
            onClick={() => setAbaAtual("combos")}
          >
            Combos
          </button>
        </div>
      </div>

      <div className="cliente-layout">
        {abaAtual === "servicos" && (
          <>
            <ServicoForm
              key={servicoEditando?.id || "novo-servico"}
              servico={servicoEditando}
              onSalvar={salvarFormulario}
              onCancelar={() => setServicoEditando(null)}
            />

            <div className="lista-clientes">
              <input
                className="pesquisa-clientes"
                placeholder="Pesquisar serviço..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
              />

              <h2>Serviços cadastrados</h2>
              {erro && <p>{erro}</p>}

              <ServicosTable
                servicos={servicosFiltrados}
                carregando={carregando}
                onEditar={setServicoEditando}
                onDesativar={desativar}
              />
            </div>
          </>
        )}

        {abaAtual === "combos" && (
          <>
            <ComboForm servicos={servicosAtivos} onSalvar={salvarFormularioCombo} />

            <div className="lista-clientes">
              <h2>Combos cadastrados</h2>
              {erroCombos && <p>{erroCombos}</p>}
              <CombosTable
                combos={combosAtivos}
                carregando={carregandoCombos}
                onDesativar={desativarCombo}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ServicosPage;
