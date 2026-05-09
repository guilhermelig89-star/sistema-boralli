function FinanceiroFiltros({ filtros, clientes, onAlterar }) {
  return (
    <div className="financeiro-filtros">
      <label>
        <span>De</span>
        <input
          type="date"
          value={filtros.dataInicio}
          onChange={(e) => onAlterar("dataInicio", e.target.value)}
        />
      </label>

      <label>
        <span>Até</span>
        <input
          type="date"
          value={filtros.dataFim}
          onChange={(e) => onAlterar("dataFim", e.target.value)}
        />
      </label>

      <label>
        <span>Cliente</span>
        <select value={filtros.clienteId} onChange={(e) => onAlterar("clienteId", e.target.value)}>
          <option value="">Todos os clientes</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nome}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Origem</span>
        <select value={filtros.origem} onChange={(e) => onAlterar("origem", e.target.value)}>
          <option value="todos">Tudo</option>
          <option value="sistema">Somente receitas do sistema</option>
          <option value="venda_pacote">Venda de pacote</option>
          <option value="atendimento_avulso">Atendimento avulso</option>
          <option value="despesa_manual">Despesas</option>
          <option value="outros">Outros/manuais</option>
        </select>
      </label>

      <label>
        <span>Status</span>
        <select value={filtros.status} onChange={(e) => onAlterar("status", e.target.value)}>
          <option value="">Todos os status</option>
          <option value="pago">Pago</option>
          <option value="parcial">Parcial</option>
          <option value="pendente">Pendente</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </label>

      <label className="financeiro-filtro-pesquisa">
        <span>Busca</span>
        <input
          placeholder="Cliente, serviço, forma, categoria ou descrição"
          value={filtros.pesquisa}
          onChange={(e) => onAlterar("pesquisa", e.target.value)}
        />
      </label>

      <button type="button" onClick={() => onAlterar("limpar")}>Mês atual</button>
    </div>
  );
}

export default FinanceiroFiltros;
