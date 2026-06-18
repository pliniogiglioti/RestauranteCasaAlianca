import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { ProfileRow } from '@/types/database'

interface AuthState {
  user: User | null
  session: Session | null
  profile: ProfileRow | null
  loading: boolean
}

async function loadProfile(userId: string): Promise<ProfileRow | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) return null
    return data as ProfileRow | null
  } catch {
    return null
  }
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  })

  useEffect(() => {
    // Resolve loading assim que a sessão é conhecida (não bloqueia no perfil)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((prev) => ({ ...prev, user: session?.user ?? null, session, loading: false }))
      if (session?.user) {
        loadProfile(session.user.id).then((profile) =>
          setState((prev) => ({ ...prev, profile }))
        )
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({ ...prev, user: session?.user ?? null, session, loading: false }))
      if (session?.user) {
        loadProfile(session.user.id).then((profile) =>
          setState((prev) => ({ ...prev, profile }))
        )
      } else {
        setState((prev) => ({ ...prev, profile: null }))
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
