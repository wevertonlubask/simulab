import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  GraduationCap,
  BookOpen,
  Trophy,
  Smartphone,
  Wifi,
  Bell,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">S</span>
            </div>
            <span className="text-xl font-bold text-primary">Simulab</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button>Cadastrar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Sua evolução em{" "}
          <span className="text-primary">cada questão</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Prepare-se para certificações profissionais com simulados inteligentes.
          Cisco, AWS, Microsoft, CompTIA e muito mais.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Começar Agora
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Já tenho conta
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold">
            Por que escolher o Simulab?
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-lg border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">
                Banco de Questões
              </h3>
              <p className="mt-2 text-muted-foreground">
                Milhares de questões organizadas por certificação e dificuldade.
                8 tipos de questões diferentes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-lg border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">
                Acompanhe seu Progresso
              </h3>
              <p className="mt-2 text-muted-foreground">
                Dashboard completo com estatísticas, evolução e áreas que precisam
                de mais atenção.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-lg border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">
                Gamificação
              </h3>
              <p className="mt-2 text-muted-foreground">
                Conquiste medalhas, suba de nível e compare seu progresso com
                outros alunos.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-lg border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">
                Instale como App
              </h3>
              <p className="mt-2 text-muted-foreground">
                PWA - Instale o Simulab como um app nativo no seu celular.
                Acesso rápido e experiência fluida.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-lg border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Wifi className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">
                Funciona Offline
              </h3>
              <p className="mt-2 text-muted-foreground">
                Faça provas mesmo sem internet. Suas respostas serão
                sincronizadas quando voltar online.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-lg border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">
                Notificações Push
              </h3>
              <p className="mt-2 text-muted-foreground">
                Receba alertas de novas provas, lembretes de estudo e resultados
                diretamente no celular.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">
            Pronto para começar sua jornada?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Junte-se a milhares de profissionais que já usam o Simulab para se
            preparar para suas certificações.
          </p>
          <Link href="/register" className="mt-8 inline-block">
            <Button size="lg" className="gap-2">
              Criar conta grátis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Simulab. Todos os direitos reservados.</p>
          <p className="mt-2">simulab.app.br</p>
        </div>
      </footer>
    </div>
  );
}
