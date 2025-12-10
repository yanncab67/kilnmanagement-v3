import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userEmail = searchParams.get("userEmail")

    let rows

    if (userEmail) {
      rows = await sql/* sql */`
        SELECT
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
        FROM pieces
        WHERE user_email = ${userEmail}
        ORDER BY submitted_date DESC
      `
    } else {
      // 🔹 cas admin : toutes les pièces
      rows = await sql/* sql */`
        SELECT
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
        FROM pieces
        ORDER BY submitted_date DESC
      `
    }

    const pieces = rows.map((row: any) => ({
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
    }))

    return NextResponse.json(pieces)
  } catch (error) {
    console.error("Erreur GET /api/pieces", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userEmail,
      firstName,
      lastName,
      photo,
      temperatureType,
      clayType,
      notes,
      biscuitAlreadyDone,
    } = body

    // Champs obligatoires minimaux
    if (!userEmail || !firstName || !lastName || !photo || !temperatureType || !clayType) {
      return NextResponse.json(
        { error: "userEmail, firstName, lastName, photo, temperatureType et clayType sont requis" },
        { status: 400 },
      )
    }

    const biscuitDone = Boolean(biscuitAlreadyDone)

    const rows = await sql/* sql */`
      INSERT INTO pieces (
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
        emaillage_completed_date
      ) VALUES (
        ${userEmail},
        ${firstName},
        ${lastName},
        ${photo},
        ${temperatureType},
        ${clayType},
        ${notes ?? null},
        ${false},
        ${biscuitDone},
        ${null},
        ${biscuitDone ? sql`NOW()` : null},
        ${false},
        ${false},
        ${null},
        ${null}
      )
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

    return NextResponse.json(piece, { status: 201 })
  } catch (error) {
    console.error("Erreur POST /api/pieces", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}