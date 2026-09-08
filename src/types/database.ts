export type UserRole = 'student' | 'teacher' | 'admin'

export type ResourceType = 'cours' | 'tp' | 'examen' | 'td' | 'fiche' | 'autre'

export type DocumentStatus = 'draft' | 'submitted' | 'validated' | 'archived'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  promo_id: string | null
  created_at: string
  updated_at: string
}

export interface Filiere {
  id: string
  name: string
  code: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Niveau {
  id: string
  filiere_id: string
  name: string
  sort_order: number
  created_at: string
}

export interface Matiere {
  id: string
  niveau_id: string
  name: string
  code: string | null
  created_at: string
}

export interface Promotion {
  id: string
  filiere_id: string
  niveau_id: string
  name: string
  year_start: number
  year_end: number
  is_active: boolean
  created_at: string
}

export interface Resource {
  id: string
  title: string
  description: string | null
  type: ResourceType
  matiere_id: string
  promo_id: string
  uploaded_by: string
  status: DocumentStatus
  file_path: string
  file_size: number | null
  mime_type: string | null
  version: number
  is_anonymized: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

export interface ResourceVersion {
  id: string
  resource_id: string
  version: number
  file_path: string
  file_size: number | null
  notes: string | null
  created_by: string
  created_at: string
}

export interface Internship {
  id: string
  student_id: string
  promo_id: string
  company_name: string
  company_address: string | null
  tutor_name: string | null
  tutor_email: string | null
  start_date: string
  end_date: string
  subject: string
  status: DocumentStatus
  grade: number | null
  created_at: string
  updated_at: string
}

export interface InternshipReport {
  id: string
  internship_id: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  is_validated: boolean
  is_anonymized: boolean
  validated_by: string | null
  validated_at: string | null
  auto_archived: boolean
  archived_at: string | null
  created_at: string
}

export interface Template {
  id: string
  name: string
  description: string | null
  category: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  uploaded_by: string
  created_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  promotion_id: string
  enrolled_at: string
}

export interface SearchLog {
  id: string
  user_id: string | null
  query_text: string
  filters: Record<string, unknown> | null
  result_count: number | null
  created_at: string
}

export interface ResourceWithDetails extends Resource {
  matieres: Matiere
  promotions: Promotion
  profiles: Pick<Profile, 'full_name' | 'avatar_url'>
  filieres?: Filiere
}

export interface SearchResult {
  id: string
  title: string
  description: string | null
  type: ResourceType
  file_path: string
  file_size: number | null
  mime_type: string | null
  version: number
  created_at: string
  matiere_name: string
  filiere_name: string
  promo_name: string
  uploader: string
  rank: number
}

export interface SearchFilters {
  type: ResourceType | null
  year: number | null
  teacher_id: string | null
  filiere_id: string | null
  matiere_id: string | null
}
