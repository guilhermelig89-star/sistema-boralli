function Menu({ telaAtual, setTelaAtual }) {
  const itens = [
    { id: "dashboard", nome: "Painel" },
    { id: "clientes", nome: "Clientes" },
    { id: "servicos", nome: "Serviços" },
    { id: "agenda", nome: "Agenda" },
    { id: "atendimento", nome: "Atendimento" },
  ];

  return (
    <aside className="menu">
      <div className="menu-logo">
        <h2>Boralli</h2>
        <span>Sistema V1</span>
      </div>

      <nav>
        {itens.map((item) => (
          <button
            key={item.id}
            className={telaAtual === item.id ? "ativo" : ""}
            onClick={() => setTelaAtual(item.id)}
          >
            {item.nome}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Menu;