// lib/db.ts
import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL n'est pas définie")
}

export const sql = neon(process.env.DATABASE_URL)