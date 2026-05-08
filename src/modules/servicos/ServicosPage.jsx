import { useEffect, useState } from "react";
import {
  listarServicos,
  criarServico,
  editarServico,
  desativarServico,
} from "../../services/servicosService";

function ServicosPage() {
  const [servicos, setServicos] = useState([]);
  const [servicoEditando, setServicoEditando] = useState(null);

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("avulso");
  const [valor, setValor] = useState("");
  const [duracaoMinutos, setDuracaoMinutos] = useState("60");
  const [pesquisa, setPesquisa] = useState("");

  async function carregarServicos() {
    const dados = await listarServicos();
    setServicos(dados);
  }

  function limparFormulario() {
    setServicoEditando(null);
    setTipo("avulso");
    setNome("");
    setValor("");
    setDuracaoMinutos("60");
  }

  async function salvarServico(e) {
    e.preventDefault();

    if (!nome) return;

    const dadosServico = {
      nome,
      tipo,
      valor,
      duracaoMinutos,
    };

    if (servicoEditando) {
      await editarServico(servicoEditando, dadosServico);
    } else {
      await criarServico(dadosServico);
    }

    limparFormulario();
    carregarServicos();
  }

  useEffect(() => {
    carregarServicos();
  }, []);

  const servicosFiltrados = servicos
    .filter((servico) => servico.ativo !== false)
    .filter((servico) =>
      servico.nome?.toLowerCase().includes(pesquisa.toLowerCase())
    );

  return (
    <div>
      <div className="topo-clientes">
        <div>
          <h1>Serviços</h1>
          <p>Cadastre os serviços usados na agenda e no atendimento.</p>
        </div>
      </div>

      <div className="cliente-layout">
        <form className="form-cliente" onSubmit={salvarServico}>
          <h2>{servicoEditando ? "Editar serviço" : "Novo serviço"}</h2>

          <input
            placeholder="Nome do serviço"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
  <option value="avulso">avulso</option>
  <option value="combo">Combo</option>
</select>

          <input
  placeholder="Valor"
  type="number"
  autoComplete="off"
  value={valor}
  onChange={(e) => setValor(e.target.value)}
/>

          <input
            placeholder="Duração em minutos"
            type="number"
            value={duracaoMinutos}
            onChange={(e) => setDuracaoMinutos(e.target.value)}
          />

          <button type="submit">
            {servicoEditando ? "Atualizar serviço" : "Salvar serviço"}
          </button>

          {servicoEditando && (
            <button type="button" className="botao-cancelar" onClick={limparFormulario}>
              Cancelar edição
            </button>
          )}
        </form>

        <div className="lista-clientes">
          <input
            className="pesquisa-clientes"
            placeholder="Pesquisar serviço..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />

          <h2>Serviços cadastrados</h2>

          <div className="tabela-clientes">
           <div className="linha-servico cabecalho">
  <span>Serviço</span>
  <span>Tipo</span>
  <span>Valor</span>
  <span>Duração</span>
  <span>Ações</span>
</div>

            {servicosFiltrados.map((servico) => (
              <div className="linha-servico" key={servico.id}>
  <strong>{servico.nome}</strong>

  <span
  className={
    servico.tipo === "combo"
      ? "badge-tipo badge-combo"
      : "badge-tipo badge-servico"
  }
>
  {servico.tipo === "combo"
    ? "Combo"
    : "serviço"}
</span>

  <span className="valor-servico">
    {Number(servico.valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })}
  </span>

 <span className="duracao-servico">
  {servico.duracaoMinutos || 60} min
</span>

  <div className="acoes-cliente">
                  <button
                    className="botao-editar"
                    onClick={() => {
                      setServicoEditando(servico.id);
                      setNome(servico.nome || "");
                      setValor(servico.valor || "");
                      setDuracaoMinutos(servico.duracaoMinutos || "60");
                    }}
                  >
                    Editar
                  </button>

                  <button
                    className="botao-desativar"
                    onClick={async () => {
                      const confirmar = confirm("Deseja desativar este serviço?");
                      if (!confirmar) return;

                      await desativarServico(servico.id);
                      carregarServicos();
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

export default ServicosPage;