import { supabase } from '@/lib/supabase'
import type { Banner, BannerInsert, BannerUpdate } from '@/types'

export async function getBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('ordem', { ascending: true })

  if (error) throw error
  return (data ?? []) as Banner[]
}

export async function getBannersAtivos(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true })

  if (error) throw error
  return (data ?? []) as Banner[]
}

export async function createBanner(banner: BannerInsert): Promise<Banner> {
  const { data, error } = await supabase
    .from('banners')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(banner as any)
    .select()
    .single()

  if (error) throw error
  return data as Banner
}

export async function updateBanner(id: string, banner: BannerUpdate): Promise<Banner> {
  const { data, error } = await supabase
    .from('banners')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(banner as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Banner
}

export async function deleteBanner(id: string): Promise<void> {
  const { error } = await supabase.from('banners').delete().eq('id', id)
  if (error) throw error
}

export async function uploadImagemBanner(file: File, bannerId: string): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `banners/${bannerId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('banners')
    .upload(path, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('banners').getPublicUrl(path)
  return data.publicUrl
}
