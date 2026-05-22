import { useEffect, useState } from "react";

import {
  buscarConfiguracaoEmpresa,
  enviarLogoEmpresa,
  salvarConfiguracaoEmpresaRegistro,
} from "../repositories/configuracaoEmpresaRepository";
import { montarConfiguracaoEmpresa, validarConfiguracaoEmpresa } from "../services/configuracaoEmpresaService";

const ESTADO_INICIAL = {
  nomeEmpresa: "",
  nomeFantasia: "",
  telefone: "",
  whatsapp: "",
  instagram: "",
  endereco: "",
  cidade: "",
  documentoFiscal: "",
  textoRodape: "",
  corPrincipal: "#5b8def",
  logoUrl: "",
  logoPath: "",
};

export function useConfiguracaoEmpresa() {
  const [configuracao, setConfiguracao] = useState(ESTADO_INICIAL);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function carregar() {
      try {
        const dados = await buscarConfiguracaoEmpresa();
        if (dados) {
          setConfiguracao({
            ...ESTADO_INICIAL,
            ...montarConfiguracaoEmpresa(dados),
            corPrincipal: dados.corPrincipal || "#5b8def",
          });
        }
      } catch (erroFirebase) {
        console.error("Erro ao carregar configurações da empresa", erroFirebase);
        setErro("Não foi possível carregar as configurações da empresa.");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  function atualizarCampo(campo, valor) {
    setConfiguracao((atual) => ({ ...atual, [campo]: valor }));
  }

  async function salvarConfiguracao(arquivoLogo) {
    setErro(null);
    setSalvando(true);

    try {
      const base = validarConfiguracaoEmpresa(configuracao);
      let dadosParaSalvar = { ...base };

      if (arquivoLogo) {
        const { logoUrl, logoPath } = await enviarLogoEmpresa(arquivoLogo, configuracao.logoPath);
        dadosParaSalvar = { ...dadosParaSalvar, logoUrl, logoPath };
      }

      await salvarConfiguracaoEmpresaRegistro(dadosParaSalvar);
      setConfiguracao((atual) => ({ ...atual, ...dadosParaSalvar }));
    } finally {
      setSalvando(false);
    }
  }

  return {
    configuracao,
    carregando,
    salvando,
    erro,
    atualizarCampo,
    salvarConfiguracao,
  };
}
