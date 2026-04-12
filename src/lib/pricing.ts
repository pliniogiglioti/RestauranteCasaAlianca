import { DIAS_SEMANA, getDiaSemanaAtual } from '@/types'
import type { DiaSemana, Prato } from '@/types'

type PratoComPromocao = Pick<Prato, 'preco' | 'preco_promocional' | 'dia_promocional'>

export function isPromocaoAtiva(prato: PratoComPromocao, date = new Date()): boolean {
  return prato.preco_promocional != null && prato.dia_promocional === getDiaSemanaAtual(date)
}

export function hasPromocaoConfigurada(prato: PratoComPromocao): boolean {
  return prato.preco_promocional != null && Boolean(prato.dia_promocional)
}

export function getPrecoVigente(prato: PratoComPromocao, date = new Date()): number {
  return isPromocaoAtiva(prato, date) ? Number(prato.preco_promocional) : Number(prato.preco)
}

export function formatDiaPromocional(diaPromocional: DiaSemana | null): string {
  if (!diaPromocional) return ''
  return DIAS_SEMANA.find((dia) => dia.value === diaPromocional)?.label ?? diaPromocional
}
