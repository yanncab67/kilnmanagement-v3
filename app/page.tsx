import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomePage() {
  // Vérifier s'il y a une session Neon
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('neon-session');
  
  // Si pas de session, rediriger vers login
  if (!sessionCookie) {
    redirect('/auth/sign-in');
  }
  
  // Si session existe, rediriger vers admin
  // (la page admin gérera la redirection vers /practician si besoin)
  redirect('/admin');
}