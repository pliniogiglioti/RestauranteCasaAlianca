import { supabase } from '@/lib/supabase'
import type { ProfileRow } from '@/types/database'

export type UserRole = 'admin' | 'super_admin' | 'caixa'

export async function getProfiles(): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('email', { ascending: true })
  if (error) throw error
  return (data ?? []) as ProfileRow[]
}

async function invokeManageUsers<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('manage-users', { body })
  if (error) {
    // Tenta extrair a mensagem de erro estruturada retornada pela edge function
    const context = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context
    const parsed = await context?.json?.().catch(() => null)
    throw new Error(parsed?.error ?? error.message)
  }
  if (data?.error) throw new Error(data.error)
  return data as T
}

export async function criarUsuario(input: {
  email: string
  password: string
  nome?: string | null
  role: UserRole
  loja_id?: string | null
}): Promise<ProfileRow> {
  const { profile } = await invokeManageUsers<{ profile: ProfileRow }>({ action: 'create', ...input })
  return profile
}

export async function atualizarUsuario(
  id: string,
  updates: { role?: UserRole; loja_id?: string | null; nome?: string | null }
): Promise<ProfileRow> {
  const { profile } = await invokeManageUsers<{ profile: ProfileRow }>({ action: 'update', id, ...updates })
  return profile
}

export async function trocarSenhaUsuario(id: string, password: string): Promise<void> {
  await invokeManageUsers<{ ok: true }>({ action: 'reset-password', id, password })
}

export async function excluirUsuario(id: string): Promise<void> {
  await invokeManageUsers<{ ok: true }>({ action: 'delete', id })
}
