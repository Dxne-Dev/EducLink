import type { ResourceType, UserRole } from '@/types/database'

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Étudiant',
  teacher: 'Enseignant',
  admin: 'Administration',
}

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  cours: 'Cours',
  tp: 'TP',
  examen: 'Examen',
  td: 'TD',
  fiche: 'Fiche',
  autre: 'Autre',
}

export const RESOURCE_TYPE_ICONS: Record<ResourceType, string> = {
  cours: 'BookOpen',
  tp: 'FlaskConical',
  examen: 'FileCheck',
  td: 'PenTool',
  fiche: 'StickyNote',
  autre: 'File',
}

export const STATUS_LABELS = {
  draft: 'Brouillon',
  submitted: 'Soumis',
  validated: 'Validé',
  archived: 'Archivé',
} as const

export const VISIBILITY_LABELS = {
  private: 'Privé',
  public: 'Public',
} as const

export const TEMPLATE_CATEGORIES = [
  { value: 'gabarit', label: 'Gabarit officiel (Word / LaTeX)', icon: 'FileCode' },
  { value: 'guide', label: 'Guide méthodologique & Insertion', icon: 'Compass' },
  { value: 'exemple', label: 'Exemple de rapport type', icon: 'Award' },
  { value: 'convention', label: 'Convention de stage', icon: 'FileCheck' },
  { value: 'evaluation', label: 'Grille d\'évaluation', icon: 'ClipboardCheck' },
  { value: 'cv', label: 'Modèle CV & Candidature', icon: 'UserCheck' },
  { value: 'lettre', label: 'Lettre de motivation', icon: 'Mail' },
  { value: 'autre', label: 'Autre document', icon: 'FileText' },
] as const

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

export const ALLOWED_RESOURCE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
] as const

export const ALLOWED_REPORT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const
