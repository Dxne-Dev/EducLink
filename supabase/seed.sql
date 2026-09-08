-- ============================================================
-- SEED DATA - Edulink / MemorySchool
-- ============================================================

-- Filières
INSERT INTO public.filieres (name, code, description) VALUES
  ('Informatique', 'INFO', 'Licence et Master en Informatique'),
  ('Génie Électrique et Instrumentation', 'GEII', 'Génie Électrique et Instrumentation Industrielle'),
  ('Mécanique', 'MECA', 'Génie Mécanique'),
  ('Génie Civil', 'GC', 'Génie Civil et Construction');

-- Niveaux - Informatique
INSERT INTO public.niveaux (filiere_id, name, sort_order)
SELECT id, '1ère Année', 1 FROM public.filieres WHERE code = 'INFO';
INSERT INTO public.niveaux (filiere_id, name, sort_order)
SELECT id, '2ème Année', 2 FROM public.filieres WHERE code = 'INFO';
INSERT INTO public.niveaux (filiere_id, name, sort_order)
SELECT id, '3ème Année', 3 FROM public.filieres WHERE code = 'INFO';

-- Niveaux - GEII
INSERT INTO public.niveaux (filiere_id, name, sort_order)
SELECT id, '1ère Année', 1 FROM public.filieres WHERE code = 'GEII';
INSERT INTO public.niveaux (filiere_id, name, sort_order)
SELECT id, '2ème Année', 2 FROM public.filieres WHERE code = 'GEII';
INSERT INTO public.niveaux (filiere_id, name, sort_order)
SELECT id, '3ème Année', 3 FROM public.filieres WHERE code = 'GEII';

-- Matières - INFO L1
INSERT INTO public.matieres (niveau_id, name, code)
SELECT n.id, 'Algorithmique', 'INFO-ALGO-101'
FROM public.niveaux n
JOIN public.filieres f ON f.id = n.filiere_id
WHERE f.code = 'INFO' AND n.name = '1ère Année';

INSERT INTO public.matieres (niveau_id, name, code)
SELECT n.id, 'Bases de Données', 'INFO-BDD-101'
FROM public.niveaux n
JOIN public.filieres f ON f.id = n.filiere_id
WHERE f.code = 'INFO' AND n.name = '1ère Année';

INSERT INTO public.matieres (niveau_id, name, code)
SELECT n.id, 'Programmation Web', 'INFO-WEB-101'
FROM public.niveaux n
JOIN public.filieres f ON f.id = n.filiere_id
WHERE f.code = 'INFO' AND n.name = '1ère Année';

INSERT INTO public.matieres (niveau_id, name, code)
SELECT n.id, 'Réseaux', 'INFO-RES-101'
FROM public.niveaux n
JOIN public.filieres f ON f.id = n.filiere_id
WHERE f.code = 'INFO' AND n.name = '1ère Année';

-- Matières - INFO L2
INSERT INTO public.matieres (niveau_id, name, code)
SELECT n.id, 'Algorithmique Avancée', 'INFO-ALGO-201'
FROM public.niveaux n
JOIN public.filieres f ON f.id = n.filiere_id
WHERE f.code = 'INFO' AND n.name = '2ème Année';

INSERT INTO public.matieres (niveau_id, name, code)
SELECT n.id, 'Génie Logiciel', 'INFO-GL-201'
FROM public.niveaux n
JOIN public.filieres f ON f.id = n.filiere_id
WHERE f.code = 'INFO' AND n.name = '2ème Année';

INSERT INTO public.matieres (niveau_id, name, code)
SELECT n.id, 'Intelligence Artificielle', 'INFO-IA-201'
FROM public.niveaux n
JOIN public.filieres f ON f.id = n.filiere_id
WHERE f.code = 'INFO' AND n.name = '2ème Année';

-- Promotions
INSERT INTO public.promotions (filiere_id, niveau_id, name, year_start, year_end, is_active)
SELECT f.id, n.id, '2024-2025', 2024, 2025, true
FROM public.filieres f
JOIN public.niveaux n ON n.filiere_id = f.id
WHERE f.code = 'INFO' AND n.name = '1ère Année';

INSERT INTO public.promotions (filiere_id, niveau_id, name, year_start, year_end, is_active)
SELECT f.id, n.id, '2024-2025', 2024, 2025, true
FROM public.filieres f
JOIN public.niveaux n ON n.filiere_id = f.id
WHERE f.code = 'INFO' AND n.name = '2ème Année';

INSERT INTO public.promotions (filiere_id, niveau_id, name, year_start, year_end, is_active)
SELECT f.id, n.id, '2023-2024', 2023, 2024, false
FROM public.filieres f
JOIN public.niveaux n ON n.filiere_id = f.id
WHERE f.code = 'INFO' AND n.name = '1ère Année';
