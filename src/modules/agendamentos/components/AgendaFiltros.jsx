function AgendaFiltros({ filtros, onAlterar }) {
  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);
  const formatarDataFiltro = (data) => {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  };

  return (
    <div className="filtros-agenda-container">
      <div className="atalhos-data" aria-label="Atalhos de data">
        <button
          type="button"
          className={filtros.data === formatarDataFiltro(hoje) ? "ativo" : ""}
          onClick={() => onAlterar("data", formatarDataFiltro(hoje))}
        >
          Hoje
        </button>
        <button
          type="button"
          className={filtros.data === formatarDataFiltro(amanha) ? "ativo" : ""}
          onClick={() => onAlterar("data", formatarDataFiltro(amanha))}
        >
          Amanhã
        </button>
        <button
          type="button"
          className={!filtros.data ? "ativo" : ""}
          onClick={() => onAlterar("data", "")}
        >
          Todos os dias
        </button>
      </div>

      <div className="filtros-agenda">
        <input
          type="date"
          aria-label="Filtrar por data"
          value={filtros.data}
          onChange={(e) => onAlterar("data", e.target.value)}
        />

        <select aria-label="Filtrar por status" value={filtros.status} onChange={(e) => onAlterar("status", e.target.value)}>
          <option value="ativos">Ativos</option>
          <option value="todos">Todos</option>
          <option value="agendado">Agendados</option>
          <option value="finalizado">Finalizados</option>
          <option value="cancelado">Cancelados</option>
        </select>

        <input
          aria-label="Pesquisar cliente ou serviço"
          placeholder="Pesquisar cliente ou serviço..."
          value={filtros.pesquisa}
          onChange={(e) => onAlterar("pesquisa", e.target.value)}
        />

        <button type="button" onClick={() => onAlterar("limpar", "")}>Limpar filtros</button>
      </div>
    </div>
  );
}

export default AgendaFiltros;
