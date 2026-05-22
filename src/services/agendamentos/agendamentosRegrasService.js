import {
  corrigirConsumoPacoteFinalizadoRegistro,
  finalizarAgendamentoRegistro,
  venderPacoteNoAtendimentoRegistro,
} from "../../modules/agendamentos/repositories/agendamentosRepository";
import { withFriendlyError } from "../../shared/utils/errorHandling";

export const finalizarAtendimentoComFinanceiro = withFriendlyError(
  (agendamentoId, fechamentoFinanceiro) => finalizarAgendamentoRegistro(agendamentoId, fechamentoFinanceiro),
  "Não foi possível finalizar o atendimento."
);

export const consumirPacoteNoAtendimento = withFriendlyError(
  (agendamentoId, vendaPacote) => venderPacoteNoAtendimentoRegistro(agendamentoId, vendaPacote),
  "Não foi possível trocar para pacote durante o atendimento."
);

export const corrigirConsumoPacoteFinalizado = withFriendlyError(
  (agendamentoId) => corrigirConsumoPacoteFinalizadoRegistro(agendamentoId),
  "Não foi possível corrigir o consumo do pacote."
);
