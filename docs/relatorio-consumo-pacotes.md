# Relatório técnico — Consumo duplicado de pacotes

## Causa raiz encontrada
- O consumo de pacote era gravado com `doc(historicoRef)` (ID aleatório) em múltiplos fluxos de finalização.
- Em caso de concorrência (duplo clique, duas telas abertas, reprocessamento de transação), não existia trava por `agendamentoId` nem chave idempotente no histórico.
- Resultado: era possível criar mais de um registro de histórico para o mesmo atendimento em coleções de histórico, com decremento repetido de saldo.

## Pontos vulneráveis identificados
- `finalizarAgendamentoRegistro`
- `resolverPendenciaAgendamentoRegistro` (ações `finalizar_real` e `realizado_manual` com consumo)
- `corrigirConsumoPacoteFinalizadoRegistro`

## Correções aplicadas
- Criada trava transacional por `agendamentoId` na coleção `pacotesConsumoLocks`.
- Criada validação única reutilizável `validarESinalizarConsumoPacote` para centralizar:
  - verificação de `pacoteConsumido`/`consumoPacote`;
  - lock idempotente por fluxo;
  - gravação de histórico com ID determinístico (`${agendamentoId}__${tipoHistorico}`);
  - bloqueio de histórico duplicado.
- Fluxos de consumo migrados para o helper único (finalização, pendência e correção manual).
- Criado utilitário administrativo `consumoPacoteAuditService` para:
  - detectar duplicidades por `agendamentoId`;
  - listar clientes afetadas;
  - apontar agendamentos finalizados com histórico mas sem flag;
  - corrigir estorno técnico de consumo extra sem apagar histórico válido.

## Risco de recorrência
- Residual baixo para novos consumos, pois há proteção por lock + idempotência por ID determinístico.
- Para dados históricos antigos, recomenda-se rodar o utilitário de auditoria periodicamente até saneamento completo.
