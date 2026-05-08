import { useEffect, useState } from "react";

const servicoInicial = {
  nome: "",
  tipo: "avulso",
  valor: "",
  duracaoMinutos: "60",
};

function ServicoForm({ servico, onSalvar, onCancelar }) {
  const [formulario, setFormulario] = useState(servicoInicial);

  useEffect(() => {
    if (!servico) {
      setFormulario(servicoInicial);
      return;
    }

    setFormulario({
      nome: servico.nome || "",
      tipo: servico.tipo || "avulso",
      valor: servico.valor || "",
      duracaoMinutos: servico.duracaoMinutos || "60",
    });
  }, [servico]);

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
      <h2>{servico ? "Editar servico" : "Novo servico"}</h2>

      <input
        placeholder="Nome do servico"
        value={formulario.nome}
        onChange={(e) => alterarCampo("nome", e.target.value)}
      />

      <select value={formulario.tipo} onChange={(e) => alterarCampo("tipo", e.target.value)}>
        <option value="avulso">Avulso</option>
        <option value="combo">Combo</option>
      </select>

      <input
        placeholder="Valor"
        type="number"
        autoComplete="off"
        value={formulario.valor}
        onChange={(e) => alterarCampo("valor", e.target.value)}
      />

      <input
        placeholder="Duracao em minutos"
        type="number"
        value={formulario.duracaoMinutos}
        onChange={(e) => alterarCampo("duracaoMinutos", e.target.value)}
      />

      <button type="submit">{servico ? "Atualizar servico" : "Salvar servico"}</button>

      {servico && (
        <button type="button" className="botao-cancelar" onClick={onCancelar}>
          Cancelar edicao
        </button>
      )}
    </form>
  );
}

export default ServicoForm;
