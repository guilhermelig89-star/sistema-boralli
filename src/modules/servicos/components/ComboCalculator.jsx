import {
  formatarMoedaCombo,
  formatarPercentualCombo,
} from "../services/comboCalculatorService";

function CampoResumo({ titulo, valor, destaque }) {
  return (
    <div className={`combo-calculadora-card${destaque ? " destaque" : ""}`}>
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function ComboCalculator({ calculos, descontoPercentual, precoFinal, onAlterarDesconto, onAlterarPrecoFinal }) {
  return (
    <section className="combo-calculadora">
      <div className="combo-calculadora-topo">
        <div>
          <h3>Calculadora do Combo</h3>
          <p>Compare o valor avulso com o pacote e mostre a economia para a cliente.</p>
        </div>
      </div>

      <div className="combo-calculadora-comparativo">
        <div>
          <span>Avulso</span>
          <strong>{formatarMoedaCombo(calculos.totalAvulso)}</strong>
        </div>
        <div>
          <span>Combo</span>
          <strong>{formatarMoedaCombo(calculos.precoFinal)}</strong>
        </div>
        <div className="economia">
          <span>Você economiza</span>
          <strong>
            {formatarMoedaCombo(calculos.economiaValor)} ({formatarPercentualCombo(calculos.economiaPercentual)})
          </strong>
        </div>
      </div>

      <div className="combo-calculadora-campos">
        <label>
          <span>Desconto %</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={descontoPercentual}
            onChange={(e) => onAlterarDesconto(e.target.value)}
          />
        </label>

        <label>
          <span>Preço final do combo</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={precoFinal}
            onChange={(e) => onAlterarPrecoFinal(e.target.value)}
          />
        </label>
      </div>

      <div className="combo-calculadora-grid">
        <CampoResumo titulo="Total avulso" valor={formatarMoedaCombo(calculos.totalAvulso)} />
        <CampoResumo titulo="Desconto real" valor={formatarPercentualCombo(calculos.economiaPercentual)} />
        <CampoResumo titulo="Desconto em R$" valor={formatarMoedaCombo(calculos.descontoValor)} />
        <CampoResumo titulo="Preço sugerido" valor={formatarMoedaCombo(calculos.precoSugerido)} />
        <CampoResumo titulo="Preço final" valor={formatarMoedaCombo(calculos.precoFinal)} />
        <CampoResumo titulo="Você economiza" valor={formatarMoedaCombo(calculos.economiaValor)} destaque />
      </div>

      <div className="combo-frase-economia">{calculos.fraseEconomia}</div>
    </section>
  );
}

export default ComboCalculator;
