import { useMemo, useState } from "react";

import ServicoForm from "./components/ServicoForm";
import ServicosTable from "./components/ServicosTable";
import { useServicos } from "./hooks/useServicos";

function ServicosPage() {
  const [pesquisa, setPesquisa] = useState("");
  const [servicoEditando, setServicoEditando] = useState(null);

  const {
    servicosAtivos,
    carregando,
    erro,
    salvarServico,
    removerServico,
  } = useServicos();

  const servicosFiltrados = useMemo(() => {
    const termo = pesquisa.toLowerCase();

    return servicosAtivos.filter((servico) =>
      servico.nome?.toLowerCase().includes(termo)
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

  async function desativar(id) {
    try {
      await removerServico(id);
    } catch (erroDesativar) {
      alert(erroDesativar.message || "Não foi possível desativar o serviço.");
    }
  }

  return (
    <div>
      <div className="topo-clientes">
        <div>
          <h1>Serviços</h1>
          <p>Cadastre os serviços usados na agenda e no atendimento.</p>
        </div>
      </div>

      <div className="cliente-layout">
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
      </div>
    </div>
  );
}

export default ServicosPage;
