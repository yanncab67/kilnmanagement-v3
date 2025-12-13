"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function WelcomePage() {
  const router = useRouter();
  const hasRedirected = useRef(false);
  const { data: session, isPending } = authClient.useSession();
  
  useEffect(() => {
    // Éviter les redirections multiples
    if (hasRedirected.current) return;
    
    // Attendre que la session soit chargée
    if (isPending) return;

    // Le middleware a déjà redirigé les non-connectés vers /auth/sign-in
    // Donc ici, on a forcément une session
    if (!session) return;

    const user: any = session.user ?? {};
    const role =
      user.metadata?.role ??
      user.role ??
      user["role"] ??
      user.metadata?.["role"];

    hasRedirected.current = true;
    
    if (role === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/practician");
    }
  }, [isPending, session, router]);

  // Écran de chargement pendant la redirection
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5d4c5] via-slate-50 to-[#e8a089]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#8b6d47] mx-auto mb-4"></div>
        <p className="text-slate-700 text-lg">Redirection en cours...</p>
      </div>
    </div>
  );
}