'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Filter } from 'lucide-react'

interface MatiereOption {
  id: string
  name: string
  code?: string | null
}

interface MatiereFilterSelectProps {
  matieres: MatiereOption[]
  selectedMatiereParam?: string
}

export function MatiereFilterSelect({ matieres, selectedMatiereParam }: MatiereFilterSelectProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Trouver la valeur de clé correspondante (code ou id)
  const currentVal = matieres.find(
    (m) =>
      (m.code && selectedMatiereParam && m.code.toLowerCase() === selectedMatiereParam.toLowerCase()) ||
      m.id === selectedMatiereParam
  )
  const selectedValue = currentVal ? (currentVal.code || currentVal.id) : ''

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set('matiere', value)
    } else {
      params.delete('matiere')
    }

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  if (matieres.length === 0) return null

  return (
    <div className="flex items-center gap-2 text-caption text-ink-muted">
      <Filter className="h-3.5 w-3.5 text-primary" />
      <select
        className="rounded-md border border-hairline bg-canvas-soft px-3 py-1.5 text-caption font-medium text-ink transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        value={selectedValue}
        onChange={handleChange}
        aria-label="Filtrer par matière"
      >
        <option value="">Toutes mes matières ({matieres.length})</option>
        {matieres.map((m) => {
          const optValue = m.code || m.id
          return (
            <option key={m.id} value={optValue}>
              {m.name} {m.code ? `(${m.code})` : ''}
            </option>
          )
        })}
      </select>
    </div>
  )
}
