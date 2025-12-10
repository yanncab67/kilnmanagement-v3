"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState("")

  const handleLogin = () => {
    setError("")
    if (!email || !password) {
      setError("Veuillez remplir tous les champs")
      return
    }

    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const user = users.find((u: any) => u.email === email && u.password === password)

    if (user) {
      localStorage.setItem("user", JSON.stringify(user))
      window.location.href = user.role === "admin" ? "/admin" : "/practician"
    } else {
      setError("Identifiants incorrects")
    }
  }

  const handleSignup = () => {
    setError("")
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      setError("Veuillez remplir tous les champs")
      return
    }
    if (!email.includes("@")) {
      setError("Veuillez entrer une adresse email valide")
      return
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      return
    }

    const users = JSON.parse(localStorage.getItem("users") || "[]")
    if (users.find((u: any) => u.email === email)) {
      setError("Cet email est déjà utilisé")
      return
    }

    const newUser = { email, password, role: "user", firstName, lastName }
    users.push(newUser)
    localStorage.setItem("users", JSON.stringify(users))
    localStorage.setItem("user", JSON.stringify(newUser))
    window.location.href = "/practician"
  }

  const handleDemoLogin = (role: string) => {
    const demoUser = {
      email: role === "admin" ? "admin@kiln.com" : "student@kiln.com",
      role,
      firstName: role === "admin" ? "Admin" : "Jean",
      lastName: role === "admin" ? "Manager" : "Potter",
    }
    localStorage.setItem("user", JSON.stringify(demoUser))
    window.location.href = role === "admin" ? "/admin" : "/practician"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5d4c5] via-slate-50 to-[#e8a089] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-[#c8623e] shadow-xl">
        <CardContent className="pt-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🏺</div>
            <h1 className="text-3xl font-bold text-[#8b6d47]">Kiln Management</h1>
            <p className="text-slate-600 mt-2">Gestion des cuissons céramiques</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              onClick={() => {
                setMode("login")
                setError("")
              }}
              className={`flex-1 ${
                mode === "login" ? "bg-[#c8623e] text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              Connexion
            </Button>
            <Button
              onClick={() => {
                setMode("signup")
                setError("")
              }}
              className={`flex-1 ${
                mode === "signup" ? "bg-[#c8623e] text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              Créer un compte
            </Button>
          </div>

          {/* Form */}
          <div className="space-y-4 mb-6">
            {mode === "signup" && (
              <>
                <input
                  type="text"
                  placeholder="Prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-[#c8623e] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Nom"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-[#c8623e] focus:outline-none"
                />
              </>
            )}
            <input
              type="email"
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-[#c8623e] focus:outline-none"
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-[#c8623e] focus:outline-none"
            />
            {mode === "signup" && (
              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-[#c8623e] focus:outline-none"
              />
            )}
          </div>

          {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

          {/* Submit Button */}
          <Button
            onClick={mode === "login" ? handleLogin : handleSignup}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold mb-4"
          >
            {mode === "login" ? "Se connecter" : "Créer un compte"}
          </Button>

          {/* Demo Buttons */}
          <div className="border-t-2 border-slate-200 pt-4">
            <p className="text-center text-sm text-slate-600 mb-3">Accès rapide (démo):</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleDemoLogin("user")}
                variant="outline"
                className="border-2 border-[#e8a089] text-[#8b6d47] hover:bg-[#f5d4c5]"
              >
                Artisan
              </Button>
              <Button
                onClick={() => handleDemoLogin("admin")}
                variant="outline"
                className="border-2 border-[#c8623e] text-[#c8623e] hover:bg-[#e8a089]"
              >
                Admin
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
