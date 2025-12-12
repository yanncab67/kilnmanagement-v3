import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

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

    // On met à jour les bons champs selon le type de demande
    const rows =
      type === "biscuit"
        ? await sql/* sql */`
            UPDATE pieces
            SET
              biscuit_requested = true,
              biscuit_date = ${desiredDate}
            WHERE id = ${pieceId}
            RETURNING
              id,
              user_email,
              user_first_name,
              photo_url,
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
        : await sql/* sql */`
            UPDATE pieces
            SET
              emaillage_requested = true,
              emaillage_date = ${desiredDate}
            WHERE id = ${pieceId}
            RETURNING
              id,
              user_email,
              user_first_name,
              photo_url,
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

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Pièce introuvable" }, { status: 404 })
    }

    const row: any = rows[0]

    const updatedPiece = {
      id: row.id,
      submittedBy: {
        email: row.user_email,
        firstName: row.user_first_name,
      },
      photoUrl: row.photo_url,
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

    return NextResponse.json(updatedPiece)
  } catch (error) {
    console.error("Erreur POST /api/pieces/firing", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}