import { useEffect, useRef, useState } from "react";

import { useClientes } from "../clientes/hooks/useClientes";
import "./financeiro.css";
import CategoriasDespesa from "./components/CategoriasDespesa";
import DespesaForm from "./components/DespesaForm";
import FinanceiroDre from "./components/FinanceiroDre";
import FinanceiroFiltros from "./components/FinanceiroFiltros";
import FinanceiroResumo from "./components/FinanceiroResumo";
import MovimentosTable from "./components/MovimentosTable";
import PendenciasFinanceiras from "./components/PendenciasFinanceiras";
import { useCategoriasFinanceiras } from "./hooks/useCategoriasFinanceiras";
import { useFinanceiro } from "./hooks/useFinanceiro";

function formatarDataChave(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function obterInicioMes() {
  const hoje = new Date();
  return formatarDataChave(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
}

function obterFimMes() {
  const hoje = new Date();
  return formatarDataChave(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0));
}

function criarFiltrosIniciais() {
  return {
    dataInicio: obterInicioMes(),
    dataFim: obterFimMes(),
    clienteId: "",
    origem: "todos",
    status: "",
    pesquisa: "",
  };
}

function FinanceiroPage() {
  const [filtros, setFiltros] = useState(criarFiltrosIniciais);
  const [abaDespesa, setAbaDespesa] = useState(null);
  const [secaoAtiva, setSecaoAtiva] = useState("visao-geral");
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);
  const abasDespesaRef = useRef(null);
  const [movimentosVisiveis, setMovimentosVisiveis] = useState(false);
  const { clientesAtivos } = useClientes();
  const {
    categoriasDespesa,
    carregando: carregandoCategorias,
    salvando: salvandoCategoria,
    erro: erroCategorias,
    salvarCategoria,
    removerCategoria,
  } = useCategoriasFinanceiras();
  const {
    movimentos,
    movimentosFiltrados,
    totaisFiltro,
    totaisMes,
    dreFiltro,
    carregando,
    salvando: salvandoFinanceiro,
    erro,
    salvarDespesa,
    registrarPagamentoPendente,
  } = useFinanceiro(filtros);


  useEffect(() => {
    function fecharAbasAoClicarFora(evento) {
      if (!abasDespesaRef.current?.contains(evento.target)) {
        setAbaDespesa(null);
      }
    }

    document.addEventListener("mousedown", fecharAbasAoClicarFora);

    return () => {
      document.removeEventListener("mousedown", fecharAbasAoClicarFora);
    };
  }, []);

  function alterarFiltro(campo, valor) {
    if (campo === "limpar") {
      setFiltros(criarFiltrosIniciais());
      return;
    }

    setFiltros((atuais) => ({
      ...atuais,
      [campo]: valor,
    }));
  }

  return (
    <div>
      <div className="topo-clientes">
        <div>
          <h1>Financeiro</h1>
          <p>Acompanhe receitas, pendências, descontos, despesas, resultado do período e formas de pagamento.</p>
        </div>
      </div>

      <div className="cliente-layout financeiro-layout">
        <section className="financeiro-controles" aria-label="Navegação e filtros financeiros">
          <div className="financeiro-periodo-resumo">
            <div>
              <span>Período em análise</span>
              <strong>{filtros.dataInicio.split("-").reverse().join("/")} — {filtros.dataFim.split("-").reverse().join("/")}</strong>
            </div>
            <button
              type="button"
              className="botao-filtros-financeiro"
              onClick={() => setFiltrosVisiveis((visivel) => !visivel)}
              aria-expanded={filtrosVisiveis}
            >
              {filtrosVisiveis ? "Fechar filtros" : "Filtrar período"}
            </button>
          </div>

          {filtrosVisiveis && (
            <div className="financeiro-filtros-bloco">
              <FinanceiroFiltros filtros={filtros} clientes={clientesAtivos} onAlterar={alterarFiltro} />
            </div>
          )}

          <div className="financeiro-navegacao" role="tablist" aria-label="Seções do financeiro">
            {[
              ["visao-geral", "Visão geral"],
              ["a-receber", "A receber"],
              ["despesas", "Despesas"],
              ["movimentos", "Movimentos"],
            ].map(([id, rotulo]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={secaoAtiva === id}
                className={secaoAtiva === id ? "ativo" : ""}
                onClick={() => setSecaoAtiva(id)}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </section>

        {secaoAtiva === "visao-geral" && (
          <div className="financeiro-secao" role="tabpanel">
            <div className="financeiro-secao-cabecalho">
              <div>
                <span className="financeiro-sobretitulo">PAINEL DO PERÍODO</span>
                <h2>Visão geral</h2>
                <p>Indicadores essenciais e detalhamento do resultado em um só lugar.</p>
              </div>
            </div>
            <FinanceiroResumo totaisFiltro={totaisFiltro} totaisMes={totaisMes} />
            <FinanceiroDre dre={dreFiltro} />
          </div>
        )}

        {secaoAtiva === "a-receber" && (
          <PendenciasFinanceiras
            movimentos={movimentos}
            carregando={carregando}
            salvando={salvandoFinanceiro}
            onRegistrarPagamento={registrarPagamentoPendente}
          />
        )}

        {secaoAtiva === "despesas" && (
          <div className="financeiro-configuracao-abas" role="tabpanel">
            <div className="financeiro-abas-topo">
              <div>
                <span className="financeiro-sobretitulo">GESTÃO DE SAÍDAS</span>
                <h2>Despesas</h2>
                <p>Lance custos e organize as categorias usadas no DRE.</p>
              </div>

              <div className="abas-financeiro" role="tablist" aria-label="Opções de despesas" ref={abasDespesaRef}>
                <button type="button" className={abaDespesa === "lancar" ? "ativo" : ""} onClick={() => setAbaDespesa((abaAtual) => (abaAtual === "lancar" ? null : "lancar"))}>Lançar despesa</button>
                <button type="button" className={abaDespesa === "categorias" ? "ativo" : ""} onClick={() => setAbaDespesa((abaAtual) => (abaAtual === "categorias" ? null : "categorias"))}>Categorias</button>
              </div>
            </div>

            {!abaDespesa && <p className="financeiro-acao-vazia">Escolha uma ação acima para lançar uma despesa ou gerenciar categorias.</p>}
            {abaDespesa === "lancar" && <DespesaForm categorias={categoriasDespesa} onSalvar={salvarDespesa} salvando={salvandoFinanceiro} />}
            {abaDespesa === "categorias" && <CategoriasDespesa categorias={categoriasDespesa} carregando={carregandoCategorias} salvando={salvandoCategoria} erro={erroCategorias} onSalvar={salvarCategoria} onRemover={removerCategoria} />}
          </div>
        )}

        {secaoAtiva === "movimentos" && (
          <div className="lista-clientes" role="tabpanel">
            <div className="financeiro-movimentos-topo">
              <div>
                <span className="financeiro-sobretitulo">HISTÓRICO</span>
                <h2>Movimentos financeiros</h2>
              </div>
              <button type="button" className="botao-principal" onClick={() => setMovimentosVisiveis((visivel) => !visivel)} aria-expanded={movimentosVisiveis}>
                {movimentosVisiveis ? "Recolher lista" : "Carregar movimentos"}
              </button>
            </div>
            {!movimentosVisiveis && <p className="financeiro-acao-vazia">A lista fica recolhida para manter a página leve. Carregue quando precisar consultar os lançamentos.</p>}
            {movimentosVisiveis && <>{erro && <p>{erro}</p>}<MovimentosTable movimentos={movimentosFiltrados} carregando={carregando} /></>}
          </div>
        )}
      </div>
    </div>
  );
}

export default FinanceiroPage;
