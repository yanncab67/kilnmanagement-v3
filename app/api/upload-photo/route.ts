// app/api/upload-photo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // 1) Vérifier la session via l’endpoint Neon (pas de hook React côté serveur)
    const cookie = req.headers.get("cookie") ?? "";
    const baseUrl = new URL(req.url).origin;

    const sessionRes = await fetch(`${baseUrl}/api/auth/get-session`, {
      method: "GET",
      headers: { cookie },
      cache: "no-store",
    });

    if (!sessionRes.ok) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const sessionJson = await sessionRes.json();
    const session = sessionJson?.session;

    if (!session?.user) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const user = session.user as any;

    // 2) Récupérer le fichier envoyé en multipart/form-data
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return new NextResponse("Aucun fichier envoyé", { status: 400 });
    }

    // 3) Validations
    const maxSize = 5 * 1024 * 1024; // 5 Mo
    if (file.size > maxSize) {
      return new NextResponse("Fichier trop volumineux (max 5 Mo)", { status: 413 });
    }

    const mimeType = file.type;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(mimeType)) {
      return new NextResponse("Type de fichier non supporté", { status: 415 });
    }

    const ext =
      mimeType === "image/png" ? "png" :
      mimeType === "image/webp" ? "webp" :
      "jpg";

    // 4) Nom de fichier (unique) + upload Vercel Blob
    const fileName = `pieces/${user.id}-${crypto.randomUUID()}.${ext}`;

    const blob = await put(fileName, file, {
      access: "public",
      contentType: mimeType,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Erreur POST /api/upload-photo", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}