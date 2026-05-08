import { useState } from "react";

import { getDiasSemana } from "../services/agendaConfiguracaoService";

const horarioInicial = {
  diaSemana: "1",
  ativo: true,
  inicio: "08:00",
  fim: "18:00",
  observacoes: "",
};

const excecaoInicial = {
  data: "",
  fechado: true,
  inicio: "08:00",
  fim: "18:00",
  observacoes: "",
};

function AgendaConfiguracao({ horarios, excecoes, carregando, erro, onSalvarHorario, onSalvarExcecao }) {
  const [horario, setHorario] = useState(horarioInicial);
  const [excecao, setExcecao] = useState(excecaoInicial);
  const diasSemana = getDiasSemana();

  function alterarHorario(campo, valor) {
    setHorario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function alterarExcecao(campo, valor) {
    setExcecao((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function salvarHorario(e) {
    e.preventDefault();
    await onSalvarHorario(horario);
    setHorario(horarioInicial);
  }

  async function salvarExcecao(e) {
    e.preventDefault();
    await onSalvarExcecao(excecao);
    setExcecao(excecaoInicial);
  }

  return (
    <div className="config-agenda">
      <div className="lista-clientes">
        <h2>Horários de atendimento</h2>
        {erro && <p>{erro}</p>}

        <form className="form-config-agenda" onSubmit={salvarHorario}>
          <select value={horario.diaSemana} onChange={(e) => alterarHorario("diaSemana", e.target.value)}>
            {diasSemana.map((dia) => (
              <option key={dia.diaSemana} value={dia.diaSemana}>
                {dia.nome}
              </option>
            ))}
          </select>

          <label className="check-linha">
            <input
              type="checkbox"
              checked={horario.ativo}
              onChange={(e) => alterarHorario("ativo", e.target.checked)}
            />
            Atende neste dia
          </label>

          <input
            type="time"
            value={horario.inicio}
            onChange={(e) => alterarHorario("inicio", e.target.value)}
          />

          <input
            type="time"
            value={horario.fim}
            onChange={(e) => alterarHorario("fim", e.target.value)}
          />

          <input
            placeholder="Observações"
            value={horario.observacoes}
            onChange={(e) => alterarHorario("observacoes", e.target.value)}
          />

          <button type="submit">Salvar horário</button>
        </form>

        <div className="tabela-clientes tabela-config-agenda">
          {carregando && <div className="linha-config"><span>Carregando horários...</span></div>}
          {!carregando && horarios.length === 0 && (
            <div className="linha-config"><span>Nenhum horário cadastrado.</span></div>
          )}
          {!carregando && horarios.map((item) => (
            <div className="linha-config" key={item.id}>
              <strong>{item.diaNome}</strong>
              <span>{item.ativo ? `${item.inicio} às ${item.fim}` : "Fechado"}</span>
              <span>{item.observacoes || "-"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lista-clientes">
        <h2>Exceções de horário</h2>

        <form className="form-config-agenda" onSubmit={salvarExcecao}>
          <input
            type="date"
            value={excecao.data}
            onChange={(e) => alterarExcecao("data", e.target.value)}
          />

          <label className="check-linha">
            <input
              type="checkbox"
              checked={excecao.fechado}
              onChange={(e) => alterarExcecao("fechado", e.target.checked)}
            />
            Fechado neste dia
          </label>

          <input
            type="time"
            value={excecao.inicio}
            onChange={(e) => alterarExcecao("inicio", e.target.value)}
            disabled={excecao.fechado}
          />

          <input
            type="time"
            value={excecao.fim}
            onChange={(e) => alterarExcecao("fim", e.target.value)}
            disabled={excecao.fechado}
          />

          <input
            placeholder="Motivo/observação"
            value={excecao.observacoes}
            onChange={(e) => alterarExcecao("observacoes", e.target.value)}
          />

          <button type="submit">Salvar exceção</button>
        </form>

        <div className="tabela-clientes tabela-config-agenda">
          {!carregando && excecoes.length === 0 && (
            <div className="linha-config"><span>Nenhuma exceção cadastrada.</span></div>
          )}
          {excecoes.map((item) => (
            <div className="linha-config" key={item.id}>
              <strong>{item.data}</strong>
              <span>{item.fechado ? "Fechado" : `${item.inicio} às ${item.fim}`}</span>
              <span>{item.observacoes || "-"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AgendaConfiguracao;
