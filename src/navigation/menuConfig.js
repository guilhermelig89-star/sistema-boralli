import { SCREENS } from "./screens";

export const MENU_GROUPS = [
  {
    id: "atendimentoGrupo",
    nome: "Atendimento",
    itens: [
      { id: SCREENS.AGENDA, nome: "Agenda" },
      { id: SCREENS.ATENDIMENTO, nome: "Modo Atendimento" },
    ],
  },
  {
    id: "clientesGrupo",
    nome: "Clientes",
    itens: [
      { id: SCREENS.CLIENTES, nome: "Cadastro de clientes" },
      { id: SCREENS.PACOTES_CLIENTES, nome: "Pacotes/Combos do cliente" },
    ],
  },
  {
    id: "financeiroGrupo",
    nome: "Financeiro",
    itens: [{ id: SCREENS.FINANCEIRO, nome: "Receitas e despesas" }],
  },
  {
    id: "configuracoesGrupo",
    nome: "Configurações",
    itens: [
      { id: SCREENS.CONFIGURACOES_EMPRESA, nome: "Dados da empresa" },
      { id: SCREENS.SERVICOS, nome: "Serviços" },
      { id: SCREENS.PACOTES_CONFIGURACOES, nome: "Pacotes/Combos" },
    ],
  },
  {
    id: "relatoriosGrupo",
    nome: "Relatórios",
    itens: [{ id: SCREENS.RELATORIOS, nome: "Relatórios e impressões" }],
  },
];
