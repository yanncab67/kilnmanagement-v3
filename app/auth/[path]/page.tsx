import { AuthView } from "@neondatabase/neon-js/auth/react/ui"

export const dynamicParams = false

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>
}) {
  const { path } = await params

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5d4c5] to-white">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <AuthView path={path} />
      </div>
    </main>
  )
}