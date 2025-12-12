"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function WelcomePage() {
  const router = useRouter();

  // On récupère la session Neon Auth côté client
  const { data: session, isPending } = authClient.useSession();
  
  useEffect(() => {
    if (isPending) return; // on attend que Neon ait fini de charger

    if (!session) {
      // pas de session -> on reste sur la page d'accueil
      return;
    }

    const user: any = session.user ?? {};
    console.log(user)
    const role =
      user.metadata?.role ??
      user.role ??
      user["role"] ??
      user.metadata?.["role"];

    if (role === "admin") {
      router.replace("/admin");
    } else {
      // tous les autres rôles (ou aucun rôle) -> praticien
      router.replace("/practician");
    }
  }, [isPending, session, router]);

  // Pendant qu’on vérifie la session, petit écran de chargement
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5d4c5] via-slate-50 to-[#e8a089]">
        <p className="text-slate-700 text-lg">Vérification de votre session...</p>
      </div>
    );
  }

  // Si pas de session -> écran de bienvenue classique
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5d4c5] via-slate-50 to-[#e8a089] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 border-[#c8623e] shadow-2xl">
        <CardContent className="pt-12 pb-12">
          {/* Pottery Icon */}
          <div className="text-center mb-8">
            <div className="text-8xl mb-6">🏺</div>
            <h1 className="text-4xl font-bold text-[#8b6d47] mb-4 text-balance">
              Bienvenue sur l&apos;interface de gestion des cuissons céramique de La CabAnnne
            </h1>
          </div>

          {/* Bouton de connexion */}
          <div className="flex justify-center">
            <Button
              onClick={() => router.push("/auth/sign-in")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 text-xl rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Se connecter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
