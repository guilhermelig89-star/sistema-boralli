# Sistema Boralli

Sistema de gestão de agenda, atendimentos, clientes, pacotes e financeiro.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Verificações

```bash
npm test
npm run lint
npm run build
```

## Segurança dos dados

As melhorias de navegação são mantidas no navegador e não alteram os registros
operacionais armazenados no Firebase. A última tela acessada é validada antes de
ser restaurada; telas antigas ou desconhecidas direcionam para o Painel.

Consulte [`docs/analise-usabilidade.md`](docs/analise-usabilidade.md) para o
levantamento de redundâncias e o plano seguro de evolução do sistema.
