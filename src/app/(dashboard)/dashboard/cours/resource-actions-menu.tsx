'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  deleteResource,
  setResourceVisibility,
  grantResourceToPromo,
} from '@/lib/actions/resources.actions'
import { Button } from '@/components/ui/Button'
import { Modal, ModalTitle, ModalDescription } from '@/components/ui/Modal'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import {
  MoreVertical,
  Pencil,
  Trash2,
  Share2,
  Globe,
  Lock,
} from 'lucide-react'
import type { ResourceVisibility } from '@/types/database'

import { emitRealtimeRefresh } from '@/lib/realtime-broadcast'

interface ResourceActionsMenuProps {
  resource: {
    id: string
    title: string
    description?: string | null
    type?: string
    visibility: ResourceVisibility
    uploaded_by: string
    file_path?: string
  }
  currentUserId?: string
  isAdmin?: boolean
  promotions?: { id: string; name: string }[]
  editBasePath?: string
}

export function ResourceActionsMenu({
  resource,
  currentUserId,
  isAdmin,
  promotions = [],
  editBasePath = '/prof/cours/edit',
}: ResourceActionsMenuProps) {
  const isOwner = currentUserId === resource.uploaded_by
  const canManage = isOwner || isAdmin

  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const [targetPromo, setTargetPromo] = useState('')
  const [shareVisibility, setShareVisibility] = useState<ResourceVisibility>('public')

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (!canManage) return null

  function handleToggleVisibility() {
    startTransition(async () => {
      const nextVis = resource.visibility === 'public' ? 'private' : 'public'
      const res = await setResourceVisibility(resource.id, nextVis)
      if (res?.error) {
        alert(res.error)
      } else {
        emitRealtimeRefresh('realtime:resources')
      }
      setMenuOpen(false)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteResource(resource.id)
      if (res?.error) {
        setError(res.error)
      } else {
        setDeleteOpen(false)
        setMenuOpen(false)
        emitRealtimeRefresh('realtime:resources')
      }
    })
  }

  function handleShare(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!targetPromo) {
      setError('Veuillez sélectionner une promotion')
      return
    }

    startTransition(async () => {
      const res = await grantResourceToPromo(resource.id, targetPromo, shareVisibility)
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccess('Ressource associée à la promotion avec succès !')
        emitRealtimeRefresh('realtime:resource_promo_access')
        emitRealtimeRefresh('realtime:resources')
        setTimeout(() => {
          setShareOpen(false)
          setSuccess(null)
        }, 1200)
      }
    })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-canvas-soft hover:text-ink"
        aria-label="Actions sur la ressource"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-lg border border-hairline bg-white py-1 shadow-level-2">
            <Link
              href={`${editBasePath}/${resource.id}`}
              className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-ink transition-colors hover:bg-canvas-soft"
              onClick={() => setMenuOpen(false)}
            >
              <Pencil className="h-3.5 w-3.5 text-ink-muted" />
              Modifier la ressource
            </Link>

            <button
              type="button"
              onClick={handleToggleVisibility}
              disabled={pending}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-ink transition-colors hover:bg-canvas-soft"
            >
              {resource.visibility === 'public' ? (
                <>
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                  Rendre privé
                </>
              ) : (
                <>
                  <Globe className="h-3.5 w-3.5 text-emerald-600" />
                  Rendre public
                </>
              )}
            </button>

            {promotions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShareOpen(true)
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-ink transition-colors hover:bg-canvas-soft"
              >
                <Share2 className="h-3.5 w-3.5 text-ink-muted" />
                Partager avec une promo
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setDeleteOpen(true)
                setMenuOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-accent-pink hover:bg-accent-pink/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </button>
          </div>
        </>
      )}

      {/* Modal Suppression */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <ModalTitle>Supprimer cette ressource ?</ModalTitle>
        <ModalDescription>
          Cette action est irréversible. Le fichier sera définitivement supprimé du stockage et ne sera plus accessible aux étudiants.
        </ModalDescription>
        {error && <div className="mt-3"><Alert variant="danger">{error}</Alert></div>}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={pending}>
            Supprimer définitivement
          </Button>
        </div>
      </Modal>

      {/* Modal Multi-promotions (sans duplication de fichier) */}
      <Modal open={shareOpen} onClose={() => setShareOpen(false)}>
        <ModalTitle>Partager avec d'autres promotions</ModalTitle>
        <ModalDescription>
          Rendez ce document accessible à une promotion supplémentaire (ex: réutiliser un cours d'une année à l'autre) sans dupliquer le stockage.
        </ModalDescription>
        {error && <div className="mt-3"><Alert variant="danger">{error}</Alert></div>}
        {success && <div className="mt-3"><Alert variant="success">{success}</Alert></div>}
        <form onSubmit={handleShare} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="target-promo">Sélectionner la promotion cible</Label>
            <Select
              id="target-promo"
              value={targetPromo}
              onChange={(e) => setTargetPromo(e.target.value)}
              required
            >
              <option value="" disabled>Choisir une promotion</option>
              {promotions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="share-vis">Visibilité pour cette promotion</Label>
            <Select
              id="share-vis"
              value={shareVisibility}
              onChange={(e) => setShareVisibility(e.target.value as ResourceVisibility)}
            >
              <option value="public">Publique (accessible aux étudiants de la promo)</option>
              <option value="private">Privée (réservée)</option>
            </Select>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShareOpen(false)}>
              Fermer
            </Button>
            <Button type="submit" loading={pending}>
              Associer la promotion
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
