import { criarPacoteClienteRegistro } from "../repositories/pacotesRepository";
import {
  calcularSaldoPacote,
  calcularSaldoServicoPacote,
  montarPacoteCliente,
  pacoteEstaAcabando,
  pacoteTemSaldoParaServico,
} from "../domain/pacotesDomain";

export { calcularSaldoPacote, calcularSaldoServicoPacote, pacoteEstaAcabando, pacoteTemSaldoParaServico };

export async function criarPacoteCliente(dados) {
  const pacote = montarPacoteCliente(dados);

  if (!pacote.clienteId) {
    throw new Error("Selecione o cliente do pacote.");
  }

  if (!pacote.nome) {
    throw new Error("Informe o nome do pacote.");
  }

  if (!pacote.comboId && !pacote.servicoId) {
    throw new Error("Selecione um combo ou serviço para o pacote.");
  }

  return criarPacoteClienteRegistro(pacote);
}
