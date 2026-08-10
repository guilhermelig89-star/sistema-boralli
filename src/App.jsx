import "./App.css";
import "./shared/styles/buttons.css";
import { useEffect, useMemo, useState } from "react";
import Layout from "./components/Layout";
import { carregarTelaSalva, salvarTela } from "./navigation/navigationState";
import { PAGE_REGISTRY } from "./navigation/pageRegistry";
import { SCREENS } from "./navigation/screens";

function App() {
  const [telaAtual, setTelaAtual] = useState(carregarTelaSalva);

  useEffect(() => {
    salvarTela(telaAtual);
  }, [telaAtual]);

  const TelaAtiva = useMemo(() => PAGE_REGISTRY[telaAtual] || PAGE_REGISTRY[SCREENS.DASHBOARD], [telaAtual]);

  return (
    <Layout telaAtual={telaAtual} setTelaAtual={setTelaAtual}>
      <TelaAtiva onNavigate={setTelaAtual} />
    </Layout>
  );
}

export default App;
