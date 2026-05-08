import "./App.css";
import { useState } from "react";
import Layout from "./components/Layout";
import AgendaPage from "./modules/agendamentos/AgendaPage";
import ClientesPage from "./modules/clientes/ClientesPage";
import PacotesPage from "./modules/pacotes/PacotesPage";
import ServicosPage from "./modules/servicos/ServicosPage";

function App() {
  const [telaAtual, setTelaAtual] = useState("dashboard");

  function renderizarTela() {
    switch (telaAtual) {
      case "clientes":
        return <ClientesPage />;
      case "servicos":
        return <ServicosPage />;
      case "pacotes":
        return <PacotesPage />;
      case "agenda":
        return <AgendaPage />;
      case "atendimento":
        return <h1>Atendimento</h1>;
      default:
        return (
          <section className="dashboard">
            <div className="dashboard-header">
              <div>
                <span className="tag">Sistema Boralli V1</span>
                <h1>Painel</h1>
                <p>Resumo geral para acompanhar agenda, clientes e atendimentos.</p>
              </div>

              <button className="botao-principal" onClick={() => setTelaAtual("agenda")}>
                Novo agendamento
              </button>
            </div>

            <div className="card-grid">
              <div className="card">
                <span>Clientes cadastrados</span>
                <strong>0</strong>
                <p>Total de clientes ativos</p>
              </div>

              <div className="card">
                <span>Agenda de hoje</span>
                <strong>0</strong>
                <p>Atendimentos programados</p>
              </div>

              <div className="card">
                <span>Pacotes ativos</span>
                <strong>0</strong>
                <p>Combos comprados por clientes</p>
              </div>

              <div className="card">
                <span>Serviços ativos</span>
                <strong>0</strong>
                <p>Catálogo disponível</p>
              </div>
            </div>

            <div className="painel-duplo">
              <div className="bloco">
                <h2>Próximos horários</h2>
                <p>Nenhum agendamento para exibir ainda.</p>
              </div>

              <div className="bloco">
                <h2>Ações rápidas</h2>
                <button onClick={() => setTelaAtual("clientes")}>Adicionar cliente</button>
                <button onClick={() => setTelaAtual("servicos")}>Cadastrar serviço</button>
                <button onClick={() => setTelaAtual("pacotes")}>Vender pacote</button>
                <button onClick={() => setTelaAtual("agenda")}>Abrir agenda</button>
              </div>
            </div>
          </section>
        );
    }
  }

  return (
    <Layout telaAtual={telaAtual} setTelaAtual={setTelaAtual}>
      {renderizarTela()}
    </Layout>
  );
}

export default App;
