function FinanceiroFiltros({ filtros, clientes, onAlterar }) {
  return (
    <div className="financeiro-filtros">
      <input
        type="date"
        value={filtros.dataInicio}
        onChange={(e) => onAlterar("dataInicio", e.target.value)}
      />

      <input
        type="date"
        value={filtros.dataFim}
        onChange={(e) => onAlterar("dataFim", e.target.value)}
      />

      <select value={filtros.clienteId} onChange={(e) => onAlterar("clienteId", e.target.value)}>
        <option value="">Todos os clientes</option>
        {clientes.map((cliente) => (
          <option key={cliente.id} value={cliente.id}>
            {cliente.nome}
          </option>
        ))}
      </select>

      <select value={filtros.origem} onChange={(e) => onAlterar("origem", e.target.value)}>
        <option value="sistema">Somente do sistema</option>
        <option value="venda_pacote">Venda de pacote</option>
        <option value="atendimento_avulso">Atendimento avulso</option>
        <option value="outros">Outros/manuais</option>
        <option value="todos">Tudo</option>
      </select>

      <select value={filtros.status} onChange={(e) => onAlterar("status", e.target.value)}>
        <option value="">Todos os status</option>
        <option value="confirmado">Confirmado</option>
        <option value="pendente">Pendente</option>
        <option value="cancelado">Cancelado</option>
      </select>

      <input
        placeholder="Buscar cliente, serviço ou descrição"
        value={filtros.pesquisa}
        onChange={(e) => onAlterar("pesquisa", e.target.value)}
      />

      <button type="button" onClick={() => onAlterar("limpar")}>Limpar</button>
    </div>
  );
}

export default FinanceiroFiltros;
