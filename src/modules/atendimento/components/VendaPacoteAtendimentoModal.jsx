import { useMemo, useState } from "react";

const FORMAS = ["Pix", "Dinheiro", "Cartão de débito", "Cartão de crédito", "Transferência", "Outro"];

function VendaPacoteAtendimentoModal({ agendamento, combos, onFechar, onConfirmar }) {
  const [comboId, setComboId] = useState("");
  const [valorPago, setValorPago] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Pix");
  const [salvando, setSalvando] = useState(false);

  const comboSelecionado = useMemo(() => combos.find((combo) => combo.id === comboId) || null, [combos, comboId]);
  const incluiServicoAtual = Boolean(comboSelecionado?.itens?.some((item) => item.servicoId === agendamento?.servicoId));

  if (!agendamento) return null;

  async function confirmar() {
    if (!comboSelecionado) {
      alert("Selecione o pacote vendido.");
      return;
    }
    if (!incluiServicoAtual) {
      alert("O pacote selecionado não possui o serviço do atendimento atual.");
      return;
    }

    setSalvando(true);
    try {
      await onConfirmar({
        comboId: comboSelecionado.id,
        comboNome: comboSelecionado.nome,
        nome: `Pacote ${comboSelecionado.nome}`,
        valorPago: Number(valorPago || comboSelecionado.valor || 0),
        formaPagamento,
        itens: comboSelecionado.itens || [],
        totalAvulso: comboSelecionado.totalAvulso || 0,
        economiaValor: comboSelecionado.economiaValor || 0,
        economiaPercentual: comboSelecionado.economiaPercentual || 0,
        fraseEconomia: comboSelecionado.fraseEconomia || "",
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fechamento-backdrop" role="presentation">
      <section className="fechamento-modal" role="dialog" aria-modal="true">
        <div className="fechamento-topo">
          <div>
            <span>Cliente comprou pacote agora</span>
            <h2>{agendamento.clienteNome}</h2>
            <p>{agendamento.servicoNome}</p>
          </div>
          <button type="button" onClick={onFechar}>Fechar</button>
        </div>

        <div className="fechamento-grid">
          <label>
            <span>Pacote vendido</span>
            <select value={comboId} onChange={(e) => { setComboId(e.target.value); }}>
              <option value="">Selecione</option>
              {combos.map((combo) => (
                <option value={combo.id} key={combo.id}>{combo.nome}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Valor recebido</span>
            <input type="number" min="0" value={valorPago} onChange={(e) => setValorPago(e.target.value)} placeholder={comboSelecionado?.valor || 0} />
          </label>

          <label>
            <span>Forma de pagamento</span>
            <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
              {FORMAS.map((forma) => <option key={forma} value={forma}>{forma}</option>)}
            </select>
          </label>
        </div>

        {comboSelecionado && (
          <div className="fechamento-aviso-pacote">
            {incluiServicoAtual ? "Este pacote inclui o serviço atual e já consumirá 1 unidade." : "Este pacote não inclui o serviço atual."}
          </div>
        )}

        <div className="fechamento-acoes">
          <button type="button" className="fechamento-cancelar" onClick={onFechar} disabled={salvando}>Cancelar</button>
          <button type="button" className="fechamento-confirmar" onClick={confirmar} disabled={salvando}>Confirmar venda e converter</button>
        </div>
      </section>
    </div>
  );
}

export default VendaPacoteAtendimentoModal;
