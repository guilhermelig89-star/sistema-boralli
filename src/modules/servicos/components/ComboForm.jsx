import { useMemo, useState } from "react";

import ComboCalculator from "./ComboCalculator";
import {
  calcularCombo,
  calcularDescontoPercentualPorValor,
  calcularPrecoComDesconto,
  calcularTotalAvulsoCombo,
  obterValorServico,
} from "../services/comboCalculatorService";

const comboInicial = {
  nome: "",
  valor: "",
  descontoPercentual: "0",
  servicoId: "",
  quantidade: "1",
  observacoes: "",
  itens: [],
};

function numero(valor, padrao = 0) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : padrao;
}

function montarFormularioCombo(combo, servicos) {
  if (!combo) return comboInicial;

  const itens = Array.isArray(combo.itens) ? combo.itens : [];
  const totalAvulso = calcularTotalAvulsoCombo(itens, servicos);
  const descontoCalculado = calcularDescontoPercentualPorValor(totalAvulso, combo.valor);
  const descontoPercentual = combo.descontoPercentual ?? combo.economiaPercentual ?? descontoCalculado;

  return {
    nome: combo.nome || "",
    valor: combo.valor ?? "",
    descontoPercentual: Number(descontoPercentual || 0).toFixed(2),
    servicoId: "",
    quantidade: "1",
    observacoes: combo.observacoes || "",
    itens,
  };
}

function montarItensComValor(itens, servicos) {
  return itens.map((item) => ({
    ...item,
    valorUnitario: numero(item.valorUnitario, obterValorServico(item.servicoId, servicos)),
  }));
}

function recalcularValorPorDesconto(itens, servicos, descontoPercentual) {
  const totalAvulso = calcularTotalAvulsoCombo(itens, servicos);
  return calcularPrecoComDesconto(totalAvulso, descontoPercentual).toFixed(2);
}

function ComboForm({ combo, servicos, onSalvar, onCancelar }) {
  const [formulario, setFormulario] = useState(() => montarFormularioCombo(combo, servicos));

  const servicoSelecionado = useMemo(
    () => servicos.find((servico) => servico.id === formulario.servicoId),
    [servicos, formulario.servicoId]
  );

  const calculosCombo = useMemo(
    () => calcularCombo({
      itens: formulario.itens,
      servicos,
      descontoPercentual: formulario.descontoPercentual,
      precoFinal: formulario.valor,
    }),
    [formulario.descontoPercentual, formulario.itens, formulario.valor, servicos]
  );

  function alterarCampo(campo, valor) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function alterarDesconto(valor) {
    setFormulario((atual) => ({
      ...atual,
      descontoPercentual: valor,
      valor: recalcularValorPorDesconto(atual.itens, servicos, valor),
    }));
  }

  function alterarValorFinal(valor) {
    setFormulario((atual) => {
      const totalAvulso = calcularTotalAvulsoCombo(atual.itens, servicos);
      const descontoPercentual = calcularDescontoPercentualPorValor(totalAvulso, valor);

      return {
        ...atual,
        valor,
        descontoPercentual: descontoPercentual.toFixed(2),
      };
    });
  }

  function adicionarItem() {
    const quantidade = Number(formulario.quantidade || 0);

    if (!servicoSelecionado || quantidade <= 0) {
      alert("Selecione um serviço e informe a quantidade.");
      return;
    }

    setFormulario((atual) => {
      const itemExistente = atual.itens.find((item) => item.servicoId === servicoSelecionado.id);
      const itens = itemExistente
        ? atual.itens.map((item) =>
            item.servicoId === servicoSelecionado.id
              ? {
                  ...item,
                  quantidade: Number(item.quantidade || 0) + quantidade,
                  valorUnitario: obterValorServico(servicoSelecionado.id, servicos),
                }
              : item
          )
        : [
            ...atual.itens,
            {
              servicoId: servicoSelecionado.id,
              servicoNome: servicoSelecionado.nome,
              quantidade,
              valorUnitario: obterValorServico(servicoSelecionado.id, servicos),
            },
          ];

      return {
        ...atual,
        itens,
        valor: recalcularValorPorDesconto(itens, servicos, atual.descontoPercentual),
        servicoId: "",
        quantidade: "1",
      };
    });
  }

  function removerItem(servicoId) {
    setFormulario((atual) => {
      const itens = atual.itens.filter((item) => item.servicoId !== servicoId);

      return {
        ...atual,
        itens,
        valor: recalcularValorPorDesconto(itens, servicos, atual.descontoPercentual),
      };
    });
  }

  async function salvar(e) {
    e.preventDefault();

    await onSalvar({
      ...formulario,
      itens: montarItensComValor(formulario.itens, servicos),
      totalAvulso: calculosCombo.totalAvulso,
      descontoPercentual: calculosCombo.economiaPercentual,
      descontoValor: calculosCombo.descontoValor,
      precoSugerido: calculosCombo.precoSugerido,
      economiaValor: calculosCombo.economiaValor,
      economiaPercentual: calculosCombo.economiaPercentual,
      fraseEconomia: calculosCombo.fraseEconomia,
    });

    if (!combo) {
      setFormulario(comboInicial);
    }
  }

  return (
    <form className="form-cliente form-combo" onSubmit={salvar}>
      <div className="cabecalho-form-combo">
        <div>
          <h2>{combo ? "Editar combo" : "Novo combo"}</h2>
          <p>Monte o pacote e veja automaticamente a economia em relação aos serviços avulsos.</p>
        </div>
      </div>

      <label className="campo-combo campo-combo-nome">
        <span>Nome do combo</span>
        <input
          placeholder="Ex.: Combo 4 mãos"
          value={formulario.nome}
          onChange={(e) => alterarCampo("nome", e.target.value)}
        />
      </label>

      <div className="combo-itens-linha">
        <label className="campo-combo">
          <span>Serviço</span>
          <select value={formulario.servicoId} onChange={(e) => alterarCampo("servicoId", e.target.value)}>
            <option value="">Adicionar serviço ao combo</option>
            {servicos.map((servico) => (
              <option key={servico.id} value={servico.id}>
                {servico.nome} - {Number(servico.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </option>
            ))}
          </select>
        </label>

        <label className="campo-combo campo-combo-quantidade">
          <span>Quantidade</span>
          <input
            placeholder="Quantidade"
            type="number"
            min="1"
            value={formulario.quantidade}
            onChange={(e) => alterarCampo("quantidade", e.target.value)}
          />
        </label>

        <button type="button" className="botao-cancelar botao-adicionar-combo" onClick={adicionarItem}>
          Adicionar item
        </button>
      </div>

      <div className="resumo-combo">
        {formulario.itens.length === 0 && <span>Nenhum serviço adicionado ao combo.</span>}
        {formulario.itens.map((item) => (
          <div className="item-combo" key={item.servicoId}>
            <span>
              {item.quantidade}x {item.servicoNome}
            </span>
            <small>
              {Number(numero(item.valorUnitario, obterValorServico(item.servicoId, servicos)) || 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })} avulso
            </small>
            <button type="button" onClick={() => removerItem(item.servicoId)}>
              Remover
            </button>
          </div>
        ))}
      </div>

      <ComboCalculator
        calculos={calculosCombo}
        descontoPercentual={formulario.descontoPercentual}
        precoFinal={formulario.valor}
        onAlterarDesconto={alterarDesconto}
        onAlterarPrecoFinal={alterarValorFinal}
      />

      <label className="campo-combo campo-combo-observacoes">
        <span>Observações</span>
        <textarea
          placeholder="Observações"
          value={formulario.observacoes}
          onChange={(e) => alterarCampo("observacoes", e.target.value)}
        />
      </label>

      <button type="submit">{combo ? "Atualizar combo" : "Salvar combo"}</button>

      {combo && (
        <button type="button" className="botao-cancelar" onClick={onCancelar}>
          Cancelar edição
        </button>
      )}
    </form>
  );
}

export default ComboForm;
