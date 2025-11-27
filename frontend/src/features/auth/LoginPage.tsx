import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Truck } from "lucide-react"

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      localStorage.setItem("auth", "true")
      setIsLoading(false)
      navigate("/dashboard")
    }, 1000)
  }

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" style={{
          backgroundImage: `url(/bg_login.jpeg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
          <div className="absolute inset-0 bg-black opacity-50" />
        </div>
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Truck className="mr-2 h-8 w-8" />
          EcoFleet
        </div>
        <div className="relative z-20 mt-auto">
          <p className="text-lg">
            "A gestão de frotas do futuro, hoje. Otimize rotas, reduza custos e
            monitore sua operação em tempo real com nossa solução inteligente."
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Acesse sua conta para gerenciar sua frota.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                className="focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input id="password" type="password" required className="focus:ring-2 focus:ring-ring" />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage