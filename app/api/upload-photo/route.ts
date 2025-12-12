// app/api/upload-photo/route.ts - VERSION SIMPLIFIÉE
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    console.log("🔍 Upload photo - Début");
    
    // ✅ Vérifier le cookie Neon Auth
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__Secure-neon-auth.session_token");
    
    if (!sessionCookie?.value) {
      console.error("❌ Pas de session Neon Auth");
      return new NextResponse("Non autorisé - Connectez-vous d'abord", { status: 401 });
    }

    console.log("✅ Session Neon Auth détectée");
    
    // Récupérer le fichier
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      console.error("❌ Aucun fichier");
      return new NextResponse("Aucun fichier envoyé", { status: 400 });
    }

    console.log("📁 Fichier reçu:", file.name, file.type, file.size, "bytes");

    // Validations
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error("❌ Fichier trop volumineux");
      return new NextResponse("Fichier trop volumineux (max 5 Mo)", { status: 413 });
    }

    const mimeType = file.type;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(mimeType)) {
      console.error("❌ Type non supporté:", mimeType);
      return new NextResponse("Type de fichier non supporté", { status: 415 });
    }

    // Upload
    const ext = 
      mimeType === "image/png" ? "png" : 
      mimeType === "image/webp" ? "webp" : 
      "jpg";
      
    const fileName = `pieces/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    
    console.log("⬆️ Upload vers Vercel Blob:", fileName);
    
    const blob = await put(fileName, file, {
      access: "public",
      contentType: mimeType,
    });

    console.log("✅ Upload réussi! URL:", blob.url);
    
    return NextResponse.json({ url: blob.url });
    
  } catch (err) {
    console.error("❌ Erreur POST /api/upload-photo:", err);
    return NextResponse.json({ 
      error: "Erreur serveur", 
      details: err instanceof Error ? err.message : String(err) 
    }, { status: 500 });
  }
}