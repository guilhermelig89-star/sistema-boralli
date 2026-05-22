const CAMPOS_TEXTO = [
  "nomeEmpresa",
  "nomeFantasia",
  "telefone",
  "whatsapp",
  "instagram",
  "endereco",
  "cidade",
  "documentoFiscal",
  "textoRodape",
  "corPrincipal",
  "logoUrl",
  "logoPath",
];

export function montarConfiguracaoEmpresa(dados = {}) {
  return CAMPOS_TEXTO.reduce((acc, campo) => {
    acc[campo] = String(dados[campo] || "").trim();
    return acc;
  }, {});
}

export function validarConfiguracaoEmpresa(dados = {}) {
  const configuracao = montarConfiguracaoEmpresa(dados);

  if (!configuracao.nomeEmpresa) {
    throw new Error("Informe o nome da empresa.");
  }

  if (!configuracao.corPrincipal) {
    configuracao.corPrincipal = "#5b8def";
  }

  return configuracao;
}
