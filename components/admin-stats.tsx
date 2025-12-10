import { Card, CardContent } from "@/components/ui/card"

interface AdminStatsProps {
  pieces: any[]
  getPriority: (date: string) => string
  getDaysRemaining: (date: string) => number
}

export default function AdminStats({ pieces, getPriority, getDaysRemaining }: AdminStatsProps) {
  const totalWaiting = pieces.filter((p) => p.status === "En attente").length
  const urgentPieces = pieces.filter((p) => getDaysRemaining(p.desiredDate) <= 2).length
  const firedThisWeek = pieces.filter((p) => {
    const fired = new Date(p.desiredDate)
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    return p.status === "Prêt" && fired >= weekAgo && fired <= today
  }).length

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      <Card className="border-2 border-slate-300">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-slate-600 font-semibold text-sm">Pièces en attente</p>
            <p className="text-4xl font-bold text-[#c8623e] mt-2">{totalWaiting}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-2 border-red-300">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-700 font-semibold text-sm">Pièces urgentes</p>
            <p className="text-4xl font-bold text-red-600 mt-2">{urgentPieces}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-2 border-green-300">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-green-700 font-semibold text-sm">Cuites cette semaine</p>
            <p className="text-4xl font-bold text-green-600 mt-2">{firedThisWeek}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
