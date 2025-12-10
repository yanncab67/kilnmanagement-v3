import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PiecesGridProps {
  pieces: any[]
}

export default function PiecesGrid({ pieces }: PiecesGridProps) {
  const getStatusColor = (status: string) => {
    if (status === "Prêt") return "bg-green-100 text-green-800"
    if (status === "En cours") return "bg-blue-100 text-blue-800"
    return "bg-yellow-100 text-yellow-800"
  }

  const getDaysRemaining = (date: string) => {
    const days = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {pieces.map((piece) => (
        <Card key={piece.id} className="overflow-hidden border-2 border-slate-200 hover:border-[#c8623e] transition">
          <div className="relative">
            {piece.photo && (
              <img src={piece.photo || "/placeholder.svg"} alt="Ceramic piece" className="w-full h-48 object-cover" />
            )}
            <Badge className={`absolute top-3 right-3 ${getStatusColor(piece.status)}`}>{piece.status}</Badge>
          </div>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {piece.submittedBy && (
                <p className="text-sm font-semibold text-[#c8623e]">
                  👤 {piece.submittedBy.firstName} {piece.submittedBy.lastName}
                </p>
              )}
              <div className="flex justify-between items-start gap-2">
                <Badge className="bg-[#c8623e] text-white">{piece.firingType}</Badge>
                <span className="text-sm font-semibold text-slate-600">
                  {getDaysRemaining(piece.desiredDate)} jours
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Soumise: {new Date(piece.submittedDate).toLocaleDateString("fr-FR")}
              </p>
              <p className="text-xs text-slate-500">
                À cuire avant: {new Date(piece.desiredDate).toLocaleDateString("fr-FR")}
              </p>
              {piece.notes && <p className="text-sm text-slate-600 italic">"{piece.notes}"</p>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
