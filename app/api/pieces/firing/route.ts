import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// POST /api/pieces/firing
// body: { pieceId: number, type: "biscuit" | "emaillage", desiredDate: string (YYYY-MM-DD) }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pieceId, type, desiredDate } = body

    if (!pieceId || !type || !desiredDate) {
      return NextResponse.json(
        { error: "pieceId, type et desiredDate sont requis" },
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
          biscuit_requested = TRUE,
          biscuit_date = ${desiredDate}::date
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
          emaillage_requested,
          emaillage_completed,
          emaillage_date,
          submitted_date
      `
    } else {
      rows = await sql/* sql */`
        UPDATE pieces
        SET
          emaillage_requested = TRUE,
          emaillage_date = ${desiredDate}::date
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
          emaillage_requested,
          emaillage_completed,
          emaillage_date,
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
      emaillageRequested: row.emaillage_requested,
      emaillageCompleted: row.emaillage_completed,
      emaillageDate: row.emaillage_date,
      submittedDate: row.submitted_date,
    }

    return NextResponse.json(piece)
  } catch (error) {
    console.error("Erreur POST /api/pieces/firing", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
