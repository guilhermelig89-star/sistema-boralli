function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarPercentual(valor) {
  return `${Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function economiaTexto(combo) {
  if (!combo.economiaValor && !combo.economiaPercentual) return "-";
  return `${formatarMoeda(combo.economiaValor)} (${formatarPercentual(combo.economiaPercentual)})`;
}

function CombosTable({ combos, carregando, onEditar, onDesativar }) {
  return (
    <div className="tabela-clientes">
      <div className="linha-combo cabecalho">
        <span>Combo</span>
        <span>Itens</span>
        <span>Valor</span>
        <span>Economia</span>
        <span>Status</span>
        <span>Ações</span>
      </div>

      {carregando && (
        <div className="linha-combo">
          <span>Carregando combos...</span>
        </div>
      )}

      {!carregando && combos.length === 0 && (
        <div className="linha-combo">
          <span>Nenhum combo encontrado.</span>
        </div>
      )}

      {!carregando &&
        combos.map((combo) => (
          <div className="linha-combo" key={combo.id}>
            <strong>{combo.nome}</strong>
            <span>
              {(combo.itens || [])
                .map((item) => `${item.quantidade}x ${item.servicoNome}`)
                .join(" | ")}
            </span>
            <span className="valor-servico">{formatarMoeda(combo.valor)}</span>
            <span className="economia-combo-lista">{economiaTexto(combo)}</span>
            <span className="badge-tipo badge-combo">{combo.ativo === false ? "Inativo" : "Ativo"}</span>
            <div className="acoes-cliente">
              <button className="botao-editar" onClick={() => onEditar(combo)}>
                Editar
              </button>

              <button
                className="botao-desativar"
                onClick={() => {
                  const confirmar = confirm("Deseja desativar este combo?");
                  if (confirmar) onDesativar(combo.id);
                }}
              >
                Desativar
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}

export default CombosTable;
