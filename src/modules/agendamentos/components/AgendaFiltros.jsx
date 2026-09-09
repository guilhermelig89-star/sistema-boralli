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

      <div className={`filtros-agenda ${filtros.visualizacao === "disponiveis" ? "filtros-horarios-vagos" : ""}`}>
        <select
          aria-label="Escolher visualização da agenda"
          value={filtros.visualizacao}
          onChange={(e) => onAlterar("visualizacao", e.target.value)}
        >
          <option value="agendamentos">Agendamentos</option>
          <option value="disponiveis">Horários vagos</option>
        </select>

        <input
          type="date"
          aria-label="Filtrar por data"
          value={filtros.data}
          onChange={(e) => onAlterar("data", e.target.value)}
        />

        {filtros.visualizacao === "disponiveis" ? (
          <select aria-label="Duração do encaixe" value={filtros.duracao} onChange={(e) => onAlterar("duracao", e.target.value)}>
            <option value="30">30 minutos</option>
            <option value="45">45 minutos</option>
            <option value="60">1 hora</option>
            <option value="90">1 hora e 30 min</option>
            <option value="120">2 horas</option>
          </select>
        ) : (
          <select aria-label="Filtrar por status" value={filtros.status} onChange={(e) => onAlterar("status", e.target.value)}>
            <option value="ativos">Ativos</option>
            <option value="todos">Todos</option>
            <option value="agendado">Agendados</option>
            <option value="finalizado">Finalizados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        )}

        {filtros.visualizacao === "agendamentos" && (
          <input
            aria-label="Pesquisar cliente ou serviço"
            placeholder="Pesquisar cliente ou serviço..."
            value={filtros.pesquisa}
            onChange={(e) => onAlterar("pesquisa", e.target.value)}
          />
        )}

        <button type="button" onClick={() => onAlterar("limpar", "")}>Limpar filtros</button>
      </div>
    </div>
  );
}

export default AgendaFiltros;
