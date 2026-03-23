import Link from "next/link"
import { login } from "../actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams
  const error = searchParams.error

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Sistema de Planificacion</h1>
            <p className="text-sm text-muted-foreground">DGCI - Control de Documentos</p>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Iniciar Sesion</CardTitle>
            <CardDescription>Ingrese sus credenciales para acceder al sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <form action={login} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Correo electronico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="usuario@dgci.gob"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Contrasena</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Iniciar Sesion
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {"No tiene cuenta? "}
              <Link href="/auth/sign-up" className="text-primary underline-offset-4 hover:underline">
                Registrarse
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
