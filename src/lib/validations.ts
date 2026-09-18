import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

export const signupSchema = z.object({
  full_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  role: z.enum(['student', 'teacher', 'admin']).default('student'),
})

export const resourceSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  type: z.enum(['cours', 'tp', 'examen', 'td', 'fiche', 'autre']),
  matiere_id: z.string().uuid('Matière invalide'),
  promo_id: z.string().uuid('Promotion invalide'),
})

export const filiereSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  code: z.string().min(2, 'Le code doit contenir au moins 2 caractères'),
  description: z.string().optional(),
})

export const niveauSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  filiere_id: z.string().uuid('Filière invalide'),
  sort_order: z.number().int().min(0),
})

export const matiereSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  code: z.string().optional(),
  niveau_id: z.string().uuid('Niveau invalide'),
})

export const promotionSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  filiere_id: z.string().uuid('Filière invalide'),
  niveau_id: z.string().uuid('Niveau invalide'),
  year_start: z.number().int().min(2020).max(2030),
  year_end: z.number().int().min(2020).max(2030),
})

export const internshipSchema = z.object({
  company_name: z.string().min(1, 'Le nom de l\'entreprise est requis'),
  company_address: z.string().optional(),
  tutor_name: z.string().optional(),
  tutor_email: z.string().email('Email invalide').optional().or(z.literal('')),
  start_date: z.string().min(1, 'La date de début est requise'),
  end_date: z.string().min(1, 'La date de fin est requise'),
  subject: z.string().min(1, 'Le sujet est requis'),
})

export const templateSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  category: z.enum(['gabarit', 'guide', 'exemple', 'convention', 'evaluation', 'cv', 'lettre', 'autre']),
  filiere_id: z.string().uuid('Filière invalide').optional().or(z.literal('')),
})

export const searchSchema = z.object({
  query: z.string().min(1, 'La requête est requise'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ResourceInput = z.infer<typeof resourceSchema>
export type FiliereInput = z.infer<typeof filiereSchema>
export type NiveauInput = z.infer<typeof niveauSchema>
export type MatiereInput = z.infer<typeof matiereSchema>
export type PromotionInput = z.infer<typeof promotionSchema>
export type InternshipInput = z.infer<typeof internshipSchema>
export type TemplateInput = z.infer<typeof templateSchema>
export type SearchInput = z.infer<typeof searchSchema>
