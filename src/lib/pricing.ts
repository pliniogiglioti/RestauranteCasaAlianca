import type { Prato } from '@/types'

type PratoComPromocao = Pick<Prato, 'preco' | 'preco_promocional' | 'data_promocional'>

export function getDataAtualISO(date = new Date()): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 10)
}

export function isPromocaoAtiva(prato: PratoComPromocao, date = new Date()): boolean {
  return prato.preco_promocional != null && prato.data_promocional === getDataAtualISO(date)
}

export function hasPromocaoConfigurada(prato: PratoComPromocao): boolean {
  return prato.preco_promocional != null && Boolean(prato.data_promocional)
}

export function getPrecoVigente(prato: PratoComPromocao, date = new Date()): number {
  return isPromocaoAtiva(prato, date) ? Number(prato.preco_promocional) : Number(prato.preco)
}

export function formatDataPromocional(dataPromocional: string | null): string {
  if (!dataPromocional) return ''

  const [ano, mes, dia] = dataPromocional.split('-').map(Number)
  if (!ano || !mes || !dia) return dataPromocional

  return new Intl.DateTimeFormat('pt-BR').format(new Date(ano, mes - 1, dia))
}
