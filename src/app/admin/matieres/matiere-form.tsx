'use client'

import { useState, KeyboardEvent, ClipboardEvent } from 'react'
import { createMatiere } from '@/lib/actions/admin.actions'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { X, Plus, Sparkles, Tag, CheckCircle2 } from 'lucide-react'

interface Filiere {
  id: string
  name: string
  code?: string
}

interface Niveau {
  id: string
  name: string
  filiere_id: string
}

export function MatiereForm({
  filieres,
  niveaux,
}: {
  filieres: Filiere[]
  niveaux: Niveau[]
}) {
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [selectedFiliereId, setSelectedFiliereId] = useState<string>('')
  const [selectedNiveauId, setSelectedNiveauId] = useState<string>('')

  // Liste des tags matières
  const [matiereTags, setMatiereTags] = useState<string[]>([])
  const [matiereInput, setMatiereInput] = useState<string>('')

  // Liste des codes correspondants (optionnels)
  const [codeTags, setCodeTags] = useState<string[]>([])
  const [codeInput, setCodeInput] = useState<string>('')

  // Filtrage dynamique des niveaux en fonction de la filière sélectionnée
  const filteredNiveaux = selectedFiliereId
    ? niveaux.filter((n) => n.filiere_id === selectedFiliereId)
    : []

  // Helper pour ajouter des tags depuis une chaîne avec virgules ou sauts de ligne
  function addMatiereTokens(text: string) {
    const tokens = text
      .split(/[,;\n]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
    if (tokens.length > 0) {
      setMatiereTags((prev) => {
        const combined = [...prev]
        for (const token of tokens) {
          if (!combined.includes(token)) {
            combined.push(token)
          }
        }
        return combined
      })
      setMatiereInput('')
    }
  }

  function handleMatiereKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault()
      if (matiereInput.trim()) {
        addMatiereTokens(matiereInput)
      }
    } else if (e.key === 'Backspace' && !matiereInput && matiereTags.length > 0) {
      e.preventDefault()
      setMatiereTags((prev) => prev.slice(0, -1))
    }
  }

  function handleMatierePaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text')
    if (pasted.includes(',') || pasted.includes('\n') || pasted.includes(';')) {
      e.preventDefault()
      addMatiereTokens(pasted)
    }
  }

  function removeMatiereTag(index: number) {
    setMatiereTags((prev) => prev.filter((_, i) => i !== index))
  }

  // Codes
  function addCodeTokens(text: string) {
    const tokens = text
      .split(/[,;\n]/)
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length > 0)
    if (tokens.length > 0) {
      setCodeTags((prev) => [...prev, ...tokens])
      setCodeInput('')
    }
  }

  function handleCodeKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault()
      if (codeInput.trim()) {
        addCodeTokens(codeInput)
      }
    } else if (e.key === 'Backspace' && !codeInput && codeTags.length > 0) {
      e.preventDefault()
      setCodeTags((prev) => prev.slice(0, -1))
    }
  }

  function handleCodePaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text')
    if (pasted.includes(',') || pasted.includes('\n') || pasted.includes(';')) {
      e.preventDefault()
      addCodeTokens(pasted)
    }
  }

  function removeCodeTag(index: number) {
    setCodeTags((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    setSuccessMsg(null)

    // Si du texte reste dans l'input au moment du clic, on l'ajoute
    let finalNames = [...matiereTags]
    if (matiereInput.trim()) {
      const extra = matiereInput
        .split(/[,;\n]/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0 && !finalNames.includes(t))
      finalNames = [...finalNames, ...extra]
    }

    let finalCodes = [...codeTags]
    if (codeInput.trim()) {
      const extraCodes = codeInput
        .split(/[,;\n]/)
        .map((t) => t.trim().toUpperCase())
        .filter((t) => t.length > 0)
      finalCodes = [...finalCodes, ...extraCodes]
    }

    if (finalNames.length === 0) {
      setError('Veuillez renseigner au moins une matière (séparez par des virgules).')
      setPending(false)
      return
    }

    const formData = new FormData()
    formData.append('niveau_id', selectedNiveauId)
    formData.append('names', finalNames.join(','))
    formData.append('codes', finalCodes.join(','))

    const res = await createMatiere(formData)
    if (res?.error) {
      setError(res.error)
    } else {
      setSuccessMsg(
        `${finalNames.length} matière${finalNames.length > 1 ? 's ont été ajoutées' : ' a été ajoutée'} avec succès !`
      )
      setMatiereTags([])
      setMatiereInput('')
      setCodeTags([])
      setCodeInput('')
    }
    setPending(false)
  }

  const currentCount = matiereTags.length + (matiereInput.trim() ? 1 : 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && (
        <Alert variant="success">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        </Alert>
      )}

      {/* 1. Sélection de la Filière */}
      <div>
        <Label htmlFor="matiere-filiere">1. Filière cible *</Label>
        <Select
          id="matiere-filiere"
          value={selectedFiliereId}
          onChange={(e) => {
            setSelectedFiliereId(e.target.value)
            setSelectedNiveauId('')
            setSuccessMsg(null)
          }}
          required
          className="mt-1"
        >
          <option value="" disabled>
            Choisir une filière
          </option>
          {filieres.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} {f.code ? `(${f.code})` : ''}
            </option>
          ))}
        </Select>
      </div>

      {/* 2. Sélection du Niveau filtré */}
      <div>
        <Label htmlFor="matiere-niveau">2. Niveau dans cette filière *</Label>
        <Select
          id="matiere-niveau"
          required
          className="mt-1"
          disabled={!selectedFiliereId || filteredNiveaux.length === 0}
          value={selectedNiveauId}
          onChange={(e) => {
            setSelectedNiveauId(e.target.value)
            setSuccessMsg(null)
          }}
        >
          <option value="" disabled>
            {!selectedFiliereId
              ? "Sélectionnez d'abord une filière"
              : filteredNiveaux.length === 0
              ? 'Aucun niveau créé pour cette filière'
              : 'Choisir le niveau'}
          </option>
          {filteredNiveaux.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </Select>
        {selectedFiliereId && filteredNiveaux.length === 0 && (
          <p className="mt-1 text-caption text-accent-orange-deep">
            Créez d'abord un niveau pour cette filière via le formulaire ci-dessus.
          </p>
        )}
      </div>

      {/* 3. Champ Tags Matières (Séparées par virgules) */}
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="matiere-tags-input">
            3. Matières (séparées par une virgule) *
          </Label>
          {matiereTags.length > 0 && (
            <button
              type="button"
              onClick={() => setMatiereTags([])}
              className="text-caption text-ink-faint hover:text-accent-pink hover:underline"
            >
              Tout effacer ({matiereTags.length})
            </button>
          )}
        </div>

        {/* Zone de Tags interactive façon YouTube */}
        <div className="mt-1.5 flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-lg border border-hairline bg-white p-2 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          {matiereTags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded-md bg-accent-teal/15 px-2.5 py-1 text-caption font-medium text-accent-teal"
            >
              <Tag className="h-3 w-3 shrink-0 opacity-70" />
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeMatiereTag(idx)}
                className="ml-0.5 rounded-full p-0.5 text-accent-teal hover:bg-accent-teal/20 hover:text-ink"
                title="Supprimer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          <input
            id="matiere-tags-input"
            type="text"
            value={matiereInput}
            onChange={(e) => setMatiereInput(e.target.value)}
            onKeyDown={handleMatiereKeyDown}
            onPaste={handleMatierePaste}
            onBlur={() => {
              if (matiereInput.trim()) {
                addMatiereTokens(matiereInput)
              }
            }}
            placeholder={
              matiereTags.length === 0
                ? 'Ex: Algorithmique, Base de données, Réseaux...'
                : 'Ajouter une autre matière (puis Entrée ou virgule)...'
            }
            className="min-w-[180px] flex-1 bg-transparent text-body-sm text-ink outline-none placeholder:text-ink-faint"
          />
        </div>
        <p className="mt-1 text-caption text-ink-faint">
          💡 Tapez vos matières ou collez une liste séparée par des virgules ou retours à la ligne.
        </p>
      </div>

      {/* 4. Codes Matières (optionnel, séparés par virgules) */}
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="code-tags-input">
            Codes matières (optionnel, séparés par une virgule)
          </Label>
          {codeTags.length > 0 && (
            <button
              type="button"
              onClick={() => setCodeTags([])}
              className="text-caption text-ink-faint hover:text-accent-pink hover:underline"
            >
              Effacer codes ({codeTags.length})
            </button>
          )}
        </div>

        <div className="mt-1.5 flex min-h-[40px] flex-wrap items-center gap-1.5 rounded-lg border border-hairline bg-white p-2 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          {codeTags.map((code, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded-md bg-canvas-soft px-2 py-0.5 font-mono text-caption font-semibold text-ink-secondary"
            >
              <span>{code}</span>
              <button
                type="button"
                onClick={() => removeCodeTag(idx)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-black/5 hover:text-ink"
                title="Supprimer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          <input
            id="code-tags-input"
            type="text"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            onKeyDown={handleCodeKeyDown}
            onPaste={handleCodePaste}
            onBlur={() => {
              if (codeInput.trim()) {
                addCodeTokens(codeInput)
              }
            }}
            placeholder={
              codeTags.length === 0
                ? 'Ex: ALGO-101, BDD-201, RES-301...'
                : 'Code suivant...'
            }
            className="min-w-[140px] flex-1 bg-transparent text-body-sm text-ink outline-none placeholder:text-ink-faint"
          />
        </div>
        <p className="mt-1 text-caption text-ink-faint">
          Chaque code sera attribué dans l'ordre aux matières saisies ci-dessus.
        </p>
      </div>

      {/* Aperçu avant insertion */}
      {(matiereTags.length > 0 || matiereInput.trim()) && (
        <div className="rounded-lg border border-hairline bg-canvas-soft/60 p-3">
          <p className="text-caption font-semibold text-ink-secondary">
            Aperçu des matières à créer ({currentCount}) :
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {matiereTags.map((name, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md border border-hairline bg-white px-2 py-1 text-caption text-ink"
              >
                <span className="font-medium text-ink">{name}</span>
                {codeTags[i] && (
                  <span className="rounded bg-canvas-soft px-1 font-mono text-[10px] text-ink-muted">
                    {codeTags[i]}
                  </span>
                )}
              </span>
            ))}
            {matiereInput.trim() && (
              <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-accent-teal bg-accent-teal/5 px-2 py-1 text-caption italic text-accent-teal">
                <span>{matiereInput.trim()}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bouton CTA */}
      <Button
        type="submit"
        className="w-full"
        disabled={
          pending ||
          !selectedFiliereId ||
          !selectedNiveauId ||
          (matiereTags.length === 0 && !matiereInput.trim())
        }
      >
        {pending ? (
          'Ajout en cours...'
        ) : currentCount > 1 ? (
          <>
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter les {currentCount} matières au niveau
          </>
        ) : (
          <>
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter la matière au niveau
          </>
        )}
      </Button>
    </form>
  )
}
