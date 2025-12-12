"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Types
interface User {
  email: string | null
  firstName: string
  lastName: string
}

interface Piece {
  id: number
  photoUrl: string
  temperatureType: string
  clayType: string
  notes?: string
  biscuitRequested: boolean
  biscuitCompleted: boolean
  biscuitDate?: string
  biscuitCompletedDate?: string
  emaillageRequested: boolean
  emaillageCompleted: boolean
  emaillageDate?: string
  emaillageCompletedDate?: string
  submittedDate: string
}

export default function AdminMesPiecesPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  // États utilisateur
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [pieces, setPieces] = useState<Piece[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // États du formulaire
  const [showForm, setShowForm] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [temperatureType, setTemperatureType] = useState("Haute température")
  const [clayType, setClayType] = useState("Grès")
  const [notes, setNotes] = useState("")
  const [biscuitAlreadyDone, setBiscuitAlreadyDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // États pour la demande de cuisson
  const [showDateDialog, setShowDateDialog] = useState(false)
  const [requestType, setRequestType] = useState<"biscuit" | "emaillage" | null>(null)
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null)
  const [requestedDate, setRequestedDate] = useState("")

  // 🗑️ États pour la suppression
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [pieceToDelete, setPieceToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 🔒 Vérification session + rôle admin
  useEffect(() => {
    if (isPending) return

    if (!session) {
      console.log("🔒 Pas de session, redirection vers login")
      router.replace("/auth/sign-in?redirectTo=/admin/mes-pieces")
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
      console.log("⚠️ Utilisateur non-admin, redirection")
      router.replace("/practician")
      return
    }

    const current: User = {
      email: user.email ?? null,
      firstName: user.metadata?.firstName ?? user.name ?? "",
      lastName: user.metadata?.lastName ?? "",
    }

    console.log("✅ Admin connecté:", current.email)
    setCurrentUser(current)
  }, [isPending, session, router])

  // 📦 Charger les pièces de l'admin
  useEffect(() => {
    if (!currentUser?.email) return
    loadPieces(currentUser.email)
  }, [currentUser])

  const loadPieces = async (userEmail: string) => {
    setIsLoading(true)
    try {
      console.log("🔄 Chargement des pièces pour:", userEmail)
      const res = await fetch(`/api/pieces?userEmail=${encodeURIComponent(userEmail)}`)
      
      if (!res.ok) {
        console.error("❌ Erreur lors du chargement des pièces:", res.status)
        return
      }
      
      const data = await res.json()
      setPieces(data)
      console.log("✅ Pièces chargées:", data.length)
    } catch (error) {
      console.error("❌ Erreur réseau:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 📸 Upload immédiat de la photo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      console.log("⚠️ Aucun fichier sélectionné")
      return
    }

    console.log("📁 Fichier sélectionné:", file.name, file.type, file.size)
    setPhotoFile(file)

    // Preview local
    const reader = new FileReader()
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string)
      console.log("👁️ Preview généré")
    }
    reader.readAsDataURL(file)

    // Upload immédiat
    console.log("⬆️ Upload vers /api/upload-photo...")
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      })

      console.log("📊 Statut upload:", uploadRes.status)

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text()
        console.error("❌ Erreur upload:", errorText)
        alert(`Impossible d'uploader la photo: ${errorText}`)
        
        setPhotoFile(null)
        setPhotoPreview("")
        setPhotoUrl("")
        return
      }

      const data = await uploadRes.json()
      console.log("✅ Photo uploadée! URL:", data.url)
      
      setPhotoUrl(data.url)
      alert("✅ Photo uploadée avec succès!")
      
    } catch (error) {
      console.error("❌ Erreur réseau lors de l'upload:", error)
      alert("Erreur lors de l'upload. Vérifiez la console.")
      
      setPhotoFile(null)
      setPhotoPreview("")
      setPhotoUrl("")
    } finally {
      setIsUploading(false)
      console.log("🏁 Fin de l'upload")
    }
  }

  // ➕ Ajouter une pièce
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log("🔍 handleSubmit - Début")
    console.log("📸 photoUrl:", photoUrl)
    console.log("🌡️ temperatureType:", temperatureType)
    console.log("🏺 clayType:", clayType)

    if (!photoUrl || !temperatureType || !clayType) {
      alert("Veuillez remplir tous les champs obligatoires (photo, température, type de terre)")
      return
    }

    if (!currentUser?.email) return

    try {
      console.log("📤 Création de la pièce...")
      
      const res = await fetch("/api/pieces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: currentUser.email,
          firstName: currentUser.firstName,
          photoUrl,
          temperatureType,
          clayType,
          notes,
          biscuitAlreadyDone,
        }),
      })

      console.log("📊 Statut création:", res.status)

      if (!res.ok) {
        console.error("❌ Erreur lors de la création de la pièce")
        alert("Erreur lors de la création de la pièce")
        return
      }

      console.log("✅ Pièce créée avec succès")
      alert("✅ Pièce ajoutée avec succès!")

      await loadPieces(currentUser.email)

      // Reset formulaire
      setShowForm(false)
      setPhotoFile(null)
      setPhotoPreview("")
      setPhotoUrl("")
      setTemperatureType("Haute température")
      setClayType("Grès")
      setNotes("")
      setBiscuitAlreadyDone(false)
      
      console.log("🧹 Formulaire réinitialisé")
    } catch (error) {
      console.error("❌ Erreur réseau:", error)
      alert("Erreur réseau lors de la création")
    }
  }

  // 🔥 Demander une cuisson
  const handleRequestFiring = (pieceId: number, type: "biscuit" | "emaillage") => {
    console.log("🔥 Demande de cuisson:", type, "pour pièce", pieceId)
    setSelectedPieceId(pieceId)
    setRequestType(type)
    setRequestedDate("")
    setShowDateDialog(true)
  }

  // ✅ Confirmer la demande de cuisson
  const confirmFiringRequest = async () => {
    if (!requestedDate || !selectedPieceId || !requestType || !currentUser?.email) {
      console.log("⚠️ Données manquantes")
      return
    }

    console.log("📅 Confirmation demande:", { pieceId: selectedPieceId, type: requestType, date: requestedDate })

    try {
      const res = await fetch("/api/pieces/firing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pieceId: selectedPieceId,
          type: requestType,
          desiredDate: requestedDate,
        }),
      })

      console.log("📊 Statut demande:", res.status)

      if (!res.ok) {
        console.error("❌ Erreur lors de la demande de cuisson")
        alert("Erreur lors de la demande de cuisson")
        return
      }

      console.log("✅ Demande enregistrée")
      await loadPieces(currentUser.email)

      setShowDateDialog(false)
      setSelectedPieceId(null)
      setRequestType(null)
      setRequestedDate("")
    } catch (error) {
      console.error("❌ Erreur réseau:", error)
    }
  }

  // 🗑️ Ouvrir le dialog de suppression
  const openDeleteDialog = (pieceId: number) => {
    console.log("🗑️ Ouverture dialog de suppression pour pièce", pieceId)
    setPieceToDelete(pieceId)
    setShowDeleteDialog(true)
  }

  // 🗑️ Confirmer la suppression
  const confirmDelete = async () => {
    if (!pieceToDelete || !currentUser?.email) return

    console.log("🗑️ Suppression de la pièce", pieceToDelete)
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/pieces/${pieceToDelete}`, {
        method: "DELETE",
      })

      console.log("📊 Statut suppression:", res.status)

      if (!res.ok) {
        const errorData = await res.json()
        console.error("❌ Erreur:", errorData)
        alert("Erreur lors de la suppression de la pièce")
        setIsDeleting(false)
        return
      }

      const data = await res.json()
      console.log("✅ Pièce supprimée:", data)
      
      // Recharger les pièces
      await loadPieces(currentUser.email)

      setShowDeleteDialog(false)
      setPieceToDelete(null)
      setIsDeleting(false)
    } catch (error) {
      console.error("❌ Erreur réseau:", error)
      alert("Erreur réseau lors de la suppression")
      setIsDeleting(false)
    }
  }

  const handlePhotoCapture = () => {
    console.log("📷 Ouverture sélecteur de fichier")
    fileInputRef.current?.click()
  }

  // Filtrer les pièces
  const activePieces = pieces.filter((p) => !(p.biscuitCompleted && p.emaillageCompleted))
  const completedPieces = pieces.filter((p) => p.biscuitCompleted && p.emaillageCompleted)

  // 🔄 Écran de chargement
  if (isPending || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f5d4c5] to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#8b6d47] mx-auto mb-4"></div>
          <p className="text-[#8b6d47] text-lg font-semibold">Vérification des droits...</p>
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
                🏺 Mes Pièces
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold text-[#8b6d47]">
                  {currentUser.firstName} {currentUser.lastName}
                </span>{" "}
                ({currentUser.email})
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push("/admin")}
                variant="outline"
                className="border-[#8b6d47] text-[#8b6d47] hover:bg-[#8b6d47] hover:text-white"
              >
                🔥 Gestion des Cuissons
              </Button>
              <Button
                onClick={() => router.push("/auth/sign-out")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Statistiques rapides */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{activePieces.length}</p>
              <p className="text-sm text-gray-600 mt-1">Pièces en cours</p>
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

      <div className="max-w-6xl mx-auto px-4 pb-8 space-y-8">
        {/* ➕ Bouton Nouvelle Pièce */}
        <Button
          onClick={() => setShowForm(!showForm)}
          className="w-full bg-[#c8623e] hover:bg-[#a04f2e] text-white py-6 text-lg font-semibold rounded-xl"
        >
          {showForm ? "❌ Annuler" : "➕ Nouvelle Pièce"}
        </Button>

        {/* 📝 Formulaire d'ajout */}
        {showForm && (
          <Card className="border-2 border-[#c8623e] shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-2xl font-bold text-[#8b6d47]">Ajouter une nouvelle pièce</h2>

                {/* Photo */}
                <div className="space-y-2">
                  <Label>Photo de la pièce *</Label>
                  <div
                    onClick={isUploading ? undefined : handlePhotoCapture}
                    className={`border-2 border-dashed border-[#c8623e] rounded-lg p-6 text-center transition ${
                      isUploading ? "cursor-wait bg-gray-50" : "cursor-pointer hover:bg-[#f5d4c5]"
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8623e]"></div>
                        <p className="text-sm text-slate-600 font-semibold">Upload en cours...</p>
                      </div>
                    ) : photoPreview && photoUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="h-32 w-32 object-cover rounded-lg shadow-sm"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 text-xl">✅</span>
                          <p className="text-sm text-green-600 font-semibold">Photo uploadée</p>
                        </div>
                        <p className="text-xs text-slate-500">Cliquez pour changer</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-semibold text-[#c8623e]">📷 Ajouter une photo</p>
                        <p className="text-sm text-slate-500 mt-1">Cliquez pour uploader</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>

                {/* Température */}
                <div className="space-y-2">
                  <Label>Température de cuisson *</Label>
                  <Select value={temperatureType} onValueChange={setTemperatureType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Haute température">Haute température</SelectItem>
                      <SelectItem value="Basse température">Basse température</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type de terre */}
                <div className="space-y-2">
                  <Label>Type de terre *</Label>
                  <Select value={clayType} onValueChange={setClayType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Grès">Grès</SelectItem>
                      <SelectItem value="Faïence">Faïence</SelectItem>
                      <SelectItem value="Porcelaine">Porcelaine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Remarques particulières..."
                    rows={3}
                  />
                </div>

                {/* Biscuit déjà fait */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="biscuit-done"
                    checked={biscuitAlreadyDone}
                    onCheckedChange={(checked) => setBiscuitAlreadyDone(checked as boolean)}
                  />
                  <Label htmlFor="biscuit-done" className="cursor-pointer">
                    Le biscuit a déjà été effectué
                  </Label>
                </div>

                {/* Boutons */}
                <Button
                  type="submit"
                  className="w-full bg-[#8b6d47] hover:bg-[#6d5438] py-6 text-lg"
                  disabled={isUploading || !photoUrl}
                >
                  {isUploading ? "Upload en cours..." : "✓ Ajouter la pièce"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 🏺 Pièces en cours */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#8b6d47]">Pièces en cours</h2>
          
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b6d47] mx-auto mb-2"></div>
                <p className="text-gray-600">Chargement...</p>
              </CardContent>
            </Card>
          ) : activePieces.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="p-12 text-center">
                <p className="text-lg text-slate-500">Aucune pièce en cours</p>
                <p className="text-sm text-slate-400 mt-2">Cliquez sur "Nouvelle Pièce" pour commencer</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {activePieces.map((piece) => (
                <Card key={piece.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 space-y-4">
                    {piece.photoUrl && (
                      <img
                        src={piece.photoUrl}
                        alt="Pièce"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                    
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{piece.temperatureType}</Badge>
                      <Badge variant="outline">{piece.clayType}</Badge>
                    </div>
                    
                    {piece.notes && (
                      <p className="text-sm text-gray-600 italic">"{piece.notes}"</p>
                    )}

                    <div className="space-y-2">
                      <Button
                        onClick={() => handleRequestFiring(piece.id, "biscuit")}
                        disabled={piece.biscuitCompleted || piece.biscuitRequested}
                        className={`w-full ${
                          piece.biscuitCompleted
                            ? "bg-green-600 hover:bg-green-600"
                            : "bg-[#c8623e] hover:bg-[#b8523e]"
                        }`}
                      >
                        {piece.biscuitCompleted
                          ? "✓ Biscuit effectué"
                          : piece.biscuitRequested
                          ? "⏰ Biscuit demandé"
                          : "🔥 Demander cuisson biscuit"}
                      </Button>

                      <Button
                        onClick={() => handleRequestFiring(piece.id, "emaillage")}
                        disabled={!piece.biscuitCompleted || piece.emaillageRequested || piece.emaillageCompleted}
                        className={`w-full ${
                          piece.emaillageCompleted
                            ? "bg-green-600 hover:bg-green-600"
                            : !piece.biscuitCompleted
                            ? "bg-slate-300 hover:bg-slate-300"
                            : "bg-[#c8623e] hover:bg-[#b8523e]"
                        }`}
                      >
                        {piece.emaillageCompleted
                          ? "✓ Émaillage effectué"
                          : piece.emaillageRequested
                          ? "⏰ Émaillage demandé"
                          : !piece.biscuitCompleted
                          ? "⏰ En attente du biscuit"
                          : "🎨 Demander cuisson émaillage"}
                      </Button>

                      {/* 🗑️ Bouton de suppression */}
                      <Button
                        onClick={() => openDeleteDialog(piece.id)}
                        variant="destructive"
                        className="w-full"
                      >
                        🗑️ Supprimer cette pièce
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ✅ Historique des pièces terminées */}
        {completedPieces.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-green-700">✅ Historique - Pièces terminées</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {completedPieces.map((piece) => (
                <Card key={piece.id} className="bg-green-50 border-l-4 border-green-600">
                  <CardContent className="p-4 space-y-4">
                    {piece.photoUrl && (
                      <img
                        src={piece.photoUrl}
                        alt="Pièce"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                    
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="bg-white">{piece.temperatureType}</Badge>
                      <Badge variant="outline" className="bg-white">{piece.clayType}</Badge>
                      <Badge className="bg-green-600 text-white">✓ Terminée</Badge>
                    </div>
                    
                    {piece.notes && (
                      <p className="text-sm text-gray-600 italic">"{piece.notes}"</p>
                    )}
                    
                    <div className="text-xs text-green-700 space-y-1">
                      <p>
                        🔥 Biscuit: {piece.biscuitCompletedDate 
                          ? new Date(piece.biscuitCompletedDate).toLocaleDateString("fr-FR")
                          : "N/A"
                        }
                      </p>
                      <p>
                        🎨 Émaillage: {piece.emaillageCompletedDate 
                          ? new Date(piece.emaillageCompletedDate).toLocaleDateString("fr-FR")
                          : "N/A"
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 📅 Dialog de sélection de date */}
      <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choisir la date souhaitée</DialogTitle>
            <DialogDescription>
              Sélectionnez la date pour {requestType === "biscuit" ? "le biscuit" : "l'émaillage"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date souhaitée</Label>
              <Input
                id="date"
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDateDialog(false)
                setSelectedPieceId(null)
                setRequestType(null)
                setRequestedDate("")
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={confirmFiringRequest}
              className="bg-[#8b6d47] hover:bg-[#6d5438]"
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🗑️ Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette pièce ? 
              <br /><br />
              <strong className="text-red-600">Cette action est irréversible</strong> et supprimera :
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>La pièce de votre liste</li>
                <li>La photo associée</li>
                <li>Toutes les demandes de cuisson en cours</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteDialog(false)
                setPieceToDelete(null)
              }}
              disabled={isDeleting}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Suppression...
                </>
              ) : (
                <>🗑️ Supprimer</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}