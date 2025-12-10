"use client"
import { Card, CardContent } from "@/components/ui/card"

interface AdminFiltersProps {
  statusFilter: string
  setStatusFilter: (value: string) => void
  firingFilter: string
  setFiringFilter: (value: string) => void
  sortBy: string
  setSortBy: (value: string) => void
}

export default function AdminFilters({
  statusFilter,
  setStatusFilter,
  firingFilter,
  setFiringFilter,
  sortBy,
  setSortBy,
}: AdminFiltersProps) {
  return (
    <Card className="mb-8 border-2 border-slate-300">
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-[#c8623e] focus:outline-none"
            >
              <option>Tous</option>
              <option>Urgent</option>
              <option>En attente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Type de cuisson</label>
            <select
              value={firingFilter}
              onChange={(e) => setFiringFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-[#c8623e] focus:outline-none"
            >
              <option>Tous</option>
              <option>Biscuit</option>
              <option>Émaillage</option>
              <option>Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Trier par</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-[#c8623e] focus:outline-none"
            >
              <option value="date-asc">Date croissante</option>
              <option value="date-desc">Date décroissante</option>
              <option value="urgent">Plus urgent</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
