import { useState } from "react";

import { getDiasSemana } from "../services/agendaConfiguracaoService";

const horarioInicial = {
  diaSemana: "1",
  ativo: true,
  inicio: "08:00",
  fim: "18:00",
  intervaloAtivo: false,
  intervaloInicio: "12:00",
  intervaloFim: "13:00",
  observacoes: "",
};

const excecaoInicial = {
  data: "",
  fechado: true,
  inicio: "08:00",
  fim: "18:00",
  intervaloAtivo: false,
  intervaloInicio: "12:00",
  intervaloFim: "13:00",
  observacoes: "",
};

function descreverIntervalo(item) {
  if (!item.intervaloAtivo) return "Sem intervalo";
  return `Intervalo ${item.intervaloInicio || "--:--"} às ${item.intervaloFim || "--:--"}`;
}

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
        <p className="texto-ajuda-config">Defina o expediente padrão de cada dia da semana.</p>
        {erro && <p>{erro}</p>}

        <form className="form-config-agenda form-config-clara" onSubmit={salvarHorario}>
          <div className="campo-config campo-config-largo">
            <span>Dia da semana</span>
            <select value={horario.diaSemana} onChange={(e) => alterarHorario("diaSemana", e.target.value)}>
              {diasSemana.map((dia) => (
                <option key={dia.diaSemana} value={dia.diaSemana}>
                  {dia.nome}
                </option>
              ))}
            </select>
          </div>

          <label className="check-linha check-config">
            <input
              type="checkbox"
              checked={horario.ativo}
              onChange={(e) => alterarHorario("ativo", e.target.checked)}
            />
            Atendo neste dia
          </label>

          <div className="grupo-config campo-config-largo">
            <strong>Expediente</strong>
            <div className="linha-campos-config">
              <label className="campo-config">
                <span>Começa</span>
                <input
                  type="time"
                  value={horario.inicio}
                  onChange={(e) => alterarHorario("inicio", e.target.value)}
                  disabled={!horario.ativo}
                />
              </label>

              <label className="campo-config">
                <span>Termina</span>
                <input
                  type="time"
                  value={horario.fim}
                  onChange={(e) => alterarHorario("fim", e.target.value)}
                  disabled={!horario.ativo}
                />
              </label>
            </div>
          </div>

          <div className="grupo-config campo-config-largo">
            <div className="titulo-grupo-config">
              <strong>Intervalo</strong>
              <label className="check-linha check-config compacta">
                <input
                  type="checkbox"
                  checked={horario.intervaloAtivo}
                  onChange={(e) => alterarHorario("intervaloAtivo", e.target.checked)}
                  disabled={!horario.ativo}
                />
                Usar intervalo
              </label>
            </div>

            <div className="linha-campos-config">
              <label className="campo-config">
                <span>Início do intervalo</span>
                <input
                  type="time"
                  value={horario.intervaloInicio}
                  onChange={(e) => alterarHorario("intervaloInicio", e.target.value)}
                  disabled={!horario.ativo || !horario.intervaloAtivo}
                />
              </label>

              <label className="campo-config">
                <span>Fim do intervalo</span>
                <input
                  type="time"
                  value={horario.intervaloFim}
                  onChange={(e) => alterarHorario("intervaloFim", e.target.value)}
                  disabled={!horario.ativo || !horario.intervaloAtivo}
                />
              </label>
            </div>
          </div>

          <label className="campo-config campo-config-largo">
            <span>Observações</span>
            <input
              placeholder="Ex: atende somente com hora marcada"
              value={horario.observacoes}
              onChange={(e) => alterarHorario("observacoes", e.target.value)}
            />
          </label>

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
              <span>{item.ativo ? descreverIntervalo(item) : item.observacoes || "-"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lista-clientes">
        <h2>Exceções de horário</h2>
        <p className="texto-ajuda-config">Use para feriados, folgas ou dias com horário diferente.</p>

        <form className="form-config-agenda form-config-clara" onSubmit={salvarExcecao}>
          <div className="campo-config campo-config-largo">
            <span>Data da exceção</span>
            <input
              type="date"
              value={excecao.data}
              onChange={(e) => alterarExcecao("data", e.target.value)}
            />
          </div>

          <label className="check-linha check-config">
            <input
              type="checkbox"
              checked={excecao.fechado}
              onChange={(e) => alterarExcecao("fechado", e.target.checked)}
            />
            Fechado neste dia
          </label>

          <div className="grupo-config campo-config-largo">
            <strong>Expediente especial</strong>
            <div className="linha-campos-config">
              <label className="campo-config">
                <span>Começa</span>
                <input
                  type="time"
                  value={excecao.inicio}
                  onChange={(e) => alterarExcecao("inicio", e.target.value)}
                  disabled={excecao.fechado}
                />
              </label>

              <label className="campo-config">
                <span>Termina</span>
                <input
                  type="time"
                  value={excecao.fim}
                  onChange={(e) => alterarExcecao("fim", e.target.value)}
                  disabled={excecao.fechado}
                />
              </label>
            </div>
          </div>

          <div className="grupo-config campo-config-largo">
            <div className="titulo-grupo-config">
              <strong>Intervalo especial</strong>
              <label className="check-linha check-config compacta">
                <input
                  type="checkbox"
                  checked={excecao.intervaloAtivo}
                  onChange={(e) => alterarExcecao("intervaloAtivo", e.target.checked)}
                  disabled={excecao.fechado}
                />
                Usar intervalo
              </label>
            </div>

            <div className="linha-campos-config">
              <label className="campo-config">
                <span>Início do intervalo</span>
                <input
                  type="time"
                  value={excecao.intervaloInicio}
                  onChange={(e) => alterarExcecao("intervaloInicio", e.target.value)}
                  disabled={excecao.fechado || !excecao.intervaloAtivo}
                />
              </label>

              <label className="campo-config">
                <span>Fim do intervalo</span>
                <input
                  type="time"
                  value={excecao.intervaloFim}
                  onChange={(e) => alterarExcecao("intervaloFim", e.target.value)}
                  disabled={excecao.fechado || !excecao.intervaloAtivo}
                />
              </label>
            </div>
          </div>

          <label className="campo-config campo-config-largo">
            <span>Motivo ou observação</span>
            <input
              placeholder="Ex: feriado, curso, atendimento reduzido"
              value={excecao.observacoes}
              onChange={(e) => alterarExcecao("observacoes", e.target.value)}
            />
          </label>

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
              <span>{item.fechado ? item.observacoes || "-" : descreverIntervalo(item)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AgendaConfiguracao;
