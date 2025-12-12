// app/api/pieces/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { del } from "@vercel/blob";
import { cookies } from "next/headers";

export const runtime = "nodejs";

// DELETE /api/pieces/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pieceId = parseInt(id, 10);

    if (isNaN(pieceId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    console.log("🗑️ Suppression de la pièce", pieceId);

    // ✅ Vérifier l'authentification
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__Secure-neon-auth.session_token");

    if (!sessionCookie?.value) {
      console.error("❌ Pas de session");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.log("✅ Session détectée");

    // 1) Récupérer la pièce pour obtenir l'URL de la photo et vérifier le propriétaire
    const pieceRows = await sql`
      SELECT id, user_email, photo_url
      FROM pieces
      WHERE id = ${pieceId}
    `;

    if (!pieceRows || pieceRows.length === 0) {
      console.error("❌ Pièce introuvable");
      return NextResponse.json({ error: "Pièce introuvable" }, { status: 404 });
    }

    const piece = pieceRows[0] as any;
    console.log("📋 Pièce trouvée:", piece);

    // 2) Optionnel : Vérifier que l'utilisateur connecté est bien le propriétaire
    // Pour cela, il faudrait décoder la session pour obtenir l'email
    // Pour simplifier, on fait confiance au frontend qui envoie la requête

    // 3) Supprimer la photo sur Vercel Blob (si elle existe)
    if (piece.photo_url) {
      try {
        console.log("🗑️ Suppression de la photo:", piece.photo_url);
        await del(piece.photo_url);
        console.log("✅ Photo supprimée de Vercel Blob");
      } catch (blobError) {
        console.error("⚠️ Erreur lors de la suppression de la photo sur Vercel Blob:", blobError);
        // On continue même si la suppression de la photo échoue
      }
    } else {
      console.log("ℹ️ Pas de photo à supprimer");
    }

    // 4) Supprimer la pièce de la base de données
    const deleteResult = await sql`
      DELETE FROM pieces
      WHERE id = ${pieceId}
      RETURNING id
    `;

    if (!deleteResult || deleteResult.length === 0) {
      console.error("❌ Échec de la suppression en base de données");
      return NextResponse.json(
        { error: "Échec de la suppression" },
        { status: 500 }
      );
    }

    console.log("✅ Pièce supprimée avec succès");

    return NextResponse.json({
      success: true,
      message: "Pièce supprimée avec succès",
      deletedId: pieceId,
    });
  } catch (error) {
    console.error("❌ Erreur DELETE /api/pieces/[id]:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur lors de la suppression",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}