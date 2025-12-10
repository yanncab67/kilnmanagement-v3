// lib/types.ts
//test
export type UserRole = "admin" | "user"

export interface User {
  id: number
  email: string
  password: string // ⚠️ plus tard : hashé, pas en clair
  firstName: string
  lastName: string
  role: UserRole
}

export type PieceStatus = "En attente" | "En cours" | "Prêt"

export type FiringType = "Biscuit" | "Email" | "Autre" | string

export interface Piece {
  id: number
  title: string
  description?: string
  imageUrl?: string
  clayType?: string
  glazeType?: string
  firingType: FiringType
  desiredDate?: string // ISO string (yyyy-mm-dd)
  priority: "Normal" | "Urgent"
  status: PieceStatus
  createdAt: string // ISO date
  // lien vers l'utilisateur qui l'a soumise
  submittedBy: {
    email: string
    firstName?: string
    lastName?: string
  }
}

export interface CookedPiece extends Piece {
  firedDate: string // ISO date
}
