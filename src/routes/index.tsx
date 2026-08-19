import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  FileText,
  Plus,
  Download,
  Upload,
  Wrench,
  Clock,
  History,
  CheckCircle2,
  ShieldCheck,
  DollarSign,
  CreditCard,
  Calculator,
  Lock,
  LogOut,
  ChevronRight,
  Phone,
  MessageCircle,
  Eye,
  Camera,
  Bell,
  Zap,
  Check,
  Shield,
  Layers,
  ArrowRight,
  Building2,
  Home,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  MODELOS_CENTRAL,
  FORMAS_PAGAMENTO,
  OPCOES_GARANTIA_PADRAO,
  PERIODOS_VALIDADE_GARANTIA,
  calcularPrecoItemGarantia,
  obterMesesEstendidos,
  extrairGarantia,
  embutirGarantia,
  formatarMoeda,
  apenasDigitos,
  cpfValido,
  formatarCpf,
  formatarData,
  formatarMac,
  formatarTelefone,
  gerarId,
  type Cliente,
  type Manutencao,
  type TipoCobrancaGarantia,
} from "@/lib/clientes.types";
import {
  buscarClientesSupabase,
  salvarClienteSupabase,
  removerClienteSupabase,
  atualizarManutencoesSupabase,
  lerManutencoesLocais,
} from "@/lib/clientes.supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WS Segurança Residencial — Segurança Eletrônica & Alarmes" },
      {
        name: "description",
        content:
          "Especialistas em instalação e manutenção de sistemas de alarme, câmeras CFTV e segurança eletrônica residencial e comercial.",
      },
    ],
  }),
  component: AppPrincipal,
});

const vazio = {
  nome: "",
  endereco: "",
  cpf: "",
  telefone: "",
  macCentral: "",
  modeloCentral: "",
  observacoes: "",
};

function AppPrincipal() {
  const [mounted, setMounted] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [modalLoginAberto, setModalLoginAberto] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErro, setLoginErro] = useState("");

  useEffect(() => {
    setMounted(true);
    const salvo = localStorage.getItem("ws_auth");
    if (salvo === "true") {
      setAutenticado(true);
    }
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loginUser.trim() === "williammax" && loginPass === "williammax2811") {
      setAutenticado(true);
      localStorage.setItem("ws_auth", "true");
      setModalLoginAberto(false);
      setLoginUser("");
      setLoginPass("");
      setLoginErro("");
      toast.success("Login realizado com sucesso! Bem-vindo ao Painel.");
    } else {
      setLoginErro("Usuário ou senha incorretos.");
      toast.error("Credenciais inválidas.");
    }
  }

  function handleLogout() {
    setAutenticado(false);
    localStorage.removeItem("ws_auth");
    toast.info("Você saiu do painel.");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {autenticado ? (
        <PainelAdministrativo onLogout={handleLogout} />
      ) : (
        <LandingPage onAbrirLogin={() => setModalLoginAberto(true)} />
      )}

      {/* ── Modal de Login do Técnico / Administrador ── */}
      <Dialog open={modalLoginAberto} onOpenChange={setModalLoginAberto}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-2">
              <Lock className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-white">
              Acesso Restrito — Painel do Técnico
            </DialogTitle>
            <p className="text-center text-xs text-slate-400">
              Digite suas credenciais de administrador para gerenciar clientes e emitir termos.
            </p>
          </DialogHeader>

          <form onSubmit={handleLogin} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="field-label text-xs text-slate-300" htmlFor="user">
                Usuário
              </Label>
              <Input
                id="user"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="Digite seu usuário"
                className="bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="field-label text-xs text-slate-300" htmlFor="pass">
                Senha de Acesso
              </Label>
              <Input
                id="pass"
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                autoComplete="current-password"
              />
            </div>

            {loginErro && (
              <p className="text-xs text-rose-400 font-medium bg-rose-950/40 p-2 rounded border border-rose-900/60 text-center">
                {loginErro}
              </p>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer shadow-md"
              >
                Entrar no Painel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 🌟 1. LANDING PAGE PÚBLICA (MODERNA & PROFISSIONAL)
// ══════════════════════════════════════════════════════════════════════════════

function LandingPage({ onAbrirLogin }: { onAbrirLogin: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Top Bar / Header ── */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3.5">
            <img
              src="/logo.jpg"
              alt="WS Segurança Residencial"
              className="h-11 w-11 rounded-2xl object-cover border border-blue-500/30 shadow-md ring-2 ring-blue-500/20"
            />
            <div>
              <span className="text-base font-extrabold tracking-tight text-white block leading-tight">
                WS SEGURANÇA RESIDENCIAL
              </span>
              <span className="text-[11px] text-blue-400 font-medium tracking-wide">
                Soluções Inteligentes em Alarmes & CFTV
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#servicos" className="hover:text-blue-400 transition-colors">
              Serviços
            </a>
            <a href="#marcas" className="hover:text-blue-400 transition-colors">
              Marcas
            </a>
            <a href="#garantia" className="hover:text-blue-400 transition-colors">
              Garantia & Suporte
            </a>
            <a href="#diferenciais" className="hover:text-blue-400 transition-colors">
              Diferenciais
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/5511999999999?text=Olá!%20Gostaria%20de%20solicitar%20um%20orçamento%20de%20segurança."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-bold transition-all shadow-md shadow-emerald-950/40 hover:scale-102"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Orçamento WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="mx-auto max-w-6xl px-5 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-300">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              <span>Proteção Patrimonial e Residencial de Alto Padrão</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
              A tranquilidade que a sua família merece, com a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                tecnologia mais confiável.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
              Instalação, manutenção preventiva e suporte especializado para centrais de alarme,
              câmeras de monitoramento CFTV e barreiras perimetrais. Atendimento com agilidade,
              equipamentos homologados e garantia por escrito.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <a
                href="https://wa.me/5511999999999?text=Olá!%20Gostaria%20de%20agendar%20uma%20visita%20técnica."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 text-sm font-bold transition-all shadow-lg shadow-blue-950/50 hover:scale-102"
              >
                <span>Solicitar Visita Técnica</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <a
                href="#servicos"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 px-5 py-3 text-sm font-semibold transition-colors"
              >
                <span>Conhecer Nossas Soluções</span>
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-800/80 max-w-lg">
              <div>
                <p className="text-xl font-extrabold text-white">+500</p>
                <p className="text-[11px] text-slate-400 font-medium">Instalações Realizadas</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-blue-400">100%</p>
                <p className="text-[11px] text-slate-400 font-medium">Garantia Documentada</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-emerald-400">24/7</p>
                <p className="text-[11px] text-slate-400 font-medium">Suporte Técnico</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marcas Parceiras / Homologadas ── */}
      <section id="marcas" className="py-14 bg-slate-900/60 border-b border-slate-800/80">
        <div className="mx-auto max-w-6xl px-5 text-center space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
            Equipamentos Homologados & Linhas Oficiais
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Trabalhamos com as marcas líderes do mercado
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Utilizamos exclusivamente componentes originais com garantia de fábrica, alta
            durabilidade e compatibilidade com aplicativos no celular.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto pt-4">
            {/* Card Intelbras */}
            <div className="group rounded-2xl border border-slate-800 bg-slate-900/90 p-6 flex flex-col items-center justify-center transition-all hover:border-emerald-500/50 hover:bg-slate-900 shadow-md">
              <div className="h-16 flex items-center justify-center mb-4">
                <img
                  src="/intelbras.png"
                  alt="Intelbras"
                  className="max-h-12 w-auto object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <h3 className="text-sm font-bold text-white">Centrais de Alarme & CFTV Intelbras</h3>
              <p className="mt-1 text-xs text-slate-400 text-center leading-relaxed">
                Linhas AMT 8000, AMT 4010, câmeras IP, DVRs e sensores inteligentes com controle por
                app.
              </p>
            </div>

            {/* Card JFL */}
            <div className="group rounded-2xl border border-slate-800 bg-slate-900/90 p-6 flex flex-col items-center justify-center transition-all hover:border-amber-500/50 hover:bg-slate-900 shadow-md">
              <div className="h-16 flex items-center justify-center mb-4">
                <img
                  src="/jfl.png"
                  alt="JFL Alarmes"
                  className="max-h-14 w-auto object-contain rounded-lg transition-transform group-hover:scale-105"
                />
              </div>
              <h3 className="text-sm font-bold text-white">Sistemas de Alarme JFL</h3>
              <p className="mt-1 text-xs text-slate-400 text-center leading-relaxed">
                Centrais Active 20, SmartCloud 18, eletrificadores perimetrais e sensores de alta
                precisão.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Serviços & Produtos ── */}
      <section id="servicos" className="py-20 border-b border-slate-800/80">
        <div className="mx-auto max-w-6xl px-5 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 border border-blue-800/60 px-3 py-1 rounded-full">
              O que oferecemos
            </span>
            <h2 className="text-3xl font-black text-white">Serviços e Produtos Especializados</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Soluções completas desde o projeto inicial até a manutenção periódica com emissão de
              ficha de garantia.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-3 hover:border-slate-700 transition-all">
              <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Bell className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Instalação de Centrais de Alarme</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Centrais com e sem fio, comunicação por nuvem, IP, Wi-Fi e chip 4G. Ativação e
                desarme direto pelo smartphone.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-3 hover:border-slate-700 transition-all">
              <div className="h-10 w-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Camera className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Câmeras de Segurança (CFTV)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Câmeras de alta definição com visão noturna infravermelha, gravação inteligente e
                visualização remota em tempo real.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-3 hover:border-slate-700 transition-all">
              <div className="h-10 w-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Wrench className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Manutenção Preventiva & Corretiva</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Troca de baterias estacionárias e pilhas de sensores, alinhamento de zonas, ajuste de
                sirenes e diagnósticos completos.
              </p>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-3 hover:border-slate-700 transition-all">
              <div className="h-10 w-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Proteção Perimetral & Sensores</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sensores de barreira infravermelha ativa (feixes), sensores de abertura magnética e
                sensores de presença pet inteligentes.
              </p>
            </div>

            {/* Card 5 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-3 hover:border-slate-700 transition-all">
              <div className="h-10 w-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Termo de Garantia por Escrito</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Garantia legal de 90 dias (CDC) + planos de garantia estendida com reposição de
                peças e cobertura contra surtos elétricos.
              </p>
            </div>

            {/* Card 6 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-3 hover:border-slate-700 transition-all">
              <div className="h-10 w-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Residências, Comércios & Galpões</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Projetos sob medida para residências familiares, empresas, lojas e condomínios com
                visitas técnicas sem compromisso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Diferenciais ── */}
      <section id="diferenciais" className="py-20 bg-slate-900/40 border-b border-slate-800/80">
        <div className="mx-auto max-w-6xl px-5 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full">
              Por que escolher a WS
            </span>
            <h2 className="text-3xl font-black text-white leading-tight">
              Compromisso com qualidade técnica e transparência
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Não vendemos apenas equipamentos — entregamos segurança funcional e documentada para
              sua total tranquilidade.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Protocolo e Ficha de Cadastro</h4>
                  <p className="text-[11px] text-slate-400">
                    Cada cliente recebe protocolo de atendimento e documento oficial com o histórico de
                    manutenções.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Cobrança Clara e Facilitada</h4>
                  <p className="text-[11px] text-slate-400">
                    Aceitamos PIX, cartões de crédito e débito com condições facilitadas para serviços e
                    peças.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Garantia Técnica Personalizada</h4>
                  <p className="text-[11px] text-slate-400">
                    Opções com cobertura estendida para troca de baterias, defeitos de fabricação e
                    fenômenos atmosféricos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="WS Segurança"
                className="h-12 w-12 rounded-xl object-cover border border-blue-500/30"
              />
              <div>
                <h3 className="text-base font-extrabold text-white">WS SEGURANÇA RESIDENCIAL</h3>
                <p className="text-xs text-blue-400 font-medium">Atendimento Especializado</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Precisa de uma avaliação no seu imóvel ou quer modernizar o seu sistema atual de
              alarme? Converse diretamente com o nosso responsável técnico.
            </p>

            <a
              href="https://wa.me/5511999999999?text=Olá!%20Gostaria%20de%20um%20orçamento%20para%20minha%20casa."
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 text-xs font-bold transition-all shadow-md"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Falar pelo WhatsApp Agora</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 bg-slate-950 border-t border-slate-800/80">
        <div className="mx-auto max-w-6xl px-5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-center md:text-left">
            <img
              src="/logo.jpg"
              alt="WS Segurança"
              className="h-9 w-9 rounded-xl object-cover border border-slate-700"
            />
            <div>
              <p className="text-xs font-bold text-white">WS SEGURANÇA RESIDENCIAL</p>
              <p className="text-[11px] text-slate-500">
                © {new Date().getFullYear()} Todos os direitos reservados.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* Botão de Acesso ao Painel */}
            <button
              onClick={onAbrirLogin}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5 text-blue-400" />
              <span>Acesso ao Painel do Técnico</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ⚙️ 2. PAINEL ADMINISTRATIVO (PROTEGIDO POR LOGIN)
// ══════════════════════════════════════════════════════════════════════════════

function PainelAdministrativo({ onLogout }: { onLogout: () => void }) {
  const [form, setForm] = useState(vazio);
  const [busca, setBusca] = useState("");
  const [clienteManutencao, setClienteManutencao] = useState<Cliente | null>(null);
  const [descricaoManutencao, setDescricaoManutencao] = useState("");
  const [historicoExpandido, setHistoricoExpandido] = useState<string | null>(null);

  // Estados Financeiros & Termo de Garantia
  const [valorServico, setValorServico] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [validadeGarantia, setValidadeGarantia] = useState(
    "90 dias (CDC) + 3 meses estendida (Total: 6 meses)"
  );
  const [tipoCobrancaGarantia, setTipoCobrancaGarantia] = useState<TipoCobrancaGarantia>("mensal");
  const [coberturasGarantia, setCoberturasGarantia] = useState<string[]>([
    OPCOES_GARANTIA_PADRAO[0],
    OPCOES_GARANTIA_PADRAO[1],
    OPCOES_GARANTIA_PADRAO[2],
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  // Cálculos da Garantia Estendida
  const precoItem = calcularPrecoItemGarantia(validadeGarantia);
  const mesesEstendidos = obterMesesEstendidos(validadeGarantia);
  const qtdItens = coberturasGarantia.length;
  const valorMensalGarantia = qtdItens * precoItem;
  const valorTotalGarantia = valorMensalGarantia * mesesEstendidos;

  // ── Busca clientes direto do Supabase ──
  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const lista = await buscarClientesSupabase();
      if (!lista) return [];
      return lista.map((c) => ({
        ...c,
        manutencoes: lerManutencoesLocais(c.id),
      }));
    },
    enabled: typeof window !== "undefined",
    staleTime: 30_000,
    retry: 1,
  });

  // ── Cadastrar cliente ──
  const criar = useMutation({
    mutationFn: (dados: typeof vazio) => salvarClienteSupabase(dados),
    onSuccess: (novoCliente) => {
      qc.setQueryData(["clientes"], (antigos: Cliente[] = []) => [novoCliente, ...antigos]);
      setForm(vazio);
      setValorServico("");
      setFormaPagamento("PIX");
      setCoberturasGarantia([
        OPCOES_GARANTIA_PADRAO[0],
        OPCOES_GARANTIA_PADRAO[1],
        OPCOES_GARANTIA_PADRAO[2],
      ]);
      setValidadeGarantia("90 dias (CDC) + 3 meses estendida (Total: 6 meses)");
      setTipoCobrancaGarantia("mensal");
      toast.success("Cliente cadastrado com sucesso no painel!");
    },
    onError: (err: Error) => {
      console.error("Erro ao salvar:", err);
      toast.error(`Erro ao salvar: ${err.message}`);
    },
  });

  // ── Salvar manutenção ──
  const salvarManutencaoMut = useMutation({
    mutationFn: async ({ cliente, desc }: { cliente: Cliente; desc: string }) => {
      const nova: Manutencao = {
        id: gerarId(),
        dataHora: new Date().toISOString(),
        descricao: desc.trim() || "Manutenção periódica de rotina",
      };
      const atualizadas = [nova, ...(cliente.manutencoes || [])];
      await atualizarManutencoesSupabase(cliente.id, atualizadas);
      return { clienteId: cliente.id, atualizadas, dataHora: nova.dataHora };
    },
    onSuccess: ({ clienteId, atualizadas, dataHora }) => {
      qc.setQueryData(["clientes"], (antigos: Cliente[] = []) =>
        antigos.map((c) => (c.id === clienteId ? { ...c, manutencoes: atualizadas } : c))
      );
      setClienteManutencao(null);
      setDescricaoManutencao("");
      toast.success(`Manutenção salva! ${formatarData(dataHora)}`);
    },
    onError: () => toast.error("Falha ao salvar manutenção."),
  });

  // ── Excluir cliente ──
  const excluir = useMutation({
    mutationFn: (id: string) => removerClienteSupabase(id),
    onSuccess: (_, id) => {
      qc.setQueryData(["clientes"], (antigos: Cliente[] = []) =>
        antigos.filter((c) => c.id !== id)
      );
      toast.success("Cadastro removido.");
    },
    onError: () => toast.error("Erro ao remover cadastro."),
  });

  // ── Exportar JSON ──
  function exportarJson() {
    const blob = new Blob([JSON.stringify(clientes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes_alarme_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exportado!");
  }

  // ── Importar JSON ──
  function importarJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (!Array.isArray(parsed)) {
          toast.error("Arquivo JSON inválido.");
          return;
        }
        for (const item of parsed) {
          if (item.nome && item.cpf) {
            await salvarClienteSupabase({
              nome: item.nome,
              endereco: item.endereco || "",
              cpf: item.cpf,
              telefone: item.telefone || "",
              macCentral: item.macCentral || item.mac_central || "",
              modeloCentral: item.modeloCentral || item.modelo_central || "",
              observacoes: item.observacoes || "",
            });
          }
        }
        qc.invalidateQueries({ queryKey: ["clientes"] });
        toast.success(`${parsed.length} cadastro(s) importado(s)!`);
      } catch {
        toast.error("Falha ao ler o arquivo JSON.");
      }
    };
    reader.readAsText(file);
  }

  // ── Validar e enviar formulário ──
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const erro =
      form.nome.trim().length < 3
        ? "Informe o nome completo."
        : !cpfValido(form.cpf)
          ? "CPF inválido."
          : form.endereco.trim().length < 5
            ? "Informe o endereço completo."
            : apenasDigitos(form.telefone).length < 10
              ? "Telefone incompleto."
              : form.macCentral.replace(/[^0-9A-F]/gi, "").length !== 12
                ? "MAC deve ter 12 caracteres hex."
                : !form.modeloCentral
                  ? "Selecione o modelo da central."
                  : null;
    if (erro) {
      toast.error(erro);
      return;
    }

    // Embutir dados financeiros e de garantia no formato seguro
    const obsFinal = embutirGarantia(form.observacoes, {
      validade: validadeGarantia,
      coberturas: coberturasGarantia,
      valorServico: valorServico.trim(),
      formaPagamento: formaPagamento,
      tipoCobrancaGarantia: tipoCobrancaGarantia,
      valorItemGarantia: precoItem,
      valorMensalGarantia: valorMensalGarantia,
      valorTotalGarantia: valorTotalGarantia,
    });

    criar.mutate({ ...form, observacoes: obsFinal });
  }

  const filtrados = clientes.filter((c) => {
    const t = busca.trim().toLowerCase();
    if (!t) return true;
    return (
      c.nome.toLowerCase().includes(t) ||
      c.cpf.includes(t) ||
      c.macCentral.toLowerCase().includes(t) ||
      c.modeloCentral.toLowerCase().includes(t)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Header do Painel ── */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
          <img
            src="/logo.jpg"
            alt="WS Segurança Residencial"
            className="h-11 w-11 rounded-2xl object-cover border border-blue-400/30 shadow-md ring-2 ring-blue-500/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white">PAINEL DO TÉCNICO</h1>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Autenticado
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              WS Segurança Residencial — Gerenciamento & Termos
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={importarJson}
              accept=".json"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            >
              <Upload className="h-3.5 w-3.5 mr-1 text-slate-400" /> Importar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportarJson}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            >
              <Download className="h-3.5 w-3.5 mr-1 text-slate-400" /> Exportar
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 ml-2 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,450px)_1fr]">
        {/* ── Formulário de Cadastro ── */}
        <section className="card-elevated h-fit p-6 bg-slate-900 border-slate-800 text-slate-100 rounded-xl border">
          <h2 className="text-base font-bold text-white">Novo cadastro de cliente</h2>
          <p className="mt-1 text-xs text-slate-400">
            Preencha os dados cadastrais, valores, forma de pagamento e termo de garantia.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="field-label text-xs text-slate-300" htmlFor="nome">
                Nome completo do cliente
              </Label>
              <Input
                id="nome"
                value={form.nome}
                maxLength={120}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex.: Marcos Ribeiro de Souza"
                className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="field-label text-xs text-slate-300" htmlFor="cpf">
                  CPF
                </Label>
                <Input
                  id="cpf"
                  inputMode="numeric"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: formatarCpf(e.target.value) })}
                  placeholder="000.000.000-00"
                  className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="field-label text-xs text-slate-300" htmlFor="telefone">
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  inputMode="tel"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: formatarTelefone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="field-label text-xs text-slate-300" htmlFor="endereco">
                Endereço da instalação
              </Label>
              <Input
                id="endereco"
                value={form.endereco}
                maxLength={200}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                placeholder="Rua, número, bairro, cidade/UF"
                className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="field-label text-xs text-slate-300" htmlFor="mac">
                  MAC da central
                </Label>
                <Input
                  id="mac"
                  value={form.macCentral}
                  onChange={(e) => setForm({ ...form, macCentral: formatarMac(e.target.value) })}
                  placeholder="00:1A:2B:3C:4D:5E"
                  className="font-mono bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="field-label text-xs text-slate-300" htmlFor="modeloCentral">
                  Modelo da central
                </Label>
                <select
                  id="modeloCentral"
                  value={form.modeloCentral}
                  onChange={(e) => setForm({ ...form, modeloCentral: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer text-white"
                >
                  <option value="" disabled>
                    Selecione o modelo
                  </option>
                  {MODELOS_CENTRAL.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Seção de Valores e Pagamento ── */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <DollarSign className="h-4 w-4" />
                <span>Valores do Serviço & Forma de Pagamento</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="field-label text-xs text-slate-300" htmlFor="valorServico">
                    Valor do Serviço (R$)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-semibold">
                      R$
                    </span>
                    <Input
                      id="valorServico"
                      value={valorServico}
                      onChange={(e) => setValorServico(e.target.value)}
                      placeholder="150,00"
                      className="pl-8 text-sm font-semibold bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="field-label text-xs text-slate-300" htmlFor="formaPagamento">
                    Forma de Pagamento
                  </Label>
                  <select
                    id="formaPagamento"
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer text-white font-medium"
                  >
                    {FORMAS_PAGAMENTO.map((fp) => (
                      <option key={fp} value={fp}>
                        {fp}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Seção de Seleção do Termo de Garantia e Precificação ── */}
            <div className="rounded-xl border border-blue-900/60 bg-blue-950/20 p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                  <span>Termo de Garantia da Manutenção</span>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    coberturasGarantia.length === 0
                      ? "text-amber-300 bg-amber-900/60"
                      : "text-emerald-300 bg-emerald-900/60"
                  }`}
                >
                  {coberturasGarantia.length === 0 ? "Padrão CDC 90 dias" : "Personalizada"}
                </span>
              </div>

              {coberturasGarantia.length === 0 ? (
                <div className="rounded-md bg-amber-950/40 p-2.5 border border-amber-800/80 text-[11px] text-amber-200 leading-tight">
                  ⚖️ <strong>Garantia Legal de 90 dias (CDC)</strong>: Ativa automaticamente. Cobrindo
                  todos os serviços executados conforme a lei do consumidor.
                </div>
              ) : (
                <div className="rounded-md bg-emerald-950/40 p-2.5 border border-emerald-800/80 text-[11px] text-emerald-200 leading-tight">
                  🛡️ <strong>90 Dias Legais (CDC) + Garantia Estendida</strong>: O prazo adicional
                  selecionado abaixo se <u>soma aos 90 dias obrigatórios da lei</u> com{" "}
                  {coberturasGarantia.length} cobertura(s) incluída(s).
                </div>
              )}

              {/* Botões de Seleção Rápida */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCoberturasGarantia([]);
                    setValidadeGarantia("90 dias (Apenas Garantia Legal CDC)");
                  }}
                  className={`text-[11px] h-7 flex-1 font-medium bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 ${
                    coberturasGarantia.length === 0
                      ? "border-amber-500 bg-amber-950/40 text-amber-200 font-bold"
                      : ""
                  }`}
                >
                  ⚖️ Apenas 90 Dias (CDC)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCoberturasGarantia([...OPCOES_GARANTIA_PADRAO]);
                    setValidadeGarantia("90 dias (CDC) + 3 meses estendida (Total: 6 meses)");
                  }}
                  className={`text-[11px] h-7 flex-1 font-medium bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 ${
                    coberturasGarantia.length === OPCOES_GARANTIA_PADRAO.length
                      ? "border-blue-500 bg-blue-950/40 text-blue-200 font-bold"
                      : ""
                  }`}
                >
                  ➕ Marcar Todas
                </Button>
              </div>

              {/* Seletor de Período */}
              <div className="space-y-1">
                <Label className="field-label text-xs text-slate-300">
                  Período da Garantia Estendida
                </Label>
                <select
                  value={validadeGarantia}
                  onChange={(e) => setValidadeGarantia(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer text-white font-medium"
                >
                  {PERIODOS_VALIDADE_GARANTIA.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tabela de Preço por Item */}
              <div className="rounded-md bg-blue-900/30 p-2.5 border border-blue-800 text-xs space-y-1">
                <div className="flex justify-between items-center font-semibold text-blue-200">
                  <span>Valor por item adicional:</span>
                  <span className="text-emerald-400 font-bold">
                    R$ {precoItem.toFixed(2).replace(".", ",")} / item / mês
                  </span>
                </div>
                <p className="text-[11px] text-blue-300">
                  {precoItem === 12.6
                    ? "📌 Plano de 3 meses estendida: R$ 12,60/mês por item."
                    : "🎉 Plano acima de 6 meses (desconto): R$ 9,99/mês por item!"}
                </p>
              </div>

              {/* Checkboxes de Coberturas */}
              <div className="space-y-2">
                <p className="field-label text-xs font-semibold text-slate-300">
                  Selecione o que o cliente aceitou/contratou:
                </p>
                <div className="space-y-1.5">
                  {OPCOES_GARANTIA_PADRAO.map((op) => {
                    const checked = coberturasGarantia.includes(op);
                    return (
                      <label
                        key={op}
                        className={`flex items-start gap-2 rounded-md p-2 text-xs border transition-colors cursor-pointer select-none ${
                          checked
                            ? "bg-slate-800 border-blue-500/50 text-white font-medium"
                            : "bg-transparent border-dashed border-slate-800 text-slate-500 opacity-70"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCoberturasGarantia([...coberturasGarantia, op]);
                            } else {
                              setCoberturasGarantia(coberturasGarantia.filter((c) => c !== op));
                            }
                          }}
                          className="mt-0.5 rounded border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="leading-tight">{op}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Seletor de Pagamento da Garantia (Mensal vs Total) */}
              {coberturasGarantia.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-slate-800">
                  <Label className="field-label text-xs font-semibold text-slate-300">
                    Como o cliente vai pagar a garantia estendida?
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoCobrancaGarantia("mensal")}
                      className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                        tipoCobrancaGarantia === "mensal"
                          ? "border-emerald-500 bg-emerald-950/50 text-emerald-200 font-bold"
                          : "border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      <p className="flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Por Mês</span>
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-emerald-300">
                        R$ {valorMensalGarantia.toFixed(2).replace(".", ",")}
                        <span className="text-[10px] font-normal text-slate-400">/mês</span>
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoCobrancaGarantia("total")}
                      className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                        tipoCobrancaGarantia === "total"
                          ? "border-blue-500 bg-blue-950/50 text-blue-200 font-bold"
                          : "border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      <p className="flex items-center gap-1">
                        <Calculator className="h-3.5 w-3.5 text-blue-400" />
                        <span>Valor Total Já</span>
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-blue-300">
                        R$ {valorTotalGarantia.toFixed(2).replace(".", ",")}
                        <span className="text-[10px] font-normal text-slate-400">
                          {" "}
                          ({mesesEstendidos}x)
                        </span>
                      </p>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="field-label text-xs text-slate-300" htmlFor="obs">
                Observações adicionais (opcional)
              </Label>
              <Textarea
                id="obs"
                rows={2}
                maxLength={500}
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Zonas, sensores instalados, senha de coação, etc."
                className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 text-xs"
              />
            </div>

            <Button
              type="submit"
              className="w-full font-bold bg-blue-600 hover:bg-blue-500 text-white py-2.5 cursor-pointer shadow-md"
              disabled={criar.isPending}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {criar.isPending ? "Salvando..." : "Cadastrar Cliente & Emitir Termo"}
            </Button>
          </form>
        </section>

        {/* ── Lista de Clientes Cadastrados ── */}
        <section className="card-elevated p-6 bg-slate-900 border-slate-800 text-slate-100 rounded-xl border">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-bold text-white">Clientes cadastrados</h2>
            <div className="relative ml-auto w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, CPF ou MAC"
                className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-xs"
              />
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {isLoading && (
              <p className="text-sm text-slate-400">Carregando dados do Supabase...</p>
            )}
            {!isLoading && filtrados.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-800 p-10 text-center">
                <p className="text-sm text-slate-400">
                  Nenhum cadastro encontrado. Registre o primeiro cliente ao lado.
                </p>
              </div>
            )}

            {filtrados.map((c) => {
              const manuts = c.manutencoes || [];
              const ultima = manuts[0] ?? null;
              const { obsLimpa, garantia } = extrairGarantia(c.observacoes);

              return (
                <article
                  key={c.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 transition-all hover:border-slate-700 space-y-2.5"
                >
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="min-w-[180px] flex-1">
                      <h3 className="text-sm font-semibold text-white">{c.nome}</h3>
                      <p className="text-xs text-slate-400">
                        <span>{c.cpf}</span> · <span>{c.telefone}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{c.endereco}</p>
                    </div>

                    <div className="min-w-[140px]">
                      <p className="field-label text-slate-500 text-[11px]">Central</p>
                      <p className="text-sm font-medium text-slate-200">{c.modeloCentral}</p>
                      <p className="font-mono text-xs text-slate-400">{c.macCentral}</p>
                    </div>

                    <div className="min-w-[110px]">
                      <p className="field-label text-slate-500 text-[11px]">Cadastro</p>
                      <p className="text-xs text-slate-400">{formatarData(c.criadoEm)}</p>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setClienteManutencao(c);
                          setDescricaoManutencao("");
                        }}
                        className="text-xs border-amber-700/50 text-amber-300 bg-amber-950/30 hover:bg-amber-900/50 font-semibold cursor-pointer"
                      >
                        <Wrench className="h-3.5 w-3.5 mr-1 text-amber-400" /> Manutenção
                      </Button>

                      <Button asChild variant="secondary" size="sm" className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white">
                        <Link to="/cliente/$id" params={{ id: c.id }}>
                          <FileText className="h-4 w-4 mr-1 text-slate-300" /> Documento & Garantia
                        </Link>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Excluir ${c.nome}`}
                        onClick={() => excluir.mutate(c.id)}
                        className="cursor-pointer hover:bg-rose-950/40"
                      >
                        <Trash2 className="h-4 w-4 text-rose-400 hover:text-rose-300" />
                      </Button>
                    </div>
                  </div>

                  {/* Informações Financeiras e Badge de Garantia */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                    {garantia.valorServico && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-md">
                        <DollarSign className="h-3 w-3 text-emerald-400" />
                        <span>Serviço: R$ {garantia.valorServico}</span>
                        {garantia.formaPagamento && (
                          <span className="text-emerald-400 font-normal">
                            ({garantia.formaPagamento})
                          </span>
                        )}
                      </span>
                    )}

                    {garantia.coberturas.length === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-950/50 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-md">
                        <ShieldCheck className="h-3 w-3 text-amber-400" />
                        <span>Garantia Legal: 90 dias (Padrão CDC)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-950/50 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-md">
                        <ShieldCheck className="h-3 w-3 text-blue-400" />
                        <span>
                          Garantia Estendida:{" "}
                          {garantia.tipoCobrancaGarantia === "total" && garantia.valorTotalGarantia
                            ? `R$ ${garantia.valorTotalGarantia.toFixed(2).replace(".", ",")} Total`
                            : garantia.valorMensalGarantia
                              ? `R$ ${garantia.valorMensalGarantia.toFixed(2).replace(".", ",")}/mês`
                              : ""}
                        </span>
                        <span className="text-blue-400 font-normal">
                          ({garantia.coberturas.length} coberturas)
                        </span>
                      </span>
                    )}

                    {obsLimpa && (
                      <span className="text-[11px] text-slate-400 truncate max-w-xs ml-auto">
                        Obs: {obsLimpa}
                      </span>
                    )}
                  </div>

                  {/* Histórico de Manutenções */}
                  {manuts.length > 0 ? (
                    <div className="mt-2 border-t border-slate-800/80 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                          <Clock className="h-3.5 w-3.5 text-amber-400" />
                          <span>
                            <span>Última manutenção: </span>
                            <strong>{formatarData(ultima?.dataHora || "")}</strong>
                          </span>
                          {ultima?.descricao && (
                            <span className="text-slate-400 font-normal ml-1">
                              ({ultima.descricao})
                            </span>
                          )}
                        </div>
                        {manuts.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setHistoricoExpandido(
                                historicoExpandido === c.id ? null : c.id
                              )
                            }
                            className="text-xs text-slate-400 hover:text-white underline font-medium cursor-pointer"
                          >
                            {historicoExpandido === c.id
                              ? "Ocultar histórico"
                              : `Ver histórico (${manuts.length})`}
                          </button>
                        )}
                      </div>
                      {historicoExpandido === c.id && (
                        <div className="mt-2 space-y-1.5 rounded-md bg-slate-900 p-2.5 border border-slate-800 text-xs">
                          <p className="font-semibold text-slate-200 mb-1 flex items-center gap-1">
                            <History className="h-3.5 w-3.5" /> Histórico completo:
                          </p>
                          {manuts.map((m) => (
                            <div
                              key={m.id}
                              className="flex justify-between border-b border-slate-800 pb-1 last:border-0 last:pb-0"
                            >
                              <span className="font-mono text-slate-200 font-medium">
                                📅 {formatarData(m.dataHora)}
                              </span>
                              <span className="text-slate-400">{m.descricao}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1 border-t border-slate-800/60 pt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3 opacity-60" /> Nenhuma manutenção registrada ainda.
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {/* ── Modal Salvar Manutenção ── */}
      <Dialog
        open={!!clienteManutencao}
        onOpenChange={(open) => {
          if (!open) setClienteManutencao(null);
        }}
      >
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <Wrench className="h-5 w-5 text-amber-400" /> Salvar Nova Manutenção
            </DialogTitle>
          </DialogHeader>
          {clienteManutencao && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-amber-950/30 border border-amber-800/40 p-3 text-xs">
                <p className="font-semibold text-white text-sm">{clienteManutencao.nome}</p>
                <p className="text-slate-400 mt-0.5">
                  Central: {clienteManutencao.modeloCentral} ({clienteManutencao.macCentral})
                </p>
              </div>
              <div className="space-y-1">
                <Label className="field-label text-xs text-slate-300 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Data e Hora do Registro:
                </Label>
                <div className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-mono font-medium text-slate-200">
                  {formatarData(new Date().toISOString())}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="descManut" className="field-label text-xs text-slate-300">
                  Descrição dos serviços executados:
                </Label>
                <Textarea
                  id="descManut"
                  rows={3}
                  value={descricaoManutencao}
                  onChange={(e) => setDescricaoManutencao(e.target.value)}
                  placeholder="Ex.: Troca de bateria da central, testes de sirene e ajuste dos sensores das zonas..."
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-xs"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setClienteManutencao(null)}
              className="cursor-pointer bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-amber-600 hover:bg-amber-500 text-white font-medium cursor-pointer"
              disabled={salvarManutencaoMut.isPending}
              onClick={() => {
                if (clienteManutencao)
                  salvarManutencaoMut.mutate({
                    cliente: clienteManutencao,
                    desc: descricaoManutencao,
                  });
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              {salvarManutencaoMut.isPending ? "Salvando..." : "Confirmar e Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
