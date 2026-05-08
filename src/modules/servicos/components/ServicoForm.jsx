import { useState } from "react";

const servicoInicial = {
  nome: "",
  categoria: "",
  valor: "",
  duracaoMinutos: "60",
  observacoes: "",
};

function montarFormularioServico(servico) {
  if (!servico) return servicoInicial;

  return {
    nome: servico.nome || "",
    categoria: servico.categoria || "",
    valor: servico.valor || "",
    duracaoMinutos: servico.duracaoMinutos || "60",
    observacoes: servico.observacoes || "",
  };
}

function ServicoForm({ servico, onSalvar, onCancelar }) {
  const [formulario, setFormulario] = useState(() => montarFormularioServico(servico));

  function alterarCampo(campo, valor) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function salvar(e) {
    e.preventDefault();

    await onSalvar(formulario);

    if (!servico) {
      setFormulario(servicoInicial);
    }
  }

  return (
    <form className="form-cliente" onSubmit={salvar}>
      <h2>{servico ? "Editar serviço" : "Novo serviço"}</h2>

      <input
        placeholder="Nome do serviço"
        value={formulario.nome}
        onChange={(e) => alterarCampo("nome", e.target.value)}
      />

      <input
        placeholder="Categoria"
        value={formulario.categoria}
        onChange={(e) => alterarCampo("categoria", e.target.value)}
      />

      <input
        placeholder="Valor avulso"
        type="number"
        autoComplete="off"
        value={formulario.valor}
        onChange={(e) => alterarCampo("valor", e.target.value)}
      />

      <input
        placeholder="Duração em minutos"
        type="number"
        value={formulario.duracaoMinutos}
        onChange={(e) => alterarCampo("duracaoMinutos", e.target.value)}
      />

      <textarea
        placeholder="Observações"
        value={formulario.observacoes}
        onChange={(e) => alterarCampo("observacoes", e.target.value)}
      />

      <button type="submit">{servico ? "Atualizar serviço" : "Salvar serviço"}</button>

      {servico && (
        <button type="button" className="botao-cancelar" onClick={onCancelar}>
          Cancelar edição
        </button>
      )}
    </form>
  );
}

export default ServicoForm;
