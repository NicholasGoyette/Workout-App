# Supabase Setup

This app works without Supabase by using browser localStorage. To sync program days across laptop, phone, and a deployed website, add Supabase.

## 1. Create Tables

Open your Supabase project, go to SQL Editor, and run the contents of:

```text
supabase-schema.sql
```

If you already created the table before video support was added, run this once:

```sql
alter table program_days
add column if not exists media_type text not null default 'image';
```

## 2. Add Environment Variables

Create a `.env.local` file from `.env.example`:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_PROGRAM_OWNER_ID=nick
```

The anon key is designed to be used in browser apps. Do not put service-role keys in this app.

## 3. Restart

Restart the dev server after changing environment variables:

```bash
npm.cmd run start -- --port 5173
```

When configured, the app shows `Supabase sync on` in the sidebar.
