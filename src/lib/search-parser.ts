import type { ResourceType } from '@/types/database'

export interface ParsedQuery {
  query: string
  type: ResourceType | null
  year: number | null
}

const TYPE_KEYWORDS: { keyword: string; type: ResourceType }[] = [
  { keyword: 'examen', type: 'examen' },
  { keyword: 'tp', type: 'tp' },
  { keyword: 'td', type: 'td' },
  { keyword: 'fiche', type: 'fiche' },
  { keyword: 'cours', type: 'cours' },
  { keyword: 'polycop', type: 'cours' },
  { keyword: 'autre', type: 'autre' },
]

/**
 * Parse une requête en langage naturel pour extraire des filtres.
 * Ex: "Sujet d'examen d'algorithmique promo 2024" -> { type: 'examen', year: 2024 }
 */
export function parseSearchQuery(raw: string): ParsedQuery {
  const lower = raw.toLowerCase()

  // Type
  let type: ResourceType | null = null
  for (const { keyword, type: t } of TYPE_KEYWORDS) {
    if (lower.includes(keyword)) {
      type = t
      break
    }
  }

  // Année (promo 2024 / 2024-2025 / 2024)
  const yearMatch = raw.match(/\b(20\d{2})\b/)
  const year = yearMatch ? parseInt(yearMatch[1], 10) : null

  // Requête nettoyée (retirer les mots-clés de type)
  const query = raw
    .replace(/\b(examen|tp|td|fiche|cours|polycop|sujet d'|sujet de|promo)\b/gi, ' ')
    .replace(/\b(20\d{2})\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return { query, type, year }
}
