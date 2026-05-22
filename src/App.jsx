import "./App.css";
import "./shared/styles/buttons.css";
import { useState } from "react";
import Layout from "./components/Layout";
import AgendaPage from "./modules/agendamentos/AgendaPage";
import AtendimentoPage from "./modules/atendimento/AtendimentoPage";
import ClientesPage from "./modules/clientes/ClientesPage";
import DashboardPage from "./modules/dashboard/DashboardPage";
import FinanceiroPage from "./modules/financeiro/FinanceiroPage";
import PacotesPage from "./modules/pacotes/PacotesPage";
import RelatoriosPage from "./modules/relatorios/RelatoriosPage";
import ServicosPage from "./modules/servicos/ServicosPage";
import ConfiguracoesEmpresaPage from "./modules/configuracoes/ConfiguracoesEmpresaPage";

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
      case "financeiro":
        return <FinanceiroPage />;
      case "relatorios":
        return <RelatoriosPage />;
      case "atendimento":
        return <AtendimentoPage />;
      case "configuracoesEmpresa":
        return <ConfiguracoesEmpresaPage />;
      default:
        return <DashboardPage onNavigate={setTelaAtual} />;
    }
  }

  return (
    <Layout telaAtual={telaAtual} setTelaAtual={setTelaAtual}>
      {renderizarTela()}
    </Layout>
  );
}

export default App;
