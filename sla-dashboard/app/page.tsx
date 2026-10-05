import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">SLA Dashboard</CardTitle>
          <CardDescription>
            Sistema de seguimiento de solicitudes y SLA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/api/auth/signin" method="POST">
            <Button type="submit" className="w-full" size="lg">
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M11.5 2.5h-9v9h9v-9zm1 0v9h9v-9h-9zm-1 10h-9v9h9v-9zm1 0v9h9v-9h-9z"
                />
              </svg>
              Iniciar sesión con Microsoft
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
