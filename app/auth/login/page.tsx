import { login } from "../actions"
import LoginForm from "@/components/login-form"

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string; exito?: string }>
}) {
  const searchParams = await props.searchParams
  const error = searchParams.error
  const exito = searchParams.exito

  return <LoginForm error={error} exito={exito} loginAction={login} />
}
