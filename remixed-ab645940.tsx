import React, { useMemo, useState } from 'react';
import {
  Bell,
  Building2,
  CalendarDays,
  FileSpreadsheet,
  Filter,
  Globe,
  Newspaper,
  Search,
  Shield,
  TrendingUp,
} from 'lucide-react';

type Category =
  | 'Nouveau produit'
  | 'Tarification'
  | 'Partenariat'
  | 'Conformité'
  | 'Innovation digitale'
  | 'Communication';

type Priority = 'Haute' | 'Moyenne' | 'Basse';

type SourceType = 'Presse' | 'Site officiel' | 'Réseaux sociaux' | 'Rapport';

type CompetitorNews = {
  id: number;
  bank: string;
  country: string;
  category: Category;
  title: string;
  summary: string;
  source: string;
  sourceType: SourceType;
  date: string;
  impactScore: number;
  priority: Priority;
  tags: string[];
};

const competitors = [
  'BGFI Bank',
  'UBA Gabon',
  'Orabank Gabon',
  'Ecobank Gabon',
  'Airtel Money',
  'Moov Money',
];

const newsSeed: CompetitorNews[] = [
  {
    id: 1,
    bank: 'BGFI Bank',
    country: 'Gabon',
    category: 'Nouveau produit',
    title: 'Lancement d\'une carte premium dédiée aux PME',
    summary:
      'Offre orientée entrepreneurs avec cashback sur paiements B2B et réduction des frais internationaux.',
    source: 'Communiqué BGFI',
    sourceType: 'Site officiel',
    date: '2026-04-18',
    impactScore: 88,
    priority: 'Haute',
    tags: ['PME', 'Carte', 'Fidélisation'],
  },
  {
    id: 2,
    bank: 'UBA Gabon',
    country: 'Gabon',
    category: 'Innovation digitale',
    title: 'Nouveau parcours d\'ouverture de compte 100% mobile',
    summary:
      'Réduction du délai d\'activation à moins de 15 minutes avec KYC digital renforcé.',
    source: 'Tech Afrique Finance',
    sourceType: 'Presse',
    date: '2026-04-20',
    impactScore: 92,
    priority: 'Haute',
    tags: ['Onboarding', 'Mobile', 'KYC'],
  },
  {
    id: 3,
    bank: 'Orabank Gabon',
    country: 'Gabon',
    category: 'Partenariat',
    title: 'Accord avec un opérateur télécom pour des packs marchands',
    summary:
      'Pack compte pro + terminal de paiement + data business pour commerçants de proximité.',
    source: 'Journal Économie CEMAC',
    sourceType: 'Presse',
    date: '2026-04-14',
    impactScore: 76,
    priority: 'Moyenne',
    tags: ['Merchants', 'POS', 'Télécom'],
  },
  {
    id: 4,
    bank: 'Ecobank Gabon',
    country: 'Gabon',
    category: 'Tarification',
    title: 'Baisse des frais de transferts régionaux zone CEMAC',
    summary:
      'Nouveau barème avec tarification dégressive pour les clients particuliers actifs.',
    source: 'Ecobank Newsroom',
    sourceType: 'Site officiel',
    date: '2026-04-22',
    impactScore: 83,
    priority: 'Haute',
    tags: ['Transfert', 'CEMAC', 'Prix'],
  },
  {
    id: 5,
    bank: 'Airtel Money',
    country: 'Gabon',
    category: 'Communication',
    title: 'Campagne agressive sur les paiements QR marchands',
    summary:
      'Objectif de conquête de 10 000 nouveaux commerçants en 6 mois sur Libreville et Port-Gentil.',
    source: 'LinkedIn Airtel Money',
    sourceType: 'Réseaux sociaux',
    date: '2026-04-16',
    impactScore: 71,
    priority: 'Moyenne',
    tags: ['QR Pay', 'Acquisition', 'Commerce'],
  },
  {
    id: 6,
    bank: 'Moov Money',
    country: 'Gabon',
    category: 'Conformité',
    title: 'Mise à jour de la politique de sécurité anti-fraude',
    summary:
      'Renforcement de la double authentification et nouveaux seuils de surveillance des transactions.',
    source: 'Rapport conformité interne',
    sourceType: 'Rapport',
    date: '2026-04-11',
    impactScore: 65,
    priority: 'Basse',
    tags: ['Fraude', '2FA', 'Risque'],
  },
];

const categoryStyles: Record<Category, string> = {
  'Nouveau produit': 'bg-blue-100 text-blue-800',
  Tarification: 'bg-amber-100 text-amber-800',
  Partenariat: 'bg-violet-100 text-violet-800',
  Conformité: 'bg-rose-100 text-rose-800',
  'Innovation digitale': 'bg-emerald-100 text-emerald-800',
  Communication: 'bg-slate-100 text-slate-800',
};

const priorityStyles: Record<Priority, string> = {
  Haute: 'bg-red-100 text-red-700 border-red-200',
  Moyenne: 'bg-orange-100 text-orange-700 border-orange-200',
  Basse: 'bg-green-100 text-green-700 border-green-200',
};

export default function AfgCompetitiveIntelApp() {
  const [query, setQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState('Toutes');
  const [selectedCategory, setSelectedCategory] = useState<'Toutes' | Category>('Toutes');
  const [watchlist, setWatchlist] = useState<string[]>(['BGFI Bank', 'UBA Gabon']);

  const filteredNews = useMemo(() => {
    return newsSeed
      .filter((item) => (selectedBank === 'Toutes' ? true : item.bank === selectedBank))
      .filter((item) => (selectedCategory === 'Toutes' ? true : item.category === selectedCategory))
      .filter((item) => {
        const content = `${item.title} ${item.summary} ${item.tags.join(' ')}`.toLowerCase();
        return content.includes(query.toLowerCase());
      })
      .sort((a, b) => b.impactScore - a.impactScore);
  }, [query, selectedBank, selectedCategory]);

  const highPriorityCount = filteredNews.filter((item) => item.priority === 'Haute').length;
  const avgImpact = Math.round(
    filteredNews.reduce((acc, curr) => acc + curr.impactScore, 0) / (filteredNews.length || 1),
  );

  const toggleWatchlist = (bank: string) => {
    setWatchlist((prev) =>
      prev.includes(bank) ? prev.filter((entry) => entry !== bank) : [...prev, bank],
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">AFG BANK GABON</p>
            <h1 className="text-3xl font-bold mt-2">Veille Informationnelle & Benchmark Concurrentiel</h1>
            <p className="text-slate-300 mt-2 max-w-2xl">
              Surveillez les mouvements des banques concurrentes, priorisez les signaux critiques et
              transformez la veille en plan d&apos;actions commercial et digital.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
            <StatCard icon={<Newspaper className="w-4 h-4" />} label="Signaux suivis" value={String(filteredNews.length)} />
            <StatCard icon={<Bell className="w-4 h-4" />} label="Alertes hautes" value={String(highPriorityCount)} />
            <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Impact moyen" value={`${avgImpact}/100`} />
            <StatCard icon={<CalendarDays className="w-4 h-4" />} label="Mise à jour" value="Hebdomadaire" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[220px] relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un sujet : KYC, transferts, crédit, mobile..."
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option>Toutes</option>
                {competitors.map((bank) => (
                  <option key={bank}>{bank}</option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as 'Toutes' | Category)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="Toutes">Toutes catégories</option>
                {(Object.keys(categoryStyles) as Category[]).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredNews.map((item) => (
              <article key={item.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${categoryStyles[item.category]}`}>
                      {item.category}
                    </span>
                    <span className={`text-xs border px-2 py-1 rounded-full ${priorityStyles[item.priority]}`}>
                      Priorité {item.priority}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500">Score impact: {item.impactScore}/100</div>
                </div>

                <h2 className="text-lg font-semibold mt-3">{item.title}</h2>
                <p className="text-sm text-slate-600 mt-2">{item.summary}</p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="mt-4 text-xs text-slate-500 flex flex-wrap gap-4">
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> {item.bank}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" /> {item.country}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Newspaper className="w-3.5 h-3.5" /> {item.sourceType}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" /> {item.date}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4" /> Watchlist concurrente
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              Activez les banques à surveiller en priorité pour les alertes dirigeantes.
            </p>
            <div className="mt-4 space-y-2">
              {competitors.map((bank) => {
                const active = watchlist.includes(bank);
                return (
                  <button
                    key={bank}
                    onClick={() => toggleWatchlist(bank)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition ${
                      active
                        ? 'bg-cyan-50 border-cyan-300 text-cyan-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {bank}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" /> Plan d&apos;actions recommandé
            </h3>
            <ul className="mt-3 space-y-3 text-sm text-slate-700 list-disc pl-5">
              <li>Comparer chaque annonce concurrente à l&apos;offre AFG (produit, prix, parcours digital).</li>
              <li>Attribuer un sponsor interne (Retail, Corporate, Digital, Risque) par signal critique.</li>
              <li>Émettre un brief hebdomadaire COMEX avec top 3 menaces et top 3 opportunités.</li>
            </ul>
          </div>

          <div className="bg-slate-900 text-white rounded-xl p-5">
            <h3 className="font-semibold flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Export rapide
            </h3>
            <p className="text-sm text-slate-300 mt-2">
              Connectez cette vue à un scraping légal/API médias pour alimenter un fichier Excel de pilotage.
            </p>
            <button className="mt-4 w-full rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-semibold py-2 text-sm">
              Exporter le benchmark mensuel
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-3">
      <div className="text-cyan-300">{icon}</div>
      <p className="text-xs text-slate-300 mt-1">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
