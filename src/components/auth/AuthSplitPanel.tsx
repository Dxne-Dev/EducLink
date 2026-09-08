'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TESTIMONIALS } from '@/lib/testimonials'

const DISPLAY_MS = 6000 // durée d'affichage de chaque témoignage

function AuthTestimonialCard({ testimonial }: { testimonial: (typeof TESTIMONIALS)[number] }) {
  return (
    <div className="flex w-64 items-start gap-3 rounded-3xl border border-white/10 bg-black/40 p-5 shadow-level-2 backdrop-blur-xl">
      <img
        src={testimonial.avatar}
        alt=""
        className="h-10 w-10 shrink-0 rounded-2xl object-cover"
      />
      <div className="text-sm leading-snug text-white">
        <p className="font-medium">{testimonial.name}</p>
        <p className="text-white/50">{testimonial.role}</p>
        <p className="mt-1 text-white/85">{testimonial.quote}</p>
      </div>
    </div>
  )
}

/**
 * Panneau latéral des pages auth — hero image + témoignages qui défilent
 * un par un, façon centre de notifications iOS (entrée par le bas,
 * coulisse vers le haut puis disparaît). Positionné en bas à droite pour
 * ne pas chevaucher le slogan.
 */
export function AuthSplitPanel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setIndex((i) => (i + 1) % TESTIMONIALS.length), DISPLAY_MS)
    return () => clearTimeout(t)
  }, [index])

  return (
    <section className="relative hidden flex-1 p-4 md:block">
      {/* Hero image — slide-in animée */}
      <div
        className="auth-anim-slide-right auth-delay-300 absolute inset-4 overflow-hidden rounded-3xl bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1200&auto=format&fit=crop)',
        }}
      >
        {/* Voile sombre pour la lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-secondary/20" />

        {/* Marque */}
        <div className="absolute left-8 top-8 flex items-center gap-2.5 text-white">
          <img
            src="/android-chrome-192x192.png"
            alt="Edulink logo"
            className="h-11 w-11 rounded-lg object-cover"
          />
          <span className="font-amatry text-2xl tracking-wide text-white">Edulink</span>
        </div>

        {/* Slogan — côté gauche, laissé dégagé (les témoignages sont en bas à droite) */}
        <div className="absolute bottom-44 left-8 text-white">
          <p className="max-w-sm text-2xl font-medium leading-tight">
            Centralisez le savoir académique,
            <br />
            <span className="font-serif italic">en toute simplicité.</span>
          </p>
        </div>
      </div>

      {/* Témoignages — un seul visible, défilement vertical en bas à droite */}
      <div className="absolute bottom-4 right-4 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -48 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <AuthTestimonialCard testimonial={TESTIMONIALS[index]} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}