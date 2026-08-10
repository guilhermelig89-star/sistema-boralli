# Análise de usabilidade e redundâncias

## Objetivo

Tornar o uso diário mais rápido sem migrar, apagar ou regravar clientes,
agendamentos, pacotes e lançamentos financeiros já salvos.

## Melhoria aplicada nesta etapa

- A última tela utilizada passa a ser restaurada ao reabrir o sistema.
- O grupo do menu correspondente à tela atual abre automaticamente, eliminando
  o clique repetido de abrir o grupo antes de acessar outra função relacionada.
- A preferência fica somente no `localStorage` do navegador. Nenhum documento do
  Firebase é criado ou alterado por esse recurso.
- O valor restaurado é validado contra as telas existentes. Valores inválidos e
  preferências de versões antigas retornam com segurança ao Painel.

## Oportunidades encontradas

### Prioridade alta — baixo risco

1. **Filtros reutilizáveis:** manter pesquisa e período durante a troca entre
   Agenda, Clientes e Financeiro, com ação explícita “Limpar filtros”. Preferir
   estado local do navegador, sem gravar filtros nos cadastros.
2. **Mensagens padronizadas:** substituir chamadas dispersas de `alert` e
   `confirm` por um componente único de aviso, confirmação e resultado. Isso
   reduz repetição e torna mais claro quando uma operação terminou.
3. **Seletores com busca:** clientes, serviços e pacotes tendem a crescer; campos
   pesquisáveis evitam percorrer listas longas e reduzem escolhas incorretas.

### Prioridade média — exige testes de integração

1. **Contexto compartilhado de dados:** Menu, Clientes, Agenda e Atendimento
   podem solicitar os mesmos agendamentos em hooks diferentes. Um provedor por
   domínio pode compartilhar a assinatura em tempo real e evitar leituras e
   processamento repetidos, mantendo os mesmos repositórios.
2. **Fluxo único de atendimento:** concentrar iniciar, finalizar, consumir pacote
   e lançar financeiro em uma sequência guiada. Antes disso, devem existir testes
   cobrindo cancelamento, estorno e repetição da confirmação (idempotência).
3. **Formulários reutilizáveis:** extrair padrões de campo, erros e botões sem
   unificar regras de negócio distintas. A alteração deve ser apenas visual até
   haver cobertura dos serviços de cada módulo.

### Prioridade alta — risco de dados, executar separadamente

1. **Idempotência por operação:** consumo de pacote e movimento financeiro devem
   possuir uma chave estável por agendamento/operação para impedir duplicação em
   clique duplo, reconexão ou nova tentativa.
2. **Auditoria antes de correção:** qualquer saneamento deve oferecer modo de
   pré-visualização, contagem, exportação/backup e relatório por registro antes
   de escrever no Firebase.
3. **Migrações versionadas:** mudanças no formato de documentos devem ser feitas
   por scripts versionados e reversíveis, nunca automaticamente ao abrir uma tela.

## Sequência recomendada

1. Medir os fluxos mais usados e registrar cliques/tempo sem dados pessoais.
2. Implementar filtros persistentes e avisos padronizados.
3. Adicionar testes de integração para fechamento financeiro e consumo de pacote.
4. Compartilhar assinaturas dos hooks somente após comparar leituras e resultados.
5. Tratar inconsistências de dados em rotina administrativa com pré-visualização
   e backup, separada das melhorias de interface.

## Critérios para preservar o que já está salvo

- Recursos de interface não escrevem em coleções operacionais.
- Toda escrita crítica deve ser transacional e repetível sem duplicar efeitos.
- Scripts de correção iniciam em modo de pré-visualização.
- Antes de alterar esquema ou saldo, gerar backup e relatório de diferenças.
- Manter testes automatizados das regras atuais antes de refatorar serviços.
