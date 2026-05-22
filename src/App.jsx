import "./App.css";
import "./shared/styles/buttons.css";
import { useMemo, useState } from "react";
import Layout from "./components/Layout";
import { PAGE_REGISTRY } from "./navigation/pageRegistry";
import { DEFAULT_SCREEN, SCREENS } from "./navigation/screens";

function App() {
  const [telaAtual, setTelaAtual] = useState(DEFAULT_SCREEN);

  const TelaAtiva = useMemo(() => PAGE_REGISTRY[telaAtual] || PAGE_REGISTRY[SCREENS.DASHBOARD], [telaAtual]);

  return (
    <Layout telaAtual={telaAtual} setTelaAtual={setTelaAtual}>
      <TelaAtiva onNavigate={setTelaAtual} />
    </Layout>
  );
}

export default App;
