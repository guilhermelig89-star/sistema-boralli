function ClientesTable({ clientes, carregando, onEditar, onDesativar }) {
  return (
    <div className="tabela-clientes">
      <div className="linha-cliente cabecalho">
        <span>Nome</span>
        <span>Telefone</span>
        <span>Bairro</span>
        <span>Cidade</span>
        <span>Ações</span>
      </div>

      {carregando && (
        <div className="linha-cliente">
          <span>Carregando clientes...</span>
        </div>
      )}

      {!carregando && clientes.length === 0 && (
        <div className="linha-cliente">
          <span>Nenhum cliente encontrado.</span>
        </div>
      )}

      {!carregando &&
        clientes.map((cliente) => (
          <div className="linha-cliente" key={cliente.id}>
            <strong>{cliente.nome}</strong>
            <span>{cliente.telefone}</span>
            <span>{cliente.bairro || "-"}</span>
            <span>{cliente.cidade || "-"}</span>

            <div className="acoes-cliente">
              <button className="botao-editar" onClick={() => onEditar(cliente)}>
                Editar
              </button>

              <button
                className="botao-desativar"
                onClick={() => {
                  const confirmar = confirm("Deseja desativar este cliente?");
                  if (confirmar) onDesativar(cliente.id);
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

export default ClientesTable;
