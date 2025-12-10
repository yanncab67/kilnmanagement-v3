"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface StudentFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
}

export default function StudentForm({ onSubmit, onCancel }: StudentFormProps) {
  const [photoUrl, setPhotoUrl] = useState("")
  const [firingType, setFiringType] = useState("Biscuit")
  const [temperatureType, setTemperatureType] = useState("Haute température")
  const [clayType, setClayType] = useState("Grès")
  const [desiredDate, setDesiredDate] = useState("")
  const [notes, setNotes] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoCapture = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = () => {
    if (!photoUrl || !desiredDate) {
      alert("Veuillez remplir tous les champs requis")
      return
    }

    onSubmit({
      photo: photoUrl,
      firingType,
      temperatureType,
      clayType,
      desiredDate,
      notes,
      submittedDate: new Date().toISOString().split("T")[0],
    })

    setPhotoUrl("")
    setFiringType("Biscuit")
    setTemperatureType("Haute température")
    setClayType("Grès")
    setDesiredDate("")
    setNotes("")
  }

  return (
    <div className="space-y-6">
      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">📷 Photo de la pièce *</label>
        <div
          onClick={handlePhotoCapture}
          className="border-2 border-dashed border-[#c8623e] rounded-lg p-6 text-center cursor-pointer hover:bg-[#f5d4c5] transition"
        >
          {photoUrl ? (
            <div className="flex flex-col items-center gap-2">
              <img src={photoUrl || "/placeholder.svg"} alt="Preview" className="h-32 w-32 object-cover rounded-lg" />
              <p className="text-sm text-slate-600">Cliquez pour changer la photo</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold text-[#c8623e]">Ajouter une photo</p>
              <p className="text-sm text-slate-500 mt-1">Cliquez pour prendre ou uploader</p>
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </div>

      {/* Firing Type */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Type de cuisson *</label>
        <select
          value={firingType}
          onChange={(e) => setFiringType(e.target.value)}
          className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-[#c8623e] focus:outline-none"
        >
          <option>Biscuit</option>
          <option>Émaillage</option>
          <option>Autre</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Type de température *</label>
        <select
          value={temperatureType}
          onChange={(e) => setTemperatureType(e.target.value)}
          className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-[#c8623e] focus:outline-none"
        >
          <option>Haute température</option>
          <option>Basse température</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Type de terre *</label>
        <select
          value={clayType}
          onChange={(e) => setClayType(e.target.value)}
          className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-[#c8623e] focus:outline-none"
        >
          <option>Grès</option>
          <option>Faïence</option>
          <option>Porcelaine</option>
        </select>
      </div>

      {/* Desired Date */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Date désirée de cuisson *</label>
        <input
          type="date"
          value={desiredDate}
          onChange={(e) => setDesiredDate(e.target.value)}
          className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-[#c8623e] focus:outline-none"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
        <Textarea
          placeholder="Remarques particulières sur votre pièce..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-[#c8623e] focus:outline-none min-h-24"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleSubmit}
          className="flex-1 bg-[#c8623e] hover:bg-[#b8523e] text-white py-2 rounded-lg font-semibold"
        >
          Déposer la pièce
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1 border-2 border-slate-300 text-slate-700 py-2 rounded-lg font-semibold bg-transparent"
        >
          Annuler
        </Button>
      </div>
    </div>
  )
}
