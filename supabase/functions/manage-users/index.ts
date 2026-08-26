// Edge Function: manage-users
//
// Centraliza as operações administrativas de usuários que exigem a
// service role key (criar, apagar, trocar senha, trocar role/loja).
// Nunca exponha a service role key no front-end — por isso essas
// ações só existem aqui.
//
// Deploy: supabase functions deploy manage-users
// Secrets necessários (já existem por padrão no projeto Supabase):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const VALID_ROLES = ['admin', 'super_admin', 'caixa'] as const
type Role = (typeof VALID_ROLES)[number]

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autenticado' }, 401)

    // Cliente com o token do usuário chamador, só para identificá-lo
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser()
    if (callerError || !caller) return json({ error: 'Não autenticado' }, 401)

    // Cliente admin (service role) — ignora RLS
    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: callerProfile, error: callerProfileError } = await admin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfileError || callerProfile?.role !== 'super_admin') {
      return json({ error: 'Apenas super_admin pode gerenciar usuários' }, 403)
    }

    const body = await req.json().catch(() => ({}))
    const action = body?.action as string | undefined

    switch (action) {
      case 'create': {
        const email = String(body?.email ?? '').trim().toLowerCase()
        const password = String(body?.password ?? '')
        const nome = body?.nome ? String(body.nome).trim() : null
        const role = body?.role as Role
        const lojaId = body?.loja_id ? String(body.loja_id) : null

        if (!email || !password || password.length < 6) {
          return json({ error: 'Email e senha (mínimo 6 caracteres) são obrigatórios' }, 400)
        }
        if (!VALID_ROLES.includes(role)) {
          return json({ error: 'Perfil inválido' }, 400)
        }
        if (role !== 'super_admin' && !lojaId) {
          return json({ error: 'Selecione a loja deste usuário' }, 400)
        }

        const { data: created, error: createError } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: nome ? { nome } : undefined,
        })
        if (createError || !created.user) {
          return json({ error: createError?.message ?? 'Erro ao criar usuário' }, 400)
        }

        // O trigger handle_new_user já criou a linha em profiles com role padrão;
        // agora aplicamos role/loja/nome corretos.
        const { data: profile, error: updateError } = await admin
          .from('profiles')
          .update({ role, loja_id: role === 'super_admin' ? null : lojaId, nome })
          .eq('id', created.user.id)
          .select()
          .single()

        if (updateError) {
          return json({ error: updateError.message }, 400)
        }
        return json({ profile })
      }

      case 'update': {
        const id = String(body?.id ?? '')
        const role = body?.role as Role | undefined
        const lojaId = body?.loja_id !== undefined ? (body.loja_id ? String(body.loja_id) : null) : undefined
        const nome = body?.nome !== undefined ? (body.nome ? String(body.nome).trim() : null) : undefined

        if (!id) return json({ error: 'Usuário inválido' }, 400)
        if (role && !VALID_ROLES.includes(role)) return json({ error: 'Perfil inválido' }, 400)

        const effectiveRole = role
        if (effectiveRole && effectiveRole !== 'super_admin' && lojaId === null) {
          return json({ error: 'Selecione a loja deste usuário' }, 400)
        }

        const updates: Record<string, unknown> = {}
        if (role) updates.role = role
        if (lojaId !== undefined) updates.loja_id = role === 'super_admin' ? null : lojaId
        if (nome !== undefined) updates.nome = nome

        const { data: profile, error: updateError } = await admin
          .from('profiles')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (updateError) return json({ error: updateError.message }, 400)
        return json({ profile })
      }

      case 'reset-password': {
        const id = String(body?.id ?? '')
        const password = String(body?.password ?? '')
        if (!id) return json({ error: 'Usuário inválido' }, 400)
        if (!password || password.length < 6) {
          return json({ error: 'Senha deve ter no mínimo 6 caracteres' }, 400)
        }

        const { error: pwError } = await admin.auth.admin.updateUserById(id, { password })
        if (pwError) return json({ error: pwError.message }, 400)
        return json({ ok: true })
      }

      case 'delete': {
        const id = String(body?.id ?? '')
        if (!id) return json({ error: 'Usuário inválido' }, 400)
        if (id === caller.id) return json({ error: 'Você não pode excluir seu próprio usuário' }, 400)

        const { error: deleteError } = await admin.auth.admin.deleteUser(id)
        if (deleteError) return json({ error: deleteError.message }, 400)
        return json({ ok: true })
      }

      default:
        return json({ error: 'Ação inválida' }, 400)
    }
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Erro interno' }, 500)
  }
})
