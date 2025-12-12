"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminPage() {
  const router = useRouter()

  // ✅ Session Neon Auth
  const { data: session, isPending } = authClient.useSession()

  // ✅ On stocke l'utilisateur une fois qu'on a confirmé qu'il est admin
  const [currentUser, setCurrentUser] = useState<{
    email: string | null
    firstName: string
    lastName: string
  } | null>(null)

  const [pieces, setPieces] = useState<any[]>([])

  // Filtres
  const [biscuitTempFilter, setBiscuitTempFilter] = useState("Tous")
  const [biscuitClayFilter, setBiscuitClayFilter] = useState("Tous")
  const [biscuitSortFilter, setBiscuitSortFilter] = useState("Toutes")

  const [emaillageTempFilter, setEmaillageTempFilter] = useState("Tous")
  const [emaillageClayFilter, setEmaillageClayFilter] = useState("Tous")
  const [emaillageSortFilter, setEmaillageSortFilter] = useState("Toutes")

  // 🔒 Gestion de l'auth + rôle ADMIN
  useEffect(() => {
    if (isPending) return // on attend la fin du chargement de la session

    // 1) Pas de session → login Neon avec redirectTo=/admin
    if (!session) {
      router.replace("/auth/sign-in?redirectTo=/admin")
      return
    }

    // 2) On lit l'utilisateur & le rôle depuis Neon
    const user = session.user as any
    const role =
      user.role ??
      user.metadata?.role ??
      user["role"] ??
      user.metadata?.["role"] ??
      "practician"

    // 3) Si pas admin → on redirige vers /practician
    if (role !== "admin") {
      router.replace("/practician")
      return
    }

    // 4) OK, c'est un admin → on prépare currentUser pour l'UI
    const current = {
      email: user.email ?? null,
      firstName: user.metadata?.firstName ?? user.name ?? "",
      lastName: user.metadata?.lastName ?? "",
    }

    setCurrentUser(current)
  }, [isPending, session, router])

  // 📦 Charger les pièces uniquement quand on a un admin valide
  useEffect(() => {
    if (!currentUser) return
    loadPieces()
  }, [currentUser])

  const loadPieces = async () => {
    try {
      const res = await fetch("/api/pieces")
      if (!res.ok) {
        console.error("Erreur lors du chargement des pièces (admin)")
        return
      }
      const data = await res.json()
      setPieces(data)
    } catch (error) {
      console.error("Erreur réseau lors du chargement des pièces (admin)", error)
    }
  }

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date()
    const target = new Date(targetDate)
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const biscuitPieces = pieces
    .filter((p) => {
      if (!p.biscuitRequested || p.biscuitCompleted) return false
      if (biscuitTempFilter !== "Tous" && p.temperatureType !== biscuitTempFilter) return false
      if (biscuitClayFilter !== "Tous" && p.clayType !== biscuitClayFilter) return false
      return true
    })
    .sort((a, b) => {
      if (biscuitSortFilter === "Toutes") return 0
      const daysA = getDaysRemaining(a.biscuitDate)
      const daysB = getDaysRemaining(b.biscuitDate)
      if (biscuitSortFilter === "Plus urgentes d'abord") {
        return daysA - daysB
      } else {
        return daysB - daysA
      }
    })

  const emaillagePieces = pieces
    .filter((p) => {
      if (!p.emaillageRequested || p.emaillageCompleted) return false
      if (emaillageTempFilter !== "Tous" && p.temperatureType !== emaillageTempFilter) return false
      if (emaillageClayFilter !== "Tous" && p.clayType !== emaillageClayFilter) return false
      return true
    })
    .sort((a, b) => {
      if (emaillageSortFilter === "Toutes") return 0
      const daysA = getDaysRemaining(a.emaillageDate)
      const daysB = getDaysRemaining(b.emaillageDate)
      if (emaillageSortFilter === "Plus urgentes d'abord") {
        return daysA - daysB
      } else {
        return daysB - daysA
      }
    })

  const allActivePieces = pieces.filter((p) => !p.emaillageCompleted)
  const completedPieces = pieces.filter((p) => p.biscuitCompleted && p.emaillageCompleted)

  const handleMarkBiscuitComplete = async (pieceId: number) => {
    try {
      const res = await fetch("/api/pieces/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pieceId, type: "biscuit" }),
      })

      if (!res.ok) {
        console.error("Erreur lors de la validation du biscuit")
        return
      }

      const updated = await res.json()
      await loadPieces()

      if (updated.submittedBy?.email) {
        console.log(
          `[v0] Notification envoyée à ${updated.submittedBy.email}: Biscuit terminé`,
        )
      }
    } catch (error) {
      console.error("Erreur réseau lors de la validation du biscuit", error)
    }
  }

  const handleMarkEmaillageComplete = async (pieceId: number) => {
    try {
      const res = await fetch("/api/pieces/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pieceId, type: "emaillage" }),
      })

      if (!res.ok) {
        console.error("Erreur lors de la validation de l'émaillage")
        return
      }

      const updated = await res.json()
      await loadPieces()

      if (updated.submittedBy?.email) {
        console.log(
          `[v0] Notification envoyée à ${updated.submittedBy.email}: Émaillage terminé - Pièce prête`,
        )
      }
    } catch (error) {
      console.error("Erreur réseau lors de la validation de l'émaillage", error)
    }
  }

  const handleLogout = () => {
    router.push("/auth/sign-out")
  }

  // 🧊 Écran d’attente tant que :
  // - la session charge (isPending)
  // - OU on n’a pas encore currentUser (en cours de vérif + éventuelle redirection)
  if (isPending || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Chargement / vérification des droits admin...
      </div>
    )
  }

  // ✅ Ici on est sûr : session OK + rôle = admin
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5d4c5] to-white">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#8b6d47]">🔥 Gestion des Cuissons</h1>
            <p className="text-sm text-gray-600 mt-1">
              Connecté en tant que{" "}
              <span className="font-semibold">
                {currentUser.firstName} {currentUser.lastName}
              </span>{" "}
              ({currentUser.email})
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push("/admin/mes-pieces")}
              variant="outline"
              className="border-[#8b6d47] text-[#8b6d47] hover:bg-[#8b6d47] hover:text-white"
            >
              Mes Pièces
            </Button>
            <Button onClick={handleLogout} className="bg-blue-600 hover:bg-blue-700">
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="biscuit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="biscuit">Biscuit ({biscuitPieces.length})</TabsTrigger>
            <TabsTrigger value="emaillage">Émaillage ({emaillagePieces.length})</TabsTrigger>
            <TabsTrigger value="all">Toutes ({allActivePieces.length})</TabsTrigger>
            <TabsTrigger value="history">Historique ({completedPieces.length})</TabsTrigger>
          </TabsList>

          {/* Biscuit Tab */}
          <TabsContent value="biscuit" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Température</label>
                    <Select value={biscuitTempFilter} onValueChange={setBiscuitTempFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tous">Tous</SelectItem>
                        <SelectItem value="Haute température">Haute température</SelectItem>
                        <SelectItem value="Basse température">Basse température</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type de terre</label>
                    <Select value={biscuitClayFilter} onValueChange={setBiscuitClayFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tous">Tous</SelectItem>
                        <SelectItem value="Grès">Grès</SelectItem>
                        <SelectItem value="Faïence">Faïence</SelectItem>
                        <SelectItem value="Porcelaine">Porcelaine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Trier par urgence</label>
                    <Select value={biscuitSortFilter} onValueChange={setBiscuitSortFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Toutes">Toutes</SelectItem>
                        <SelectItem value="Plus urgentes d'abord">Plus urgentes d'abord</SelectItem>
                        <SelectItem value="Moins urgentes d'abord">Moins urgentes d'abord</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pieces */}
            <div className="space-y-4">
              {biscuitPieces.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-gray-600">
                    Aucune pièce en attente de biscuit
                  </CardContent>
                </Card>
              ) : (
                biscuitPieces.map((piece) => (
                  <Card key={piece.id} className="border-l-4 border-orange-500">
                    <CardContent className="p-6">
                      <div className="grid gap-6 md:grid-cols-5 items-center">
                        {piece.photo && (
                          <img
                            src={piece.photo || "/placeholder.svg"}
                            alt="Piece"
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        )}
                        <div className="md:col-span-2 space-y-2">
                          <p className="font-bold text-lg">
                            {piece.submittedBy?.firstName} {piece.submittedBy?.lastName}
                          </p>
                          <p className="text-sm text-slate-600">{piece.submittedBy?.email}</p>
                          <div className="flex gap-2">
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">{piece.temperatureType}</span>
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">{piece.clayType}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Date souhaitée</p>
                          <p className="font-semibold">{new Date(piece.biscuitDate).toLocaleDateString("fr-FR")}</p>
                        </div>
                        <div>
                          <Button
                            onClick={() => handleMarkBiscuitComplete(piece.id)}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            Marquer comme cuit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Emaillage Tab */}
          <TabsContent value="emaillage" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Température</label>
                    <Select value={emaillageTempFilter} onValueChange={setEmaillageTempFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tous">Tous</SelectItem>
                        <SelectItem value="Haute température">Haute température</SelectItem>
                        <SelectItem value="Basse température">Basse température</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type de terre</label>
                    <Select value={emaillageClayFilter} onValueChange={setEmaillageClayFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tous">Tous</SelectItem>
                        <SelectItem value="Grès">Grès</SelectItem>
                        <SelectItem value="Faïence">Faïence</SelectItem>
                        <SelectItem value="Porcelaine">Porcelaine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Trier par urgence</label>
                    <Select value={emaillageSortFilter} onValueChange={setEmaillageSortFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Toutes">Toutes</SelectItem>
                        <SelectItem value="Plus urgentes d'abord">Plus urgentes d'abord</SelectItem>
                        <SelectItem value="Moins urgentes d'abord">Moins urgentes d'abord</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pieces */}
            <div className="space-y-4">
              {emaillagePieces.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-gray-600">
                    Aucune pièce en attente d'émaillage
                  </CardContent>
                </Card>
              ) : (
                emaillagePieces.map((piece) => (
                  <Card key={piece.id} className="border-l-4 border-blue-500">
                    <CardContent className="p-6">
                      <div className="grid gap-6 md:grid-cols-5 items-center">
                        {piece.photo && (
                          <img
                            src={piece.photo || "/placeholder.svg"}
                            alt="Piece"
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        )}
                        <div className="md:col-span-2 space-y-2">
                          <p className="font-bold text-lg">
                            {piece.submittedBy?.firstName} {piece.submittedBy?.lastName}
                          </p>
                          <p className="text-sm text-slate-600">{piece.submittedBy?.email}</p>
                          <div className="flex gap-2">
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">{piece.temperatureType}</span>
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">{piece.clayType}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Date souhaitée</p>
                          <p className="font-semibold">{new Date(piece.emaillageDate).toLocaleDateString("fr-FR")}</p>
                        </div>
                        <div>
                          <Button
                            onClick={() => handleMarkEmaillageComplete(piece.id)}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            Marquer comme cuit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* All Pieces Tab */}
          <TabsContent value="all" className="space-y-4">
            {allActivePieces.map((piece) => (
              <Card key={piece.id}>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-4 items-center">
                    {piece.photo && (
                      <img
                        src={piece.photo || "/placeholder.svg"}
                        alt="Piece"
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="space-y-2">
                      <p className="font-bold">
                        {piece.submittedBy?.firstName} {piece.submittedBy?.lastName}
                      </p>
                      <p className="text-sm text-slate-600">{piece.submittedBy?.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        Biscuit:{" "}
                        {piece.biscuitCompleted ? "✓ Fait" : piece.biscuitRequested ? "⏰ Demandé" : "❌ Non demandé"}
                      </p>
                      <p className="text-sm">
                        Émaillage:{" "}
                        {piece.emaillageCompleted
                          ? "✓ Fait"
                          : piece.emaillageRequested
                            ? "⏰ Demandé"
                            : "❌ Non demandé"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded">{piece.temperatureType}</span>
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded">{piece.clayType}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {completedPieces.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-600">
                  Aucune pièce terminée dans l'historique
                </CardContent>
              </Card>
            ) : (
              completedPieces.map((piece) => (
                <Card key={piece.id} className="bg-green-50 border-l-4 border-green-600">
                  <CardContent className="p-6">
                    <div className="grid gap-6 md:grid-cols-5 items-center">
                      {piece.photo && (
                        <img
                          src={piece.photo || "/placeholder.svg"}
                          alt="Piece"
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="md:col-span-2 space-y-2">
                        <p className="font-bold text-lg text-green-800">
                          ✓ {piece.submittedBy?.firstName} {piece.submittedBy?.lastName}
                        </p>
                        <p className="text-sm text-slate-600">{piece.submittedBy?.email}</p>
                        <div className="flex gap-2">
                          <span className="text-xs bg-white px-2 py-1 rounded">{piece.temperatureType}</span>
                          <span className="text-xs bg-white px-2 py-1 rounded">{piece.clayType}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-green-700 font-semibold">Pièce terminée</p>
                        <p className="text-xs text-slate-600">
                          Biscuit: {new Date(piece.biscuitCompletedDate).toLocaleDateString("fr-FR")}
                        </p>
                        <p className="text-xs text-slate-600">
                          Émaillage: {new Date(piece.emaillageCompletedDate).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}