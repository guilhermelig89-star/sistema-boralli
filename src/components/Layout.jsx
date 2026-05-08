import Menu from "./Menu";

function Layout({ telaAtual, setTelaAtual, children }) {
  return (
    <div className="app-layout">
      <Menu telaAtual={telaAtual} setTelaAtual={setTelaAtual} />

      <main className="conteudo">
        {children}
      </main>
    </div>
  );
}

export default Layout;