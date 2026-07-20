import assert from "node:assert/strict";
import test from "node:test";

import { filtrarPendenciasAgendamentos } from "./pendenciasAgendamentosService.js";

const AGORA = new Date("2026-07-20T15:00:00");

test("identifica agendamento vencido como pendência", () => {
  const pendencias = filtrarPendenciasAgendamentos([
    { id: "vencido", data: "2026-07-20", hora: "14:00", status: "agendado" },
    { id: "futuro", data: "2026-07-20", hora: "16:00", status: "agendado" },
  ], AGORA);

  assert.deepEqual(pendencias.map((item) => item.id), ["vencido"]);
});

test("identifica atendimento iniciado há pelo menos seis horas", () => {
  const pendencias = filtrarPendenciasAgendamentos([
    { id: "antigo", data: "2026-07-20", hora: "09:00", status: "em_atendimento" },
    { id: "recente", data: "2026-07-20", hora: "10:00", status: "em_atendimento" },
    { id: "finalizado", data: "2026-07-20", hora: "08:00", status: "finalizado" },
  ], AGORA);

  assert.deepEqual(pendencias.map((item) => item.id), ["antigo"]);
});
