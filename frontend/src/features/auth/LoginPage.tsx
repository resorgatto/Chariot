import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { loginRequest } from "@/lib/api"

const LoginPage = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    const trimmedUsername = username.trim()
    if (!trimmedUsername || !password) {
      setErrorMessage("Informe usuario e senha.")
      return
    }

    setIsLoading(true)

    try {
      const result = await loginRequest(trimmedUsername, password)
      const me = result.me
      const isAdmin =
        (me?.is_staff ?? false) || (me?.is_superuser ?? false) || localStorage.getItem("is_staff") === "true" || localStorage.getItem("is_superuser") === "true"
      const isDriver = me?.is_driver ?? (localStorage.getItem("is_driver") === "true")

      if (isDriver && !isAdmin) {
        navigate("/my-orders", { replace: true })
      } else if (isAdmin) {
        navigate("/dashboard", { replace: true })
      } else {
        navigate("/dashboard", { replace: true })
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao autenticar."
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2 bg-background">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.35) 65%, rgba(0,0,0,0.55)), radial-gradient(circle at 90% 90%, rgba(0,0,0,0.35), rgba(0,0,0,0.6) 35%), url("/logo.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="relative z-20 flex items-center text-lg font-medium"></div>
        <div className="relative z-20 mt-auto space-y-3">
          <p className="text-2xl font-semibold text-white">Chariot</p>
          <p className="text-lg max-w-md text-white">
            Orquestre sua frota com clareza. Cadastre garagens, associe caminhões e monitore rotas com a Chariot.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold dark:text-white">Entrar na Chariot</h1>
            <p className="text-balance text-muted-foreground">
              Acesse sua conta para comandar a frota com estilo.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <p className="text-sm text-muted-foreground">
              Use admin / admin123 para acessar e testar o sistema.
            </p>
            <div className="grid gap-2">
              <Label htmlFor="username" className="dark:text-white">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                required
                className="focus:ring-2 focus:ring-ring"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password" className="dark:text-white">Senha</Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                className="focus:ring-2 focus:ring-ring"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
            {errorMessage && (
              <p className="text-sm text-red-500" role="alert">
                {errorMessage}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
