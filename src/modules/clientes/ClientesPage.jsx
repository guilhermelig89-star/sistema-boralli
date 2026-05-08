import { useEffect, useState } from "react";
import {
  listarClientes,
  criarCliente,
  editarCliente,
  desativarCliente,
} from "../../services/clientesService";

function ClientesPage() {
  const [clientes, setClientes] = useState([]);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [clienteEditando, setClienteEditando] = useState(null);

  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("Ibitinga");
  const [complemento, setComplemento] = useState("");
  const [referencia, setReferencia] = useState("");
  const [observacoes, setObservacoes] = useState("");

  async function buscarCEP(cepDigitado) {
    const cepLimpo = cepDigitado.replace(/\D/g, "");

    if (cepLimpo.length !== 8) return;

    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await resposta.json();

      if (dados.erro) return;

      setRua(dados.logradouro || "");
      setBairro(dados.bairro || "");
      setCidade(dados.localidade || "");
    } catch (erro) {
      console.log("Erro ao buscar CEP", erro);
    }
  }

  async function carregarClientes() {
    const dados = await listarClientes();
    setClientes(dados);
  }

  function limparFormulario() {
    setClienteEditando(null);
    setNome("");
    setTelefone("");
    setCep("");
    setRua("");
    setNumero("");
    setBairro("");
    setCidade("Ibitinga");
    setComplemento("");
    setReferencia("");
    setObservacoes("");
  }

  async function salvarCliente(e) {
    e.preventDefault();

    if (!nome) return;

    const dadosCliente = {
      nome,
      telefone,
      cep,
      rua,
      numero,
      bairro,
      cidade,
      complemento,
      referencia,
      observacoes,
    };

    if (clienteEditando) {
      await editarCliente(clienteEditando, dadosCliente);
    } else {
      await criarCliente(dadosCliente);
    }

    limparFormulario();
    carregarClientes();
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  const clientesFiltrados = clientes
    .filter((cliente) => cliente.ativo !== false)
    .filter((cliente) =>
      cliente.nome?.toLowerCase().includes(pesquisa.toLowerCase())
    );

  return (
    <div>
      <div className="topo-clientes">
        <div>
          <h1>Clientes</h1>
          <p>Gerencie os clientes do sistema.</p>
        </div>
      </div>

      <div className="cliente-layout">
        <form className="form-cliente" onSubmit={salvarCliente}>
          <h2>{clienteEditando ? "Editar cliente" : "Novo cliente"}</h2>

          <input placeholder="Nome do cliente" value={nome} onChange={(e) => setNome(e.target.value)} />
          <input placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />

          <input
            placeholder="CEP"
            value={cep}
            onChange={(e) => {
              setCep(e.target.value);
              buscarCEP(e.target.value);
            }}
          />

          <input placeholder="Rua" value={rua} onChange={(e) => setRua(e.target.value)} />
          <input placeholder="Número" value={numero} onChange={(e) => setNumero(e.target.value)} />
          <input placeholder="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
          <input placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
          <input placeholder="Complemento" value={complemento} onChange={(e) => setComplemento(e.target.value)} />
          <input placeholder="Referência" value={referencia} onChange={(e) => setReferencia(e.target.value)} />

          <textarea
            placeholder="Observações"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />

          <button type="submit">
            {clienteEditando ? "Atualizar cliente" : "Salvar cliente"}
          </button>

          {clienteEditando && (
            <button type="button" className="botao-cancelar" onClick={limparFormulario}>
              Cancelar edição
            </button>
          )}
        </form>

        <div className="lista-clientes">
          <input
            className="pesquisa-clientes"
            placeholder="Pesquisar cliente..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />

          <h2>Clientes cadastrados</h2>

          <div className="tabela-clientes">
            <div className="linha-cliente cabecalho">
              <span>Nome</span>
              <span>Telefone</span>
              <span>Bairro</span>
              <span>Cidade</span>
              <span>Ações</span>
            </div>

            {clientesFiltrados.map((cliente) => (
              <div className="linha-cliente" key={cliente.id}>
                <strong>{cliente.nome}</strong>
                <span>{cliente.telefone}</span>
                <span>{cliente.bairro || "-"}</span>
                <span>{cliente.cidade || "-"}</span>

                <div className="acoes-cliente">
                  <button
                    className="botao-editar"
                    onClick={() => {
                      setClienteEditando(cliente.id);
                      setNome(cliente.nome || "");
                      setTelefone(cliente.telefone || "");
                      setCep(cliente.cep || "");
                      setRua(cliente.rua || "");
                      setNumero(cliente.numero || "");
                      setBairro(cliente.bairro || "");
                      setCidade(cliente.cidade || "Ibitinga");
                      setComplemento(cliente.complemento || "");
                      setReferencia(cliente.referencia || "");
                      setObservacoes(cliente.observacoes || "");
                    }}
                  >
                    Editar
                  </button>

                  <button
                    className="botao-desativar"
                    onClick={async () => {
                      const confirmar = confirm("Deseja desativar este cliente?");
                      if (!confirmar) return;

                      await desativarCliente(cliente.id);
                      carregarClientes();
                    }}
                  >
                    Desativar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientesPage;