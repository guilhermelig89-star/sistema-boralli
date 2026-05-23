# Relatório técnico — Sistema de pacotes e históricos (reanálise completa)

## Escopo revisado
- Módulo de domínio de pacotes (`pacotesDomain`) para cálculo de saldos, consumo e montagem de estrutura de pacote.
- Módulo de domínio de histórico (`consumoHistoricoDomain`) para identificar consumo ativo, buscar consumo por agendamento e recalcular visão agregada.
- Repositório de pacotes (`pacotesRepository`) com fluxos de observação, criação, estorno e recálculo por histórico ativo.
- Serviço de auditoria (`consumoPacoteAuditService`) para detectar duplicidades e corrigir inconsistências.
- Serviço de aplicação (`pacotesService`) para validações de entrada e orquestração.

## Arquitetura atual (resumo)
1. **Origem da verdade do saldo**
   - O pacote mantém campos agregados (`quantidadeUtilizada`, `saldoRestante`, `status`) e, quando aplicável, lista de `itens` por serviço.
   - O histórico (`pacotesHistorico`) guarda eventos de consumo por atendimento (`agendamentoId`).
2. **Consumo**
   - O domínio calcula o consumo de 1 unidade por operação e retorna: atualização de pacote + metadados de consumo (`saldoAntes`, `saldoDepois`, serviço, cliente).
3. **Reversão e saneamento**
   - Estorno transacional marca histórico como estornado/inválido e recalcula saldos com base apenas em históricos ativos.
   - Recálculo manual também reconstrói o agregado do pacote a partir do histórico ativo.
4. **Auditoria operacional**
   - Existe detecção de duplicidade por `agendamentoId` e rotina de ajuste para manter um registro e compensar excedentes no saldo.

## Pontos fortes confirmados
- **Separação entre domínio e infraestrutura**: regras de saldo/consumo estão concentradas no domínio, enquanto Firestore fica no repositório.
- **Transações em operações críticas** (`runTransaction`) para estorno e recálculo, reduzindo risco de escrita parcial.
- **Tratamento de histórico ativo/inativo** consistente (estornado/cancelado/inválido/removido não contam no saldo).
- **Suporte a pacote composto por múltiplos serviços** (`itens`) com recálculo por serviço.
- **Rastro de auditoria** em ações administrativas (estorno e recálculo manual).

## Riscos e lacunas encontrados na reanálise

### 1) Correção de duplicidade não inativa os históricos excedentes
- A rotina `corrigirConsumosDuplicados` ajusta saldo e marca agendamento, mas não marca explicitamente os registros excedentes como `estornado/cancelado/valido=false`.
- Impacto: se houver recálculo posterior baseado em histórico ativo, os registros duplicados podem voltar a influenciar contagens dependendo da rotina usada.
- Recomendação: durante a correção, marcar registros removidos como inativos (soft delete lógico) com metadados de correção.

### 2) Detecção de duplicidade baseada apenas em quantidade por `agendamentoId`
- A auditoria marca como duplicidade sempre que há mais de um histórico no mesmo agendamento.
- Em cenários futuros com múltiplos consumos legítimos por atendimento (ex.: combo multi-serviço no mesmo agendamento), pode gerar falso positivo.
- Recomendação: usar chave de deduplicação por tipo de evento + serviço + pacote + agendamento, não apenas cardinalidade.

### 3) Dependência de snapshots completos em auditorias/recálculos
- Algumas rotinas carregam coleções inteiras para filtrar em memória.
- Impacto: custo e latência crescentes com volume histórico.
- Recomendação: migrar para consultas filtradas por `where` (por `agendamentoId` e `pacoteClienteId`) e paginação quando aplicável.

### 4) Divergência potencial entre agregado e histórico
- O agregado no pacote é prático para leitura rápida, mas requer disciplina para qualquer escrita concorrente.
- Já existem operações de recálculo para saneamento, porém não há evidência de verificação automática periódica.
- Recomendação: job de consistência (diário/semanal) comparando agregado x histórico ativo e gerando relatório de desvios.

## Conclusão técnica
O sistema está **mais robusto** que a versão original, especialmente por usar transações, domínio explícito e ferramentas de auditoria/recálculo. Ainda assim, a maior oportunidade de melhoria está na **idempotência e saneamento definitivo de duplicidades**, para impedir que um ajuste pontual seja revertido por recálculos futuros.

## Plano recomendado (prioridade)
1. **Alta**: ajustar `corrigirConsumosDuplicados` para invalidar historicamente os registros excedentes.
2. **Alta**: formalizar chave idempotente de consumo por evento (ex.: `agendamentoId + tipo + servicoId + pacoteId`).
3. **Média**: substituir leituras integrais por consultas segmentadas no Firestore.
4. **Média**: implementar verificação recorrente de consistência agregado x histórico.
5. **Baixa**: painel administrativo com métricas de saúde (duplicidades, estornos, recálculos, desvios).

## Status geral da reanálise
- **Confiabilidade atual**: boa.
- **Risco residual**: moderado em cenários de alta concorrência/histórico legado.
- **Prontidão para escala**: média, dependente de otimizações de consulta e governança de consistência.
