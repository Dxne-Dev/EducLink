# EduLink 🎓 — Plateforme Pédagogique & SaaS Universitaire

> **La solution moderne et centralisée pour la diffusion, l'indexation et la gouvernance des ressources pédagogiques dans l'enseignement supérieur.**

---

## 📌 Executive Summary & Pitch

Dans la plupart des établissements universitaires et grandes écoles, les ressources pédagogiques (cours, travaux dirigés, travaux pratiques, sujets d'examens et rapports de stage) sont dispersées entre emails, clés USB et plateformes vieillissantes. 

**EduLink** résout cette fragmentation en fournissant une infrastructure unifiée et collaborative pensée pour **les étudiants**, **les enseignants** et **les directions pédagogiques**.

```
   ┌──────────────────────────────────────────────────────────────┐
   │                       EduLink Platform                       │
   └───────────────┬──────────────────────┬───────────────────────┘
                   │                      │
       ┌───────────▼───────────┐ ┌────────▼────────────┐
       │   Espace Étudiant     │ │  Espace Enseignant  │
       │  • Accès par promo    │ │  • Dépôt & version  │
       │  • Spotlight ⌘K       │ │  • Visibilité       │
       │  • Consultation/DL    │ │  • Duplication      │
       └───────────┬───────────┘ └────────┬────────────┘
                   │                      │
       ┌───────────▼──────────────────────▼────────────┐
       │             Espace Administrateur            │
       │  • Gouvernance filières, matières & promos   │
       │  • Registre & affectation des professeurs    │
       │  • Validation des rapports de stage          │
       └──────────────────────────────────────────────┘
```

---

## ✨ Fonctionnalités Clés

### ⚡ Recherche Globale & Spotlight (`⌘K` / `Ctrl+K`)
* **Command Palette intégrée :** Accessible instantanément depuis n'importe quelle page.
* **Filtres contextuels :** Filtrage en direct par type de document (*Cours, TD, TP, Examens, Fiches*).
* **Détection d'intention :** Extraction automatique de l'année et du type de ressource dans la requête.
* **Actions directes :** Prévisualisation sécurisée (*Consulter*) et téléchargement direct (*Blob download*) sans quitter l'écran.

### 🎓 Expérience Étudiant
* **Flux personnalisé :** Organisation automatique des ressources selon la filière et le niveau de l'étudiant.
* **Consommation fluide :** Téléchargement direct ou consultation intégrée des supports de cours.
* **Espace Stages :** Accès aux gabarits officiels, guides méthodologiques et conventions types.

### 👨‍🏫 Expérience Enseignant
* **Publication simplifiée :** Dépôt rapide de ressources avec typage, description et assignation de matière.
* **Gestion du cycle de vie :** Contrôle de la visibilité (*Brouillon*, *Public*, *Archivé*).
* **Duplication inter-promotions :** Report automatisé des cours d'une année académique à la suivante.

### 🛡️ Gouvernance Administrateur
* **Cartographie académique :** Gestion centralisée des filières, niveaux, matières et promotions.
* **Registre Enseignants :** Validation des comptes professeurs et affectation des matières d'enseignement.
* **Validation des Stages :** Modération et archivage des mémoires et rapports de stage.
* **Tableaux de bord & Analytics :** Mesure de l'activité, des téléchargements et des consultations en temps réel.

---

## 🛠️ Stack Technologique

* **Framework Frontend :** [Next.js 16](https://nextjs.org/) (App Router, Server Components & Server Actions)
* **Bibliothèque UI :** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
* **Composants & Primitives :** [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/), [Tabler Icons](https://tabler.io/icons)
* **Graphiques & Analytics :** [ApexCharts](https://apexcharts.com/)
* **Backend & Base de Données :** [Supabase](https://supabase.com/) (PostgreSQL 15+, Auth SSR, Storage, Realtime, Row Level Security)
* **Typage & Validation :** [TypeScript](https://www.typescriptlang.org/), [Zod](https://zod.dev/)

---

## 🚀 Démarrage Rapide

### 1. Prérequis

* **Node.js** `>= 18.18.0`
* **npm**, **pnpm** ou **yarn**
* Un projet [Supabase](https://supabase.com) (URL & clés API)

### 2. Cloner le Dépôt

```bash
git clone https://github.com/votre-organisation/edulink.git
cd edulink
```

### 3. Installer les Dépendances

```bash
npm install
```

### 4. Configuration de l'Environnement

Créez un fichier `.env.local` à la racine en copiant le modèle `.env.example` :

```bash
cp .env.example .env.local
```

Renseignez vos identifiants Supabase :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Initialisation de la Base de Données Supabase

Exécutez les migrations SQL situées dans `supabase/migrations/` dans l'éditeur SQL de votre projet Supabase (dans l'ordre numérique) :

1. `001_initial_schema.sql` (Structure de base : profils, filières, matières, promotions, ressources)
2. `002_rls_policies.sql` (Politiques de sécurité Row Level Security)
3. `003_search_rpc.sql` (Fonction de recherche PostgreSQL Full-Text Search)
4. `004_storage_buckets.sql` (Configuration des buckets Storage : `resources`, `templates`, `internships`, `avatars`)
5. Les migrations complémentaires (`005` à `013`) pour les fonctionnalités avancées et le temps réel.

*(Optionnel)* Vous pouvez exécuter `supabase/seed.sql` pour charger un jeu de données de démonstration.

### 6. Lancer le Serveur de Développement

```bash
npm run dev
```

L'application est accessible à l'adresse [http://localhost:3000](http://localhost:3000).

---

## 📜 Scripts Disponibles

| Commande | Description |
| :--- | :--- |
| `npm run dev` | Démarre le serveur de développement Next.js |
| `npm run build` | Compile l'application pour la production |
| `npm run start` | Lance le serveur de production compilé |
| `npm run lint` | Analyse le code avec ESLint |
| `npx tsc --noEmit` | Vérifie les types TypeScript sur l'ensemble du projet |

---

## 📁 Arborescence du Projet

```text
edulink/
├── src/
│   ├── actions/                # Server Actions Next.js
│   ├── app/                    # Routes App Router
│   │   ├── (auth)/             # Connexion, Inscription, Réinitialisation
│   │   ├── admin/              # Espace d'administration
│   │   ├── prof/               # Espace Enseignant (dépôt, cours, duplication)
│   │   ├── etudiant/           # Espace Étudiant (dashboard, ressources, stages)
│   │   ├── globals.css         # Styles globaux & variables Tailwind
│   │   └── layout.tsx          # Layout racine avec ThemeProvider
│   ├── components/
│   │   ├── dashboard/          # Graphiques, sparklines et widgets d'activité
│   │   ├── layout/             # Header, Sidebar, MobileNav, ThemeToggle
│   │   ├── search/             # SearchModal (Command Palette Spotlight ⌘K)
│   │   └── ui/                 # Composants d'interface (Button, Card, Badge, Modal...)
│   ├── hooks/                  # Hooks React réutilisables (Realtime, Views)
│   ├── lib/                    # Supabase Client/Server, utils, parsers, validations
│   └── types/                  # Types TypeScript & schémas de base de données
├── supabase/
│   ├── migrations/             # Schémas SQL, RLS et fonctions RPC
│   └── seed.sql                # Données d'initialisation
├── public/                     # Images, icônes et favicons
├── .env.example                # Modèle de variables d'environnement
├── .gitignore                  # Fichiers et dossiers exclus du versionnement
└── package.json                # Dépendances et scripts du projet
```

---

## 🔒 Sécurité & Bonnes Pratiques

* **Row Level Security (RLS) :** Chaque requête vers PostgreSQL est strictement isolée selon le rôle authentifié de l'utilisateur (`student`, `teacher`, `admin`).
* **Stockage Sécurisé :** Les fichiers de cours et rapports de stage sont stockés dans des buckets privés avec génération d'URLs signées temporaires (TTL 1 heure).
* **Validation des Entrées :** Toutes les données de formulaire sont vérifiées côté client et serveur à l'aide de schémas [Zod](https://zod.dev/).

---

## 📄 Licence

Ce projet est sous licence propriétaire pour l'établissement. Tous droits réservés.
