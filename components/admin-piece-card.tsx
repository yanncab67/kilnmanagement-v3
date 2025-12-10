"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AdminPieceCardProps {
  piece: any
  priority: string
  daysRemaining: number
  onMarkAsFired: (id: number) => void
}

export default function AdminPieceCard({ piece, priority, daysRemaining, onMarkAsFired }: AdminPieceCardProps) {
  const getPriorityColor = () => {
    if (priority === "urgent") return "border-l-4 border-red-600 bg-red-50"
    if (priority === "soon") return "border-l-4 border-yellow-600 bg-yellow-50"
    return "border-l-4 border-green-600 bg-green-50"
  }

  const getPriorityIndicator = () => {
    if (priority === "urgent") return "🔴 Urgent"
    if (priority === "soon") return "🟡 Bientôt"
    return "🟢 OK"
  }

  return (
    <Card className={`${getPriorityColor()} overflow-hidden`}>
      <CardContent className="p-6">
        <div className="grid gap-6 md:grid-cols-5 md:items-center">
          {/* Photo */}
          {piece.photo && (
            <div>
              <img
                src={piece.photo || "/placeholder.svg"}
                alt="Ceramic piece"
                className="w-full h-24 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Info */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-slate-900">{getPriorityIndicator()}</span>
            </div>
            {piece.submittedBy && (
              <p className="text-sm font-semibold text-slate-700">
                👤 {piece.submittedBy.firstName} {piece.submittedBy.lastName}
              </p>
            )}
            <Badge className="bg-[#c8623e] text-white w-fit">{piece.firingType}</Badge>
            {piece.temperatureType && <p className="text-xs text-slate-600">Température: {piece.temperatureType}</p>}
            {piece.clayType && <p className="text-xs text-slate-600">Terre: {piece.clayType}</p>}
            <p className="text-xs text-slate-600">
              Soumise: {new Date(piece.submittedDate).toLocaleDateString("fr-FR")}
            </p>
            <p className="text-xs text-slate-600">
              À cuire avant: {new Date(piece.desiredDate).toLocaleDateString("fr-FR")}
            </p>
          </div>

          {/* Days Remaining */}
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600">Jours restants</p>
            <p
              className={`text-3xl font-bold ${
                priority === "urgent" ? "text-red-600" : priority === "soon" ? "text-yellow-600" : "text-green-600"
              }`}
            >
              {daysRemaining}
            </p>
          </div>

          {/* Action */}
          <Button onClick={() => onMarkAsFired(piece.id)} className="bg-[#6b9080] hover:bg-[#5a7d6f] text-white w-full">
            Marquer comme cuit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
