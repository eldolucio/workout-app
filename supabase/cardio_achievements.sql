insert into public.achievements (slug, name, description, icon, xp_reward, condition)
values
('first_cardio',    'Coração Batendo',   'Completou seu primeiro cardio',      '❤️',  50,   'cardio_sessions >= 1'),
('cardio_10',       'Resistência',       '10 sessões de cardio',               '🫁',  200,  'cardio_sessions >= 10'),
('cardio_50',       'Maratonista',       '50 sessões de cardio',               '🏃',  750,  'cardio_sessions >= 50'),
('first_hiit',      'Tiro Certeiro',     'Completou seu primeiro HIIT',        '⚡',  75,   'hiit_sessions >= 1'),
('hiit_10',         'Explosivo',         '10 sessões de HIIT',                 '💥',  300,  'hiit_sessions >= 10'),
('zone4_workout',   'No Limite',         'Treinou na zona 4 (80-90% FC)',      '🔥',  100,  'heart_zone_4'),
('zone5_workout',   'Tudo ou Nada',      'Treinou na zona 5 (90-100% FC)',     '💀',  150,  'heart_zone_5'),
('distance_10km',   'Primeira Dezena',   'Correu 10km em uma sessão',         '🏅',  200,  'single_run_10km'),
('distance_42km',   'Maratonista',       'Acumulou 42km na esteira',           '🏆', 1000,  'total_run_42km'),
('hiit_perfect',    'Sem Pausa',         'Completou HIIT sem pausar',          '🎯',  100,  'hiit_no_pause')
ON CONFLICT (slug) DO NOTHING;
