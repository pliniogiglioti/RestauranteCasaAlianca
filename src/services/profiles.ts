import { supabase } from '@/lib/supabase'
import type { ProfileRow } from '@/types/database'

export async function getProfiles(): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('email', { ascending: true })
  if (error) throw error
  return (data ?? []) as ProfileRow[]
}

export async function updateProfile(id: string, updates: { role?: 'admin' | 'super_admin'; loja_id?: string | null; nome?: string | null }): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from('profiles')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updates as any)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as ProfileRow
}
