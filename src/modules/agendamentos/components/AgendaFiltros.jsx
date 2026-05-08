function AgendaFiltros({ filtros, onAlterar }) {
  return (
    <div className="filtros-agenda">
      <input
        type="date"
        value={filtros.data}
        onChange={(e) => onAlterar("data", e.target.value)}
      />

      <select value={filtros.status} onChange={(e) => onAlterar("status", e.target.value)}>
        <option value="ativos">Ativos</option>
        <option value="todos">Todos</option>
        <option value="agendado">Agendados</option>
        <option value="finalizado">Finalizados</option>
        <option value="cancelado">Cancelados</option>
      </select>

      <input
        placeholder="Pesquisar cliente ou serviço..."
        value={filtros.pesquisa}
        onChange={(e) => onAlterar("pesquisa", e.target.value)}
      />

      <button type="button" onClick={() => onAlterar("limpar", "")}>Limpar filtros</button>
    </div>
  );
}

export default AgendaFiltros;
