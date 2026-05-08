import { useMemo, useState } from "react";

import ClienteForm from "./components/ClienteForm";
import ClientesTable from "./components/ClientesTable";
import { useClientes } from "./hooks/useClientes";

function ClientesPage() {
  const [pesquisa, setPesquisa] = useState("");
  const [clienteEditando, setClienteEditando] = useState(null);

  const {
    clientesAtivos,
    carregando,
    erro,
    salvarCliente,
    removerCliente,
  } = useClientes();

  const clientesFiltrados = useMemo(() => {
    const termo = pesquisa.toLowerCase();

    return clientesAtivos.filter((cliente) =>
      cliente.nome?.toLowerCase().includes(termo)
    );
  }, [clientesAtivos, pesquisa]);

  async function salvarFormulario(dados) {
    try {
      await salvarCliente(dados, clienteEditando?.id);
      setClienteEditando(null);
    } catch (erroSalvar) {
      alert(erroSalvar.message || "Não foi possível salvar o cliente.");
    }
  }

  async function desativar(id) {
    try {
      await removerCliente(id);
    } catch (erroDesativar) {
      alert(erroDesativar.message || "Não foi possível desativar o cliente.");
    }
  }

  return (
    <div>
      <div className="topo-clientes">
        <div>
          <h1>Clientes</h1>
          <p>Gerencie os clientes do sistema.</p>
        </div>
      </div>

      <div className="cliente-layout">
        <ClienteForm
          key={clienteEditando?.id || "novo-cliente"}
          cliente={clienteEditando}
          onSalvar={salvarFormulario}
          onCancelar={() => setClienteEditando(null)}
        />

        <div className="lista-clientes">
          <input
            className="pesquisa-clientes"
            placeholder="Pesquisar cliente..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />

          <h2>Clientes cadastrados</h2>
          {erro && <p>{erro}</p>}

          <ClientesTable
            clientes={clientesFiltrados}
            carregando={carregando}
            onEditar={setClienteEditando}
            onDesativar={desativar}
          />
        </div>
      </div>
    </div>
  );
}

export default ClientesPage;
