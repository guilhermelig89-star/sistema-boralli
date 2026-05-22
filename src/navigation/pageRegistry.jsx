import AgendaPage from "../modules/agendamentos/AgendaPage";
import AtendimentoPage from "../modules/atendimento/AtendimentoPage";
import ClientesPage from "../modules/clientes/ClientesPage";
import ConfiguracoesEmpresaPage from "../modules/configuracoes/ConfiguracoesEmpresaPage";
import DashboardPage from "../modules/dashboard/DashboardPage";
import FinanceiroPage from "../modules/financeiro/FinanceiroPage";
import PacotesPage from "../modules/pacotes/PacotesPage";
import RelatoriosPage from "../modules/relatorios/RelatoriosPage";
import ServicosPage from "../modules/servicos/ServicosPage";
import { SCREENS } from "./screens";

export const PAGE_REGISTRY = Object.freeze({
  [SCREENS.CLIENTES]: ClientesPage,
  [SCREENS.SERVICOS]: ServicosPage,
  [SCREENS.PACOTES_CLIENTES]: PacotesPage,
  [SCREENS.PACOTES_CONFIGURACOES]: PacotesPage,
  [SCREENS.AGENDA]: AgendaPage,
  [SCREENS.FINANCEIRO]: FinanceiroPage,
  [SCREENS.RELATORIOS]: RelatoriosPage,
  [SCREENS.ATENDIMENTO]: AtendimentoPage,
  [SCREENS.CONFIGURACOES_EMPRESA]: ConfiguracoesEmpresaPage,
  [SCREENS.DASHBOARD]: DashboardPage,
});
