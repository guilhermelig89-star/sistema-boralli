import { useEffect, useState } from "react";

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

function ClienteForm({ cliente, onSalvar, onCancelar }) {
  const [formulario, setFormulario] = useState(clienteInicial);

  useEffect(() => {
    if (!cliente) {
      setFormulario(clienteInicial);
      return;
    }

    setFormulario({
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
    });
  }, [cliente]);

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

    if (!cliente) {
      setFormulario(clienteInicial);
    }
  }

  return (
    <form className="form-cliente" onSubmit={salvar}>
      <h2>{cliente ? "Editar cliente" : "Novo cliente"}</h2>

      <input
        placeholder="Nome do cliente"
        value={formulario.nome}
        onChange={(e) => alterarCampo("nome", e.target.value)}
      />
      <input
        placeholder="Telefone"
        value={formulario.telefone}
        onChange={(e) => alterarCampo("telefone", e.target.value)}
      />

      <input
        placeholder="CEP"
        value={formulario.cep}
        onChange={(e) => {
          alterarCampo("cep", e.target.value);
          buscarCEP(e.target.value);
        }}
      />

      <input
        placeholder="Rua"
        value={formulario.rua}
        onChange={(e) => alterarCampo("rua", e.target.value)}
      />
      <input
        placeholder="Numero"
        value={formulario.numero}
        onChange={(e) => alterarCampo("numero", e.target.value)}
      />
      <input
        placeholder="Bairro"
        value={formulario.bairro}
        onChange={(e) => alterarCampo("bairro", e.target.value)}
      />
      <input
        placeholder="Cidade"
        value={formulario.cidade}
        onChange={(e) => alterarCampo("cidade", e.target.value)}
      />
      <input
        placeholder="Complemento"
        value={formulario.complemento}
        onChange={(e) => alterarCampo("complemento", e.target.value)}
      />
      <input
        placeholder="Referencia"
        value={formulario.referencia}
        onChange={(e) => alterarCampo("referencia", e.target.value)}
      />

      <textarea
        placeholder="Observacoes"
        value={formulario.observacoes}
        onChange={(e) => alterarCampo("observacoes", e.target.value)}
      />

      <button type="submit">{cliente ? "Atualizar cliente" : "Salvar cliente"}</button>

      {cliente && (
        <button type="button" className="botao-cancelar" onClick={onCancelar}>
          Cancelar edicao
        </button>
      )}
    </form>
  );
}

export default ClienteForm;
