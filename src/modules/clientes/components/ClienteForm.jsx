import { useState } from "react";

const clienteInicial = {
  nome: "",
  telefone: "",
  cep: "",
  rua: "",
  numero: "",
  bairro: "",
  cidade: "Ibitinga",
  complemento: "",
  referencia: "",
  observacoes: "",
};

function montarFormularioCliente(cliente) {
  if (!cliente) return clienteInicial;

  return {
    nome: cliente.nome || "",
    telefone: cliente.telefone || "",
    cep: cliente.cep || "",
    rua: cliente.rua || "",
    numero: cliente.numero || "",
    bairro: cliente.bairro || "",
    cidade: cliente.cidade || "Ibitinga",
    complemento: cliente.complemento || "",
    referencia: cliente.referencia || "",
    observacoes: cliente.observacoes || "",
  };
}

function ClienteForm({ cliente, onSalvar, onCancelar }) {
  const [formulario, setFormulario] = useState(() => montarFormularioCliente(cliente));

  function alterarCampo(campo, valor) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function buscarCEP(cepDigitado) {
    const cepLimpo = cepDigitado.replace(/\D/g, "");

    if (cepLimpo.length !== 8) return;

    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await resposta.json();

      if (dados.erro) return;

      setFormulario((atual) => ({
        ...atual,
        rua: dados.logradouro || atual.rua,
        bairro: dados.bairro || atual.bairro,
        cidade: dados.localidade || atual.cidade,
      }));
    } catch (erro) {
      console.log("Erro ao buscar CEP", erro);
    }
  }

  async function salvar(e) {
    e.preventDefault();
    await onSalvar(formulario);
  }

  return (
    <form className="form-cliente form-cliente-cadastro" onSubmit={salvar}>
      <div className="titulo-form-cliente">
        <h2>{cliente ? "Editar cliente" : "Novo cliente"}</h2>
        <p>Cadastre os dados principais para agenda, atendimento e histórico.</p>
      </div>

      <label className="campo-cliente">
        <span>Nome</span>
        <input
          placeholder="Nome completo"
          value={formulario.nome}
          onChange={(e) => alterarCampo("nome", e.target.value)}
        />
      </label>

      <label className="campo-cliente">
        <span>Telefone</span>
        <input
          placeholder="WhatsApp ou telefone"
          value={formulario.telefone}
          onChange={(e) => alterarCampo("telefone", e.target.value)}
        />
      </label>

      <label className="campo-cliente">
        <span>CEP</span>
        <input
          placeholder="00000-000"
          value={formulario.cep}
          onChange={(e) => {
            alterarCampo("cep", e.target.value);
            buscarCEP(e.target.value);
          }}
        />
      </label>

      <label className="campo-cliente campo-cliente-largo">
        <span>Rua</span>
        <input
          placeholder="Rua ou avenida"
          value={formulario.rua}
          onChange={(e) => alterarCampo("rua", e.target.value)}
        />
      </label>

      <label className="campo-cliente">
        <span>Número</span>
        <input
          placeholder="Número"
          value={formulario.numero}
          onChange={(e) => alterarCampo("numero", e.target.value)}
        />
      </label>

      <label className="campo-cliente">
        <span>Bairro</span>
        <input
          placeholder="Bairro"
          value={formulario.bairro}
          onChange={(e) => alterarCampo("bairro", e.target.value)}
        />
      </label>

      <label className="campo-cliente">
        <span>Cidade</span>
        <input
          placeholder="Cidade"
          value={formulario.cidade}
          onChange={(e) => alterarCampo("cidade", e.target.value)}
        />
      </label>

      <label className="campo-cliente">
        <span>Complemento</span>
        <input
          placeholder="Casa, ap., bloco..."
          value={formulario.complemento}
          onChange={(e) => alterarCampo("complemento", e.target.value)}
        />
      </label>

      <label className="campo-cliente">
        <span>Referência</span>
        <input
          placeholder="Ponto de referência"
          value={formulario.referencia}
          onChange={(e) => alterarCampo("referencia", e.target.value)}
        />
      </label>

      <label className="campo-cliente campo-cliente-observacoes">
        <span>Observações</span>
        <textarea
          placeholder="Preferências, alergias, restrições ou detalhes importantes"
          value={formulario.observacoes}
          onChange={(e) => alterarCampo("observacoes", e.target.value)}
        />
      </label>

      <button type="submit">{cliente ? "Atualizar cliente" : "Salvar cliente"}</button>

      <button type="button" className="botao-cancelar" onClick={onCancelar}>
        {cliente ? "Cancelar edição" : "Fechar formulário"}
      </button>
    </form>
  );
}

export default ClienteForm;
