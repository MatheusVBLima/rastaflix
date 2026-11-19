-- Dados de exemplo para desenvolvimento local.
-- Rodado automaticamente por `supabase start` (primeira vez) e `supabase db reset`.

insert into public.historias (title, description, tags, url) values
  ('História de exemplo', 'Uma história para testar a listagem.', array['exemplo', 'teste'], 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
  ('Outra história', 'Mais uma para testar a busca e os filtros.', array['teste'], 'https://www.youtube.com/watch?v=jNQXAC9IVRw');

insert into public.musicas (title, url) values
  ('Música de exemplo', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

insert into public.esculachos (titulo, descricao, conteudo, autor) values
  ('Esculacho de exemplo', 'Só para a página não ficar vazia.', 'Conteúdo do esculacho de exemplo.', 'Comunidade');

insert into public.inimigos (nome, status) values
  ('Inimigo pendente', 'pendente'),
  ('Inimigo vingado', 'vingado');

with season as (
  insert into public.award_seasons (year, title, description, start_date, end_date, status)
  values (2025, 'Rasta Awards 2025', 'Temporada de exemplo', now() - interval '1 day', now() + interval '30 days', 'active')
  returning id
), category as (
  insert into public.award_categories (season_id, name, description, display_order)
  select id, 'Melhor momento', 'Categoria de exemplo', 1 from season
  returning id
)
insert into public.award_nominees (category_id, title, description, display_order)
select id, nominee.title, nominee.description, nominee.ord
from category, (values ('Indicado 1', 'Primeiro indicado', 1), ('Indicado 2', 'Segundo indicado', 2)) as nominee(title, description, ord);
