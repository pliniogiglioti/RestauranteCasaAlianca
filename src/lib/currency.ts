export function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '')
  const amount = Number(digits || '0') / 100

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)
}

export function numberToCurrencyInput(value: number | null | undefined): string {
  return formatCurrencyInput(String(Math.round(Number(value ?? 0) * 100)))
}

export function currencyInputToNumber(value: string): number {
  const digits = value.replace(/\D/g, '')
  return Number(digits || '0') / 100
}
