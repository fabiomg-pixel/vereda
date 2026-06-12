-- ============================================================
--  Vereda — agendar o envio dos lembretes (roda a cada minuto)
--  Rode no SQL Editor DEPOIS de a função "send-reminders" estar publicada.
-- ============================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- remove agendamento antigo (se existir) antes de recriar
select cron.unschedule('vereda-reminders')
where exists (select 1 from cron.job where jobname = 'vereda-reminders');

select cron.schedule(
  'vereda-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://dripbqcrktimmryvzgwr.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
