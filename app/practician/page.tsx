"use client"

import type React from "react"
import { authClient } from "@/lib/auth/client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export default function PracticianPage() {
  const router = useRouter()

  // ✅ Neon session
  const { data: session, isPending } = authClient.useSession()

  const [showForm, setShowForm] = useState(false)
  const [pieces, setPieces] = useState<any[]>([])
  const [completedPieces, setCompletedPieces] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [activePieceId, setActivePieceId] = useState<number | null>(null)
  const [requestType, setRequestType] = useState<"biscuit" | "emaillage" | null>(null)
  const [showDateDialog, setShowDateDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  
  // ✅ États pour la photo
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState("")
  const [photoUrl, setPhotoUrl] = useState("") // ✅ AJOUTÉ
  const [isUploading, setIsUploading] = useState(false) // ✅ AJOUTÉ
  
  const [temperatureType, setTemperatureType] = useState("")
  const [clayType, setClayType] = useState("")
  const [notes, setNotes] = useState("")
  const [biscuitDone, setBiscuitDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const user = session?.user as any
  const userEmail: string = user?.email ?? ""
  const firstName: string = user?.metadata?.firstName ?? user?.name ?? ""

  const loadPieces = async (email: string) => {
    try {
      console.log("🔄 Chargement des pièces pour:", email)
      const res = await fetch(`/api/pieces?userEmail=${encodeURIComponent(email)}`)
      if (!res.ok) {
        console.error("❌ Erreur lors du chargement des pièces:", res.status)
        return
      }
      const data = await res.json()
      console.log("✅ Pièces chargées:", data.length)

      const active = data.filter((piece: any) => !(piece.biscuitCompleted && piece.emaillageCompleted))
      const completed = data.filter((piece: any) => piece.biscuitCompleted && piece.emaillageCompleted)

      setPieces(active)
      setCompletedPieces(completed)
      console.log("📊 Pièces actives:", active.length, "| Terminées:", completed.length)
    } catch (error) {
      console.error("❌ Erreur réseau lors du chargement des pièces", error)
    }
  }

  // ✅ Redirection + chargement des pièces
  useEffect(() => {
    if (isPending) return

    if (!session) {
      console.log("🔒 Pas de session, redirection vers login")
      router.replace("/auth/sign-in?redirectTo=/practician")
      return
    }

    if (userEmail) {
      console.log("👤 Utilisateur connecté:", userEmail)
      loadPieces(userEmail)
    }
  }, [isPending, session, userEmail, router])

  // ✅ NOUVELLE FONCTION : Upload immédiat au changement de fichier
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      console.log("⚠️ Aucun fichier sélectionné")
      return
    }

    console.log("📁 Fichier sélectionné:", file.name, file.type, file.size, "bytes")
    setPhotoFile(file)

    // Preview local
    const reader = new FileReader()
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string)
      console.log("👁️ Preview généré")
    }
    reader.readAsDataURL(file)

    // ✅ Upload immédiat vers Vercel Blob
    console.log("⬆️ Début de l'upload vers /api/upload-photo...")
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      })

      console.log("📊 Statut upload:", uploadRes.status, uploadRes.statusText)

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text()
        console.error("❌ Erreur upload - Réponse:", errorText)
        alert(`Impossible d'uploader la photo: ${errorText}`)
        
        // Reset en cas d'erreur
        setPhotoFile(null)
        setPhotoPreview("")
        setPhotoUrl("")
        return
      }

      const data = await uploadRes.json()
      console.log("✅ Photo uploadée avec succès! URL:", data.url)
      
      setPhotoUrl(data.url)
      alert("✅ Photo uploadée avec succès!")
      
    } catch (error) {
      console.error("❌ Erreur réseau lors de l'upload:", error)
      alert("Erreur lors de l'upload de la photo. Vérifiez la console.")
      
      // Reset en cas d'erreur
      setPhotoFile(null)
      setPhotoPreview("")
      setPhotoUrl("")
    } finally {
      setIsUploading(false)
      console.log("🏁 Fin de l'upload")
    }
  }

  // ✅ FONCTION SIMPLIFIÉE : Plus besoin d'uploader ici
  const handleAddPiece = async () => {
    console.log("🔍 handleAddPiece - Début")
    console.log("📸 photoUrl:", photoUrl)
    console.log("🌡️ temperatureType:", temperatureType)
    console.log("🏺 clayType:", clayType)
    
    // ✅ Vérifier photoUrl au lieu de photoFile
    if (!photoUrl || !temperatureType || !clayType) {
      alert("Veuillez remplir tous les champs obligatoires (photo, température, type de terre)")
      console.log("⚠️ Champs manquants")
      return
    }
    
    if (!userEmail) {
      console.log("⚠️ Pas d'email utilisateur")
      return
    }

    try {
      console.log("📤 Création de la pièce avec l'URL photo:", photoUrl)
      
      const res = await fetch("/api/pieces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail,
          firstName,
          photoUrl, // ✅ Utiliser photoUrl directement
          temperatureType,
          clayType,
          notes,
          biscuitAlreadyDone: biscuitDone,
        }),
      })

      console.log("📊 Statut création pièce:", res.status)

      if (!res.ok) {
        const errorText = await res.text()
        console.error("❌ Erreur lors de l'ajout de la pièce:", errorText)
        alert("Erreur lors de la création de la pièce")
        return
      }

      const newPiece = await res.json()
      console.log("✅ Pièce créée avec succès:", newPiece)
      
      alert("✅ Pièce ajoutée avec succès!")
      
      // Recharger les pièces
      await loadPieces(userEmail)

      // ✅ Reset complet du formulaire
      setShowForm(false)
      setPhotoFile(null)
      setPhotoPreview("")
      setPhotoUrl("") // ✅ Reset photoUrl
      setTemperatureType("")
      setClayType("")
      setNotes("")
      setBiscuitDone(false)
      
      console.log("🧹 Formulaire réinitialisé")
      
    } catch (error) {
      console.error("❌ Erreur réseau lors de l'ajout de la pièce:", error)
      alert("Erreur réseau. Vérifiez la console.")
    }
  }

  const handleRequestFiring = (pieceId: number, type: "biscuit" | "emaillage") => {
    console.log("🔥 Demande de cuisson:", type, "pour pièce", pieceId)
    setActivePieceId(pieceId)
    setRequestType(type)
    setShowDateDialog(true)
  }

  const confirmFiringRequest = async () => {
    if (!selectedDate || !activePieceId || !requestType || !userEmail) {
      console.log("⚠️ Données manquantes pour la demande de cuisson")
      return
    }

    console.log("📅 Confirmation demande de cuisson:", {
      pieceId: activePieceId,
      type: requestType,
      date: selectedDate
    })

    try {
      const res = await fetch("/api/pieces/firing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pieceId: activePieceId,
          type: requestType,
          desiredDate: selectedDate,
        }),
      })

      console.log("📊 Statut demande cuisson:", res.status)

      if (!res.ok) {
        console.error("❌ Erreur lors de la demande de cuisson")
        alert("Erreur lors de la demande de cuisson")
        return
      }

      console.log("✅ Demande de cuisson enregistrée")
      await loadPieces(userEmail)

      setShowDateDialog(false)
      setSelectedDate("")
      setActivePieceId(null)
      setRequestType(null)
    } catch (error) {
      console.error("❌ Erreur réseau lors de la demande de cuisson:", error)
    }
  }

  const handleLogout = () => {
    console.log("👋 Déconnexion")
    router.push("/auth/sign-out")
  }

  const handlePhotoCapture = () => {
    console.log("📷 Ouverture sélecteur de fichier")
    fileInputRef.current?.click()
  }

  // ✅ Rendu "safe"
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c8623e] mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement de votre session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Redirection vers la connexion...</p>
      </div>
    )
  }

  const currentUser = { email: userEmail, firstName }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5d4c5] to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#8b6d47] flex items-center gap-2">🏺 Mes Pièces en Cuisson</h1>
              <p className="text-slate-600 mt-1">
                Connecté en tant que: {currentUser.firstName} ({currentUser.email})
              </p>
            </div>
            <Button onClick={handleLogout} className="bg-blue-600 hover:bg-blue-700">
              Déconnexion
            </Button>
          </div>
        </div>

        {/* New Piece Button */}
        {!showForm && (
          <div className="mb-8">
            <Button
              onClick={() => setShowForm(true)}
              className="w-full md:w-auto bg-[#c8623e] hover:bg-[#b8523e] text-white text-lg py-6 px-8 rounded-xl font-semibold"
            >
              ➕ Nouvelle Pièce
            </Button>
          </div>
        )}

        {/* Add Piece Form */}
        {showForm && (
          <Card className="mb-8">
            <CardContent className="p-6 space-y-6">
              <h2 className="text-2xl font-bold text-[#8b6d47]">Ajouter une nouvelle pièce</h2>

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
                      <p className="text-xs text-slate-500">Veuillez patienter</p>
                    </div>
                  ) : photoPreview && photoUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="h-32 w-32 object-cover rounded-lg"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 text-xl">✅</span>
                        <p className="text-sm text-green-600 font-semibold">Photo uploadée avec succès</p>
                      </div>
                      <p className="text-xs text-slate-500">Cliquez pour changer la photo</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-semibold text-[#c8623e]">📷 Ajouter une photo</p>
                      <p className="text-sm text-slate-500 mt-1">Cliquez pour prendre ou uploader</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Type de cuisson *</Label>
                <Select value={temperatureType} onValueChange={setTemperatureType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Haute température">Haute température</SelectItem>
                    <SelectItem value="Basse température">Basse température</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clayType">Type de terre *</Label>
                <Select value={clayType} onValueChange={setClayType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grès">Grès</SelectItem>
                    <SelectItem value="Faïence">Faïence</SelectItem>
                    <SelectItem value="Porcelaine">Porcelaine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Remarques particulières..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="biscuit"
                  checked={biscuitDone}
                  onCheckedChange={(checked) => setBiscuitDone(checked as boolean)}
                />
                <Label htmlFor="biscuit" className="cursor-pointer">
                  Le biscuit a déjà été fait
                </Label>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={handleAddPiece} 
                  className="bg-[#c8623e] hover:bg-[#b8523e]"
                  disabled={isUploading || !photoUrl}
                >
                  {isUploading ? "Upload en cours..." : "Ajouter la pièce"}
                </Button>
                <Button 
                  onClick={() => {
                    setShowForm(false)
                    setPhotoFile(null)
                    setPhotoPreview("")
                    setPhotoUrl("")
                    setTemperatureType("")
                    setClayType("")
                    setNotes("")
                    setBiscuitDone(false)
                  }} 
                  variant="outline"
                  disabled={isUploading}
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pieces Grid */}
        <div>
          <h2 className="text-2xl font-bold text-[#8b6d47] mb-6">Mes pièces en cours</h2>
          {pieces.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500 text-lg">Vous n'avez pas de pièces en cours</p>
                <p className="text-slate-400 mt-2">Cliquez sur "Nouvelle Pièce" pour commencer</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pieces.map((piece) => (
                <Card key={piece.id} className="overflow-hidden">
                  <div className="relative">
                    {piece.photoUrl && (
                      <img
                        src={piece.photoUrl}
                        alt="Ceramic piece"
                        className="w-full h-48 object-cover"
                      />
                    )}
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs">{piece.temperatureType}</span>
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs">{piece.clayType}</span>
                    </div>
                    {piece.notes && <p className="text-sm text-slate-600 italic">"{piece.notes}"</p>}

                    <div className="space-y-2 pt-2">
                      <Button
                        onClick={() => handleRequestFiring(piece.id, "biscuit")}
                        disabled={piece.biscuitCompleted || piece.biscuitRequested}
                        className={`w-full ${
                          piece.biscuitCompleted
                            ? "bg-green-600 hover:bg-green-600"
                            : "bg-[#c8623e] hover:bg-[#b8523e]"
                        }`}
                      >
                        {piece.biscuitCompleted ? "✓ Biscuit effectué" : piece.biscuitRequested ? "⏰ Biscuit demandé" : "Demander cuisson biscuit"}
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
                          : "Demander cuisson émaillage"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* History Section */}
        {completedPieces.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#8b6d47]">Historique des pièces terminées</h2>
              <Button
                onClick={() => setShowHistory(!showHistory)}
                variant="outline"
                className="border-[#8b6d47] text-[#8b6d47] hover:bg-[#8b6d47] hover:text-white"
              >
                {showHistory ? "Masquer l'historique" : "Afficher l'historique"} ({completedPieces.length})
              </Button>
            </div>

            {showHistory && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completedPieces.map((piece) => (
                  <Card key={piece.id} className="overflow-hidden border-2 border-green-200 bg-green-50">
                    <div className="relative">
                      {piece.photoUrl && (
                        <img
                          src={piece.photoUrl}
                          alt="Ceramic piece"
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        ✓ Terminée
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex gap-2 flex-wrap">
                        <span className="bg-green-100 px-2 py-1 rounded text-xs font-medium">{piece.temperatureType}</span>
                        <span className="bg-green-100 px-2 py-1 rounded text-xs font-medium">{piece.clayType}</span>
                      </div>
                      {piece.notes && <p className="text-sm text-slate-600 italic">"{piece.notes}"</p>}
                      <div className="space-y-2 pt-2 border-t border-green-200">
                        <div className="text-xs text-slate-600 space-y-1">
                          <div className="flex justify-between">
                            <span>✓ Biscuit:</span>
                            <span className="font-medium">{piece.biscuitDate || "Non spécifié"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>✓ Émaillage:</span>
                            <span className="font-medium">{piece.emaillageDate || "Non spécifié"}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Date Selection Dialog */}
      <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choisir la date souhaitée</DialogTitle>
            <DialogDescription>
              Sélectionnez la date à laquelle vous souhaitez que la cuisson {requestType} soit effectuée
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date souhaitée</Label>
              <Input id="date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={confirmFiringRequest} className="bg-[#c8623e] hover:bg-[#b8523e]">
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}