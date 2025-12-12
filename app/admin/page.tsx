"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

// Types
interface User {
  email: string | null
  firstName: string
  lastName: string
}

interface Piece {
  id: number
  photoUrl: string
  submittedBy: {
    firstName: string
    lastName: string
    email: string
  }
  temperatureType: string
  clayType: string
  notes?: string
  biscuitRequested: boolean
  biscuitCompleted: boolean
  biscuitDate: string
  biscuitCompletedDate?: string
  emaillageRequested: boolean
  emaillageCompleted: boolean
  emaillageDate: string
  emaillageCompletedDate?: string
  submittedDate: string
}

type FilterType = "Tous" | "Haute température" | "Basse température"
type ClayFilterType = "Tous" | "Grès" | "Faïence" | "Porcelaine"
type SortType = "Toutes" | "Plus urgentes d'abord" | "Moins urgentes d'abord"

export default function AdminPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  // États utilisateur
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [pieces, setPieces] = useState<Piece[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Filtres Biscuit
  const [biscuitTempFilter, setBiscuitTempFilter] = useState<FilterType>("Tous")
  const [biscuitClayFilter, setBiscuitClayFilter] = useState<ClayFilterType>("Tous")
  const [biscuitSortFilter, setBiscuitSortFilter] = useState<SortType>("Toutes")

  // Filtres Émaillage
  const [emaillageTempFilter, setEmaillageTempFilter] = useState<FilterType>("Tous")
  const [emaillageClayFilter, setEmaillageClayFilter] = useState<ClayFilterType>("Tous")
  const [emaillageSortFilter, setEmaillageSortFilter] = useState<SortType>("Toutes")

  // 🔒 Vérification authentification et rôle admin
  useEffect(() => {
    if (isPending) return

    if (!session) {
      console.log("🔒 Pas de session, redirection vers login")
      router.replace("/auth/sign-in?redirectTo=/admin")
      return
    }

    const user = session.user as any
    const role = 
      user.role ?? 
      user.metadata?.role ?? 
      user["role"] ?? 
      user.metadata?.["role"] ?? 
      "practician"

    if (role !== "admin") {
      console.log("⚠️ Utilisateur non-admin, redirection vers /practician")
      router.replace("/practician")
      return
    }

    const current: User = {
      email: user.email ?? null,
      firstName: user.metadata?.firstName ?? user.name ?? "",
      lastName: user.metadata?.lastName ?? "",
    }

    console.log("✅ Admin authentifié:", current.email)
    setCurrentUser(current)
  }, [isPending, session, router])

  // 📦 Charger les pièces
  useEffect(() => {
    if (!currentUser) return
    loadPieces()
  }, [currentUser])

  const loadPieces = async () => {
    setIsLoading(true)
    try {
      console.log("🔄 Chargement des pièces...")
      const res = await fetch("/api/pieces")
      
      if (!res.ok) {
        console.error("❌ Erreur lors du chargement des pièces:", res.status)
        return
      }
      
      const data = await res.json()
      setPieces(data)
      console.log("✅ Pièces chargées:", data.length)
    } catch (error) {
      console.error("❌ Erreur réseau lors du chargement des pièces:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 📅 Calcul des jours restants
  const getDaysRemaining = (targetDate: string): number => {
    const today = new Date()
    const target = new Date(targetDate)
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // 🎨 Couleur de priorité selon les jours restants
  const getPriorityColor = (days: number): string => {
    if (days < 0) return "text-red-600 font-bold"
    if (days <= 3) return "text-orange-600 font-semibold"
    if (days <= 7) return "text-yellow-600"
    return "text-green-600"
  }

  // 🔍 Filtrage des pièces Biscuit
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
      return biscuitSortFilter === "Plus urgentes d'abord" ? daysA - daysB : daysB - daysA
    })

  // 🔍 Filtrage des pièces Émaillage
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
      return emaillageSortFilter === "Plus urgentes d'abord" ? daysA - daysB : daysB - daysA
    })

  const allActivePieces = pieces.filter((p) => !p.emaillageCompleted)
  const completedPieces = pieces.filter((p) => p.biscuitCompleted && p.emaillageCompleted)

  // ✅ Marquer biscuit comme terminé
  const handleMarkBiscuitComplete = async (pieceId: number) => {
    try {
      console.log("🔥 Validation biscuit pour pièce", pieceId)
      
      const res = await fetch("/api/pieces/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pieceId, type: "biscuit" }),
      })

      if (!res.ok) {
        console.error("❌ Erreur lors de la validation du biscuit")
        alert("Erreur lors de la validation du biscuit")
        return
      }

      const updated = await res.json()
      console.log("✅ Biscuit validé:", updated)
      
      await loadPieces()

      if (updated.submittedBy?.email) {
        console.log(`📧 Notification envoyée à ${updated.submittedBy.email}: Biscuit terminé`)
      }
    } catch (error) {
      console.error("❌ Erreur réseau:", error)
      alert("Erreur réseau lors de la validation")
    }
  }

  // ✅ Marquer émaillage comme terminé
  const handleMarkEmaillageComplete = async (pieceId: number) => {
    try {
      console.log("🎨 Validation émaillage pour pièce", pieceId)
      
      const res = await fetch("/api/pieces/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pieceId, type: "emaillage" }),
      })

      if (!res.ok) {
        console.error("❌ Erreur lors de la validation de l'émaillage")
        alert("Erreur lors de la validation de l'émaillage")
        return
      }

      const updated = await res.json()
      console.log("✅ Émaillage validé:", updated)
      
      await loadPieces()

      if (updated.submittedBy?.email) {
        console.log(`📧 Notification envoyée à ${updated.submittedBy.email}: Pièce terminée!`)
      }
    } catch (error) {
      console.error("❌ Erreur réseau:", error)
      alert("Erreur réseau lors de la validation")
    }
  }

  const handleLogout = () => {
    console.log("👋 Déconnexion admin")
    router.push("/auth/sign-out")
  }

  // 🔄 Écran de chargement
  if (isPending || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f5d4c5] to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#8b6d47] mx-auto mb-4"></div>
          <p className="text-[#8b6d47] text-lg font-semibold">Vérification des droits admin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5d4c5] to-white">
      {/* 🎯 Header */}
      <div className="bg-white shadow-md border-b-2 border-[#c8623e]/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#8b6d47] flex items-center gap-2">
                🔥 Gestion des Cuissons
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Connecté en tant que{" "}
                <span className="font-semibold text-[#8b6d47]">
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
                📝 Mes Pièces
              </Button>
              <Button 
                onClick={handleLogout} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Statistiques rapides */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{biscuitPieces.length}</p>
              <p className="text-sm text-gray-600 mt-1">Biscuits en attente</p>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{emaillagePieces.length}</p>
              <p className="text-sm text-gray-600 mt-1">Émaillages en attente</p>
            </CardContent>
          </Card>
          
          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-slate-600">{allActivePieces.length}</p>
              <p className="text-sm text-gray-600 mt-1">Pièces actives</p>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{completedPieces.length}</p>
              <p className="text-sm text-gray-600 mt-1">Pièces terminées</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 📋 Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <Tabs defaultValue="biscuit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="biscuit">
              🔥 Biscuit ({biscuitPieces.length})
            </TabsTrigger>
            <TabsTrigger value="emaillage">
              🎨 Émaillage ({emaillagePieces.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              📦 Toutes ({allActivePieces.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              ✅ Historique ({completedPieces.length})
            </TabsTrigger>
          </TabsList>

          {/* 🔥 Onglet Biscuit */}
          <TabsContent value="biscuit" className="space-y-4">
            {/* Filtres */}
            <Card className="border-orange-200">
              <CardContent className="p-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">🌡️ Température</label>
                    <Select value={biscuitTempFilter} onValueChange={(v) => setBiscuitTempFilter(v as FilterType)}>
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
                    <label className="text-sm font-medium mb-2 block">🏺 Type de terre</label>
                    <Select value={biscuitClayFilter} onValueChange={(v) => setBiscuitClayFilter(v as ClayFilterType)}>
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
                    <label className="text-sm font-medium mb-2 block">⏰ Trier par urgence</label>
                    <Select value={biscuitSortFilter} onValueChange={(v) => setBiscuitSortFilter(v as SortType)}>
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

            {/* Liste des pièces */}
            <div className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b6d47] mx-auto mb-2"></div>
                    <p className="text-gray-600">Chargement...</p>
                  </CardContent>
                </Card>
              ) : biscuitPieces.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="p-8 text-center text-gray-600">
                    <p className="text-lg">✨ Aucune pièce en attente de biscuit</p>
                    <p className="text-sm mt-2">Les demandes apparaîtront ici</p>
                  </CardContent>
                </Card>
              ) : (
                biscuitPieces.map((piece) => {
                  const daysRemaining = getDaysRemaining(piece.biscuitDate)
                  return (
                    <Card key={piece.id} className="border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="grid gap-6 md:grid-cols-[120px_1fr_auto_auto] items-center">
                          {/* Photo */}
                          {piece.photoUrl && (
                            <img
                              src={piece.photoUrl}
                              alt="Pièce céramique"
                              className="w-full h-28 object-cover rounded-lg shadow-sm"
                            />
                          )}
                          
                          {/* Infos */}
                          <div className="space-y-2">
                            <div>
                              <p className="font-bold text-lg text-[#8b6d47]">
                                {piece.submittedBy?.firstName} {piece.submittedBy?.lastName}
                              </p>
                              <p className="text-sm text-slate-600">{piece.submittedBy?.email}</p>
                            </div>
                            
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline" className="bg-slate-50">
                                {piece.temperatureType}
                              </Badge>
                              <Badge variant="outline" className="bg-slate-50">
                                {piece.clayType}
                              </Badge>
                            </div>
                            
                            {piece.notes && (
                              <p className="text-sm text-slate-600 italic">"{piece.notes}"</p>
                            )}
                          </div>
                          
                          {/* Date */}
                          <div className="text-center">
                            <p className="text-sm text-slate-600 mb-1">Date souhaitée</p>
                            <p className="font-semibold text-[#8b6d47]">
                              {new Date(piece.biscuitDate).toLocaleDateString("fr-FR")}
                            </p>
                            <p className={`text-sm mt-1 ${getPriorityColor(daysRemaining)}`}>
                              {daysRemaining < 0 
                                ? `⚠️ En retard de ${Math.abs(daysRemaining)}j`
                                : daysRemaining === 0
                                ? "🔥 Aujourd'hui"
                                : `${daysRemaining}j restants`
                              }
                            </p>
                          </div>
                          
                          {/* Action */}
                          <Button
                            onClick={() => handleMarkBiscuitComplete(piece.id)}
                            className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                          >
                            ✓ Marquer cuit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>

          {/* 🎨 Onglet Émaillage */}
          <TabsContent value="emaillage" className="space-y-4">
            {/* Filtres */}
            <Card className="border-blue-200">
              <CardContent className="p-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">🌡️ Température</label>
                    <Select value={emaillageTempFilter} onValueChange={(v) => setEmaillageTempFilter(v as FilterType)}>
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
                    <label className="text-sm font-medium mb-2 block">🏺 Type de terre</label>
                    <Select value={emaillageClayFilter} onValueChange={(v) => setEmaillageClayFilter(v as ClayFilterType)}>
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
                    <label className="text-sm font-medium mb-2 block">⏰ Trier par urgence</label>
                    <Select value={emaillageSortFilter} onValueChange={(v) => setEmaillageSortFilter(v as SortType)}>
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

            {/* Liste des pièces */}
            <div className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b6d47] mx-auto mb-2"></div>
                    <p className="text-gray-600">Chargement...</p>
                  </CardContent>
                </Card>
              ) : emaillagePieces.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="p-8 text-center text-gray-600">
                    <p className="text-lg">✨ Aucune pièce en attente d'émaillage</p>
                    <p className="text-sm mt-2">Les demandes apparaîtront ici</p>
                  </CardContent>
                </Card>
              ) : (
                emaillagePieces.map((piece) => {
                  const daysRemaining = getDaysRemaining(piece.emaillageDate)
                  return (
                    <Card key={piece.id} className="border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="grid gap-6 md:grid-cols-[120px_1fr_auto_auto] items-center">
                          {piece.photoUrl && (
                            <img
                              src={piece.photoUrl}
                              alt="Pièce céramique"
                              className="w-full h-28 object-cover rounded-lg shadow-sm"
                            />
                          )}
                          
                          <div className="space-y-2">
                            <div>
                              <p className="font-bold text-lg text-[#8b6d47]">
                                {piece.submittedBy?.firstName} {piece.submittedBy?.lastName}
                              </p>
                              <p className="text-sm text-slate-600">{piece.submittedBy?.email}</p>
                            </div>
                            
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline" className="bg-slate-50">
                                {piece.temperatureType}
                              </Badge>
                              <Badge variant="outline" className="bg-slate-50">
                                {piece.clayType}
                              </Badge>
                            </div>
                            
                            {piece.notes && (
                              <p className="text-sm text-slate-600 italic">"{piece.notes}"</p>
                            )}
                          </div>
                          
                          <div className="text-center">
                            <p className="text-sm text-slate-600 mb-1">Date souhaitée</p>
                            <p className="font-semibold text-[#8b6d47]">
                              {new Date(piece.emaillageDate).toLocaleDateString("fr-FR")}
                            </p>
                            <p className={`text-sm mt-1 ${getPriorityColor(daysRemaining)}`}>
                              {daysRemaining < 0 
                                ? `⚠️ En retard de ${Math.abs(daysRemaining)}j`
                                : daysRemaining === 0
                                ? "🔥 Aujourd'hui"
                                : `${daysRemaining}j restants`
                              }
                            </p>
                          </div>
                          
                          <Button
                            onClick={() => handleMarkEmaillageComplete(piece.id)}
                            className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                          >
                            ✓ Marquer cuit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>

          {/* 📦 Onglet Toutes les pièces */}
          <TabsContent value="all" className="space-y-4">
            {allActivePieces.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-8 text-center text-gray-600">
                  <p className="text-lg">✨ Aucune pièce active</p>
                </CardContent>
              </Card>
            ) : (
              allActivePieces.map((piece) => (
                <Card key={piece.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid gap-6 md:grid-cols-[120px_1fr_auto] items-center">
                      {piece.photoUrl && (
                        <img
                          src={piece.photoUrl}
                          alt="Pièce"
                          className="w-full h-28 object-cover rounded-lg shadow-sm"
                        />
                      )}
                      
                      <div className="space-y-3">
                        <div>
                          <p className="font-bold text-lg text-[#8b6d47]">
                            {piece.submittedBy?.firstName} {piece.submittedBy?.lastName}
                          </p>
                          <p className="text-sm text-slate-600">{piece.submittedBy?.email}</p>
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">{piece.temperatureType}</Badge>
                          <Badge variant="outline">{piece.clayType}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Biscuit:</span>{" "}
                            {piece.biscuitCompleted ? (
                              <span className="text-green-600">✓ Fait</span>
                            ) : piece.biscuitRequested ? (
                              <span className="text-orange-600">⏰ Demandé</span>
                            ) : (
                              <span className="text-slate-400">❌ Non demandé</span>
                            )}
                          </div>
                          <div>
                            <span className="font-medium">Émaillage:</span>{" "}
                            {piece.emaillageCompleted ? (
                              <span className="text-green-600">✓ Fait</span>
                            ) : piece.emaillageRequested ? (
                              <span className="text-blue-600">⏰ Demandé</span>
                            ) : (
                              <span className="text-slate-400">❌ Non demandé</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-slate-600">
                        Ajoutée le {new Date(piece.submittedDate).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ✅ Onglet Historique */}
          <TabsContent value="history" className="space-y-4">
            {completedPieces.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-8 text-center text-gray-600">
                  <p className="text-lg">✨ Aucune pièce terminée</p>
                  <p className="text-sm mt-2">L'historique apparaîtra ici</p>
                </CardContent>
              </Card>
            ) : (
              completedPieces.map((piece) => (
                <Card key={piece.id} className="bg-green-50 border-l-4 border-green-600 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid gap-6 md:grid-cols-[120px_1fr_auto] items-center">
                      {piece.photoUrl && (
                        <img
                          src={piece.photoUrl}
                          alt="Pièce"
                          className="w-full h-28 object-cover rounded-lg shadow-sm"
                        />
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">✅</span>
                          <div>
                            <p className="font-bold text-lg text-green-800">
                              {piece.submittedBy?.firstName} {piece.submittedBy?.lastName}
                            </p>
                            <p className="text-sm text-slate-600">{piece.submittedBy?.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline" className="bg-white">
                            {piece.temperatureType}
                          </Badge>
                          <Badge variant="outline" className="bg-white">
                            {piece.clayType}
                          </Badge>
                          <Badge className="bg-green-600 text-white">
                            Terminée
                          </Badge>
                        </div>
                        
                        {piece.notes && (
                          <p className="text-sm text-slate-600 italic">"{piece.notes}"</p>
                        )}
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <p className="font-semibold text-green-700">Dates de cuisson</p>
                        <p className="text-slate-600">
                          🔥 Biscuit: {piece.biscuitCompletedDate 
                            ? new Date(piece.biscuitCompletedDate).toLocaleDateString("fr-FR")
                            : "N/A"
                          }
                        </p>
                        <p className="text-slate-600">
                          🎨 Émaillage: {piece.emaillageCompletedDate 
                            ? new Date(piece.emaillageCompletedDate).toLocaleDateString("fr-FR")
                            : "N/A"
                          }
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