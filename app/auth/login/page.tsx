import { login } from "../actions"
import LoginForm from "@/components/login-form"

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams
  const error = searchParams.error

  return <LoginForm error={error} loginAction={login} />
}