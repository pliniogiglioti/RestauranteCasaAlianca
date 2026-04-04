# Migrations — Casa Aliança

Execute as migrations **em ordem** no SQL Editor do Supabase
(Dashboard → SQL Editor → New Query).

| Arquivo | O que faz |
|---------|-----------|
| `20240101000000_create_tables.sql`     | Cria todas as tabelas e índices |
| `20240101000001_functions_triggers.sql`| Funções e triggers (`updated_at`, `handle_new_user`) |
| `20240101000002_rls_policies.sql`      | RLS + políticas + grants de permissão |
| `20240101000003_storage_buckets.sql`   | Buckets de imagem (`imagens`, `banners`) |
| `20240101000004_seed_initial_data.sql` | Dados de exemplo (dev/demo) |

## Ordem de execução obrigatória

```
000 → 001 → 002 → 003 → 004 (opcional)
```

> A migration `004` é opcional em produção.  
> Cadastre os dados reais pelo painel `/admin`.
