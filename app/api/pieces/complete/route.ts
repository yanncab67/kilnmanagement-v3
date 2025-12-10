import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// POST /api/pieces/complete
// body: { pieceId: number, type: "biscuit" | "emaillage" }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pieceId, type } = body

    if (!pieceId || !type) {
      return NextResponse.json(
        { error: "pieceId et type sont requis" },
        { status: 400 },
      )
    }

    if (type !== "biscuit" && type !== "emaillage") {
      return NextResponse.json(
        { error: "type doit être 'biscuit' ou 'emaillage'" },
        { status: 400 },
      )
    }

    let rows

    if (type === "biscuit") {
      rows = await sql/* sql */`
        UPDATE pieces
        SET
          biscuit_completed = TRUE,
          biscuit_completed_date = NOW()
        WHERE id = ${pieceId}
        RETURNING
          id,
          user_email,
          user_first_name,
          user_last_name,
          photo,
          temperature_type,
          clay_type,
          notes,
          biscuit_requested,
          biscuit_completed,
          biscuit_date,
          biscuit_completed_date,
          emaillage_requested,
          emaillage_completed,
          emaillage_date,
          emaillage_completed_date,
          submitted_date
      `
    } else {
      rows = await sql/* sql */`
        UPDATE pieces
        SET
          emaillage_completed = TRUE,
          emaillage_completed_date = NOW()
        WHERE id = ${pieceId}
        RETURNING
          id,
          user_email,
          user_first_name,
          user_last_name,
          photo,
          temperature_type,
          clay_type,
          notes,
          biscuit_requested,
          biscuit_completed,
          biscuit_date,
          biscuit_completed_date,
          emaillage_requested,
          emaillage_completed,
          emaillage_date,
          emaillage_completed_date,
          submitted_date
      `
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Pièce introuvable" },
        { status: 404 },
      )
    }

    const row = rows[0]

    const piece = {
      id: row.id,
      submittedBy: {
        email: row.user_email,
        firstName: row.user_first_name,
        lastName: row.user_last_name,
      },
      photo: row.photo,
      temperatureType: row.temperature_type,
      clayType: row.clay_type,
      notes: row.notes,
      biscuitRequested: row.biscuit_requested,
      biscuitCompleted: row.biscuit_completed,
      biscuitDate: row.biscuit_date,
      biscuitCompletedDate: row.biscuit_completed_date,
      emaillageRequested: row.emaillage_requested,
      emaillageCompleted: row.emaillage_completed,
      emaillageDate: row.emaillage_date,
      emaillageCompletedDate: row.emaillage_completed_date,
      submittedDate: row.submitted_date,
    }

    return NextResponse.json(piece)
  } catch (error) {
    console.error("Erreur POST /api/pieces/complete", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
