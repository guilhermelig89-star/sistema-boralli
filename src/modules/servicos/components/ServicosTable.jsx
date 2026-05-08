function ServicosTable({ servicos, carregando, onEditar, onDesativar }) {
  return (
    <div className="tabela-clientes">
      <div className="linha-servico cabecalho">
        <span>Servico</span>
        <span>Tipo</span>
        <span>Valor</span>
        <span>Duracao</span>
        <span>Acoes</span>
      </div>

      {carregando && (
        <div className="linha-servico">
          <span>Carregando servicos...</span>
        </div>
      )}

      {!carregando && servicos.length === 0 && (
        <div className="linha-servico">
          <span>Nenhum servico encontrado.</span>
        </div>
      )}

      {!carregando &&
        servicos.map((servico) => (
          <div className="linha-servico" key={servico.id}>
            <strong>{servico.nome}</strong>

            <span
              className={
                servico.tipo === "combo"
                  ? "badge-tipo badge-combo"
                  : "badge-tipo badge-servico"
              }
            >
              {servico.tipo === "combo" ? "Combo" : "Servico"}
            </span>

            <span className="valor-servico">
              {Number(servico.valor || 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>

            <span className="duracao-servico">{servico.duracaoMinutos || 60} min</span>

            <div className="acoes-cliente">
              <button className="botao-editar" onClick={() => onEditar(servico)}>
                Editar
              </button>

              <button
                className="botao-desativar"
                onClick={() => {
                  const confirmar = confirm("Deseja desativar este servico?");
                  if (confirmar) onDesativar(servico.id);
                }}
              >
                Desativar
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}

export default ServicosTable;
