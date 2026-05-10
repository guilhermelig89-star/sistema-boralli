import { useMemo, useState } from "react";

import { useAgendamentos } from "../agendamentos/hooks/useAgendamentos";
import { useFinanceiro } from "../financeiro/hooks/useFinanceiro";
import { usePacotesClientes } from "../pacotes/hooks/usePacotesClientes";
import "./clientes.css";
import ClienteForm from "./components/ClienteForm";
import ClienteHistorico from "./components/ClienteHistorico";
import ClientesTable from "./components/ClientesTable";
import { useClientes } from "./hooks/useClientes";

const filtrosFinanceiroHistorico = {
  dataInicio: "",
  dataFim: "",
  clienteId: "",
  origem: "todos",
  status: "",
  pesquisa: "",
};

function ClientesPage() {
  const [pesquisa, setPesquisa] = useState("");
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [clienteHistorico, setClienteHistorico] = useState(null);

  const {
    clientesAtivos,
    carregando,
    erro,
    salvarCliente,
    removerCliente,
  } = useClientes();
  const { agendamentos } = useAgendamentos();
  const { pacotes, historico, calcularSaldoPacote } = usePacotesClientes();
  const { movimentos } = useFinanceiro(filtrosFinanceiroHistorico);

  const clientesFiltrados = useMemo(() => {
    const termo = pesquisa.toLowerCase();

    return clientesAtivos.filter((cliente) =>
      cliente.nome?.toLowerCase().includes(termo) ||
      cliente.telefone?.toLowerCase().includes(termo) ||
      cliente.bairro?.toLowerCase().includes(termo)
    );
  }, [clientesAtivos, pesquisa]);

  function abrirNovoCadastro() {
    setClienteEditando(null);
    setFormularioAberto(true);
  }

  function editarCliente(cliente) {
    setClienteEditando(cliente);
    setFormularioAberto(true);
  }

  function fecharFormulario() {
    setClienteEditando(null);
    setFormularioAberto(false);
  }

  async function salvarFormulario(dados) {
    try {
      await salvarCliente(dados, clienteEditando?.id);
      fecharFormulario();
    } catch (erroSalvar) {
      alert(erroSalvar.message || "Não foi possível salvar o cliente.");
    }
  }

  async function desativar(id) {
    try {
      await removerCliente(id);
      if (clienteHistorico?.id === id) {
        setClienteHistorico(null);
      }
      if (clienteEditando?.id === id) {
        fecharFormulario();
      }
    } catch (erroDesativar) {
      alert(erroDesativar.message || "Não foi possível desativar o cliente.");
    }
  }

  return (
    <div>
      <div className="topo-clientes topo-clientes-modulo">
        <div>
          <h1>Clientes</h1>
          <p>Consulte clientes, veja histórico e abra o cadastro apenas quando precisar.</p>
        </div>

        <button type="button" className="botao-novo-cliente" onClick={abrirNovoCadastro}>
          Novo cadastro
        </button>
      </div>

      <div className="cliente-layout">
        {formularioAberto && (
          <ClienteForm
            key={clienteEditando?.id || "novo-cliente"}
            cliente={clienteEditando}
            onSalvar={salvarFormulario}
            onCancelar={fecharFormulario}
          />
        )}

        <div className="lista-clientes bloco-lista-clientes">
          <div className="cabecalho-lista-clientes">
            <div>
              <h2>Clientes cadastrados</h2>
              <p>Use o histórico para ver pacotes, atendimentos e financeiro da cliente.</p>
            </div>
          </div>

          <input
            className="pesquisa-clientes"
            placeholder="Pesquisar por nome, telefone ou bairro..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />

          {erro && <p>{erro}</p>}

          <ClientesTable
            clientes={clientesFiltrados}
            carregando={carregando}
            onEditar={editarCliente}
            onDesativar={desativar}
            onHistorico={setClienteHistorico}
          />
        </div>

        <ClienteHistorico
          cliente={clienteHistorico}
          agendamentos={agendamentos}
          pacotes={pacotes}
          historicoPacotes={historico}
          movimentos={movimentos}
          calcularSaldoPacote={calcularSaldoPacote}
          onFechar={() => setClienteHistorico(null)}
        />
      </div>
    </div>
  );
}

export default ClientesPage;
