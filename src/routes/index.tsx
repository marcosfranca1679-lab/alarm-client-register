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
  Package,
  Sparkles,
  ShoppingBag,
  Tag,
  Edit3,
  SlidersHorizontal,
  RotateCcw,
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
  CATEGORIAS_PRODUTO,
  MARCAS_PRODUTO,
  PRODUTOS_PADRAO,
  lerProdutosLocais,
  salvarProdutosLocais,
  obterLogoMarca,
  calcularPrecoItemGarantia,
  obterMesesEstendidos,
  extrairGarantia,
  embutirGarantia,
  apenasDigitos,
  cpfValido,
  formatarCpf,
  formatarData,
  formatarMac,
  formatarTelefone,
  gerarId,
  type Cliente,
  type Manutencao,
  type Produto,
  type TipoCobrancaGarantia,
} from "@/lib/clientes.types";
import {
  buscarClientesSupabase,
  salvarClienteSupabase,
  removerClienteSupabase,
  atualizarManutencoesSupabase,
  lerManutencoesLocais,
  buscarProdutosSupabase,
  salvarProdutosSupabase,
} from "@/lib/clientes.supabase";

const WHATSAPP_NUMERO = "5548999118524";
const WHATSAPP_FORMATADO = "(48) 99911-8524";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WS Segurança Residencial — Alarmes, Câmeras & CFTV" },
      {
        name: "description",
        content:
          "Soluções completas em segurança eletrônica, centrais de alarme Intelbras e JFL, CFTV, garantia técnica e manutenção.",
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
  const [produtos, setProdutos] = useState<Produto[]>(PRODUTOS_PADRAO);

  useEffect(() => {
    setMounted(true);
    const salvo = localStorage.getItem("ws_auth");
    if (salvo === "true") {
      setAutenticado(true);
    }

    // Carrega do localStorage primeiro (instantâneo)
    const locais = lerProdutosLocais();
    setProdutos(locais);

    // E sincroniza com a nuvem do Supabase
    buscarProdutosSupabase().then((prodsSupa) => {
      if (prodsSupa !== null) {
        setProdutos(prodsSupa);
        salvarProdutosLocais(prodsSupa);
      } else if (locais.length > 0) {
        salvarProdutosSupabase(locais);
      }
    });
  }, []);

  function handleSalvarProdutos(novos: Produto[]) {
    setProdutos(novos);
    salvarProdutosLocais(novos);
    salvarProdutosSupabase(novos).catch((err) => console.warn(err));
  }


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
        <PainelAdministrativo
          onLogout={handleLogout}
          produtos={produtos}
          onAtualizarProdutos={handleSalvarProdutos}
        />
      ) : (
        <LandingPage
          produtos={produtos}
          onAbrirLogin={() => setModalLoginAberto(true)}
        />
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
              Digite suas credenciais de administrador para gerenciar clientes, termos e produtos.
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
// 🌟 1. LANDING PAGE PÚBLICA (MODERNA, CATÁLOGO DE PRODUTOS & WHATSAPP)
// ══════════════════════════════════════════════════════════════════════════════

function LandingPage({
  produtos,
  onAbrirLogin,
}: {
  produtos: Produto[];
  onAbrirLogin: () => void;
}) {
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("Todas");
  const [produtoDetalhe, setProdutoDetalhe] = useState<Produto | null>(null);

  const categorias = ["Todas", ...CATEGORIAS_PRODUTO];
  const produtosFiltrados =
    categoriaAtiva === "Todas"
      ? produtos
      : produtos.filter((p) => p.categoria === categoriaAtiva);


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Top Bar / Header ── */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
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

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#produtos" className="hover:text-blue-400 transition-colors flex items-center gap-1">
              <Package className="h-3.5 w-3.5 text-blue-400" /> Produtos & Banners
            </a>
            <a href="#servicos" className="hover:text-blue-400 transition-colors">
              Serviços
            </a>
            <a href="#marcas" className="hover:text-blue-400 transition-colors">
              Marcas
            </a>
            <a href="#garantia" className="hover:text-blue-400 transition-colors">
              Garantia
            </a>
            <a href="#contato" className="hover:text-blue-400 transition-colors">
              Contato
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${WHATSAPP_NUMERO}?text=Olá!%20Gostaria%20de%20solicitar%20um%20orçamento%20com%20a%20WS%20Segurança.`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-bold transition-all shadow-md shadow-emerald-950/40 hover:scale-102 cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp: {WHATSAPP_FORMATADO}</span>
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
                href={`https://wa.me/${WHATSAPP_NUMERO}?text=Olá!%20Gostaria%20de%20agendar%20uma%20visita%20técnica.`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 text-sm font-bold transition-all shadow-lg shadow-blue-950/50 hover:scale-102 cursor-pointer"
              >
                <span>Solicitar Visita Técnica</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <a
                href="#produtos"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 px-5 py-3 text-sm font-semibold transition-colors cursor-pointer"
              >
                <Package className="h-4 w-4 text-blue-400" />
                <span>Ver Produtos & Banners</span>
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-800/80 max-w-lg">
              <div>
                <p className="text-xl font-extrabold text-white">+500</p>
                <p className="text-[11px] text-slate-400 font-medium">Instalações Realizadas</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-blue-400">100%</p>
                <p className="text-[11px] text-slate-400 font-medium">Garantia Registrada</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-emerald-400">24/7</p>
                <p className="text-[11px] text-slate-400 font-medium">Suporte Técnico</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Vitrine / Catálogo de Produtos e Banners ── */}
      <section id="produtos" className="py-20 bg-slate-950 border-b border-slate-800/80">
        <div className="mx-auto max-w-6xl px-5 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 border border-blue-800/60 px-3 py-1 rounded-full">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                <span>Nossos Produtos & Equipamentos</span>
              </div>
              <h2 className="text-3xl font-black text-white">Catálogo de Equipamentos</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Centrais de alarme, câmeras, sensores e acessórios com os melhores preços e pronta
                instalação.
              </p>
            </div>

            <a
              href={`https://wa.me/${WHATSAPP_NUMERO}?text=Olá!%20Gostaria%20de%20consultar%20um%20produto%20específico.`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 px-4 py-2 rounded-xl transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Pedir orçamento personalizado no WhatsApp</span>
            </a>
          </div>

          {/* Filtros de Categoria */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {categorias.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaAtiva(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  categoriaAtiva === cat
                    ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-950"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid de Produtos */}
          {produtosFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/40">
              <Package className="h-10 w-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">
                Nenhum produto ou banner cadastrado no momento.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Fale conosco diretamente pelo WhatsApp para consultar valores e disponibilidade.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {produtosFiltrados.map((prod) => (
                <div
                  key={prod.id}
                  className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between transition-all hover:border-blue-500/50 hover:bg-slate-900 shadow-md space-y-4"
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => setProdutoDetalhe(prod)}
                  >
                    {/* Imagem / Banner do Produto */}
                    <div className="relative h-44 w-full rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex items-center justify-center overflow-hidden">
                      <img
                        src={prod.imagemUrl || "/intelbras.png"}
                        alt={prod.nome}
                        className="max-h-28 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute top-2.5 left-2.5 text-[10px] font-bold bg-slate-900/90 text-blue-300 border border-slate-700 px-2 py-0.5 rounded-md">
                        {prod.categoria}
                      </span>
                      {prod.destaque && (
                        <span className="absolute top-2.5 right-2.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md">
                          ★ Destaque
                        </span>
                      )}
                      {obterLogoMarca(prod.marca) && (
                        <img
                          src={obterLogoMarca(prod.marca)}
                          alt={prod.marca ?? ""}
                          className="absolute bottom-2 right-2 h-6 w-auto object-contain opacity-90 bg-white/10 rounded px-1"
                        />
                      )}
                    </div>
                    <div className="mt-4 space-y-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors leading-snug">
                        {prod.nome}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {prod.descricao}
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">A partir de</p>
                      <p className="text-sm sm:text-base font-extrabold text-emerald-400">
                        R$ {prod.valor || "Sob consulta"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setProdutoDetalhe(prod)}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer"
                        title="Ver detalhes completos"
                      >
                        <Eye className="h-3.5 w-3.5 text-blue-400" />
                        <span>Ver Mais</span>
                      </button>

                      <a
                        href={`https://wa.me/${WHATSAPP_NUMERO}?text=Olá!%20Gostaria%20de%20comprar%20ou%20saber%20mais%20sobre%20o%20produto:%20${encodeURIComponent(prod.nome)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-102"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Pedir no Zap</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

{/* ── Marcas Parceiras / Homologadas ── */}
<section id="marcas" className="py-16 bg-slate-900/50 border-b border-slate-800/80">
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
            <h2 className="text-3xl font-black text-white">Serviços e Instalações Especializadas</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Soluções completas desde o projeto inicial até a manutenção periódica com emissão de
              ficha de garantia.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-3 hover:border-slate-700 transition-all">
              <div className="h-10 w-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Camera className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Câmeras de Segurança (CFTV)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Câmeras de alta definição com visão noturna infravermelha, gravação contínua e
                visualização remota em tempo real.
              </p>
            </div>

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

      {/* ── Seção de Garantia & Diferenciais ── */}
      <section id="garantia" className="py-20 bg-slate-900/40 border-b border-slate-800/80">
        <div className="mx-auto max-w-6xl px-5 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full">
              Garantia & Confiança
            </span>
            <h2 className="text-3xl font-black text-white leading-tight">
              Garantia Legal de 90 Dias (CDC) + Planos Estendidos
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Todos os nossos serviços contam com garantia legal obrigatória de 90 dias conforme o
              Código de Defesa do Consumidor, com opção de garantia estendida por apenas R$ 12,60 ou
              R$ 9,99/mês por item.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Protocolo e Ficha de Cadastro</h4>
                  <p className="text-[11px] text-slate-400">
                    Cada cliente recebe protocolo de atendimento e documento oficial com histórico.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Cobertura contra Raios e Surtos</h4>
                  <p className="text-[11px] text-slate-400">
                    Opção de garantia técnica com reposição de componentes danificados por descargas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Troca de Baterias Inclusa</h4>
                  <p className="text-[11px] text-slate-400">
                    Planos com manutenção e reposição periódica de pilhas e baterias.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div id="contato" className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="WS Segurança"
                className="h-12 w-12 rounded-xl object-cover border border-blue-500/30"
              />
              <div>
                <h3 className="text-base font-extrabold text-white">WS SEGURANÇA RESIDENCIAL</h3>
                <p className="text-xs text-blue-400 font-medium">WhatsApp: {WHATSAPP_FORMATADO}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Precisa de uma avaliação no seu imóvel, orçamento para alarmes ou manutenção na sua
              central? Clique no botão abaixo e fale direto no WhatsApp.
            </p>

            <a
              href={`https://wa.me/${WHATSAPP_NUMERO}?text=Olá!%20Gostaria%20de%20um%20orçamento%20para%20minha%20casa.`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-102"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chamar no WhatsApp ({WHATSAPP_FORMATADO})</span>
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
                © {new Date().getFullYear()} Todos os direitos reservados. WhatsApp: {WHATSAPP_FORMATADO}
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

      {/* ── Modal Ver Mais Detalhes do Produto ── */}
      <Dialog open={!!produtoDetalhe} onOpenChange={(open) => { if (!open) setProdutoDetalhe(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden flex flex-col">
          {produtoDetalhe && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="relative h-60 w-full bg-slate-950 flex items-center justify-center p-6 border-b border-slate-800 shrink-0">
                <img
                  src={produtoDetalhe.imagemUrl || "/intelbras.png"}
                  alt={produtoDetalhe.nome}
                  className="max-h-48 w-auto object-contain"
                />
                <span className="absolute top-4 left-4 text-xs font-bold bg-slate-900/90 text-blue-300 border border-slate-700 px-3 py-1 rounded-lg">
                  {produtoDetalhe.categoria}
                </span>
                {obterLogoMarca(produtoDetalhe.marca) && (
                  <img
                    src={obterLogoMarca(produtoDetalhe.marca)}
                    alt={produtoDetalhe.marca ?? ""}
                    className="absolute bottom-3 right-3 h-8 w-auto object-contain bg-white/10 rounded-lg p-1"
                  />
                )}
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {produtoDetalhe.marca && (
                      <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                        {produtoDetalhe.marca}
                      </span>
                    )}
                    {produtoDetalhe.destaque && (
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md">
                        ★ Destaque Oficial
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white">{produtoDetalhe.nome}</h3>
                </div>

                <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Descrição & Funções
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {produtoDetalhe.descricao || "Equipamento de alta tecnologia e confiabilidade homologado para segurança residencial e comercial."}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800">
                  <div>
                    <p className="text-xs text-slate-400">Investimento a partir de</p>
                    <p className="text-2xl font-black text-emerald-400">
                      R$ {produtoDetalhe.valor || "Sob consulta"}
                    </p>
                  </div>

                  <a
                    href={`https://wa.me/${WHATSAPP_NUMERO}?text=Olá!%20Gostaria%20de%20solicitar%20um%20orçamento%20para%20o%20produto:%20${encodeURIComponent(produtoDetalhe.nome)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 text-sm font-bold transition-all shadow-lg shadow-emerald-950/50 cursor-pointer hover:scale-102"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Pedir no WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ⚙️ 2. PAINEL ADMINISTRATIVO (CADASTROS + GERENCIADOR DE BANNERS E PRODUTOS)
// ══════════════════════════════════════════════════════════════════════════════

function PainelAdministrativo({
  onLogout,
  produtos,
  onAtualizarProdutos,
}: {
  onLogout: () => void;
  produtos: Produto[];
  onAtualizarProdutos: (novos: Produto[]) => void;
}) {
  const [abaAtiva, setAbaAtiva] = useState<"clientes" | "produtos">("clientes");

  // Estados dos Clientes
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

  // Estados do Gerenciador de Produtos / Banners
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [formProdNome, setFormProdNome] = useState("");
  const [formProdValor, setFormProdValor] = useState("");
  const [formProdCategoria, setFormProdCategoria] = useState(CATEGORIAS_PRODUTO[0]);
  const [formProdDescricao, setFormProdDescricao] = useState("");
  const [formProdImagem, setFormProdImagem] = useState("/intelbras.png");
  const [formProdDestaque, setFormProdDestaque] = useState(true);
  const [formProdMarca, setFormProdMarca] = useState(MARCAS_PRODUTO[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgUploadRef = useRef<HTMLInputElement>(null);
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

  // ── Validar e enviar formulário de cliente ──
  function onSubmitCliente(e: React.FormEvent) {
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

  // ── Gerenciador de Produtos / Banners ──
  function abrirModalCriarProduto() {
    setProdutoEditando(null);
    setFormProdNome("");
    setFormProdValor("");
    setFormProdCategoria(CATEGORIAS_PRODUTO[0]);
    setFormProdMarca(MARCAS_PRODUTO[0]);
    setFormProdDescricao("");
    setFormProdImagem(obterLogoMarca(MARCAS_PRODUTO[0]) || "/intelbras.png");
    setFormProdDestaque(true);
    setModalProdutoAberto(true);
  }

  function abrirModalEditarProduto(p: Produto) {
    setProdutoEditando(p);
    setFormProdNome(p.nome);
    setFormProdValor(p.valor);
    setFormProdCategoria(p.categoria);
    setFormProdMarca(p.marca || MARCAS_PRODUTO[0]);
    setFormProdDescricao(p.descricao);
    setFormProdImagem(p.imagemUrl);
    setFormProdDestaque(p.destaque ?? true);
    setModalProdutoAberto(true);
  }

  function handleMarcaChange(marca: string) {
    setFormProdMarca(marca);
    const logo = obterLogoMarca(marca);
    if (logo) setFormProdImagem(logo);
  }

  function handleImagemUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormProdImagem(ev.target?.result as string);
      toast.success("Imagem carregada com sucesso!");
    };
    reader.readAsDataURL(file);
  }

  function salvarProdutoModal(e: React.FormEvent) {
    e.preventDefault();
    if (!formProdNome.trim()) {
      toast.error("Informe o nome do produto.");
      return;
    }

    const dadosProd = {
      nome: formProdNome.trim(),
      valor: formProdValor.trim(),
      categoria: formProdCategoria,
      marca: formProdMarca,
      descricao: formProdDescricao.trim(),
      imagemUrl: formProdImagem,
      destaque: formProdDestaque,
    };

    if (produtoEditando) {
      const atualizados = produtos.map((p) =>
        p.id === produtoEditando.id ? { ...p, ...dadosProd } : p
      );
      onAtualizarProdutos(atualizados);
      toast.success("Produto atualizado com sucesso!");
    } else {
      onAtualizarProdutos([{ id: gerarId(), ...dadosProd }, ...produtos]);
      toast.success("Novo produto adicionado à vitrine!");
    }
    setModalProdutoAberto(false);
  }

  function removerProduto(id: string) {
    const atualizados = produtos.filter((p) => p.id !== id);
    onAtualizarProdutos(atualizados);
    toast.info("Produto removido.");
  }

  function restaurarCatalogoPadrao() {
    onAtualizarProdutos(PRODUTOS_PADRAO);
    toast.success("Catálogo padrão restaurado!");
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
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 sm:px-5 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logo.jpg"
              alt="WS Segurança"
              className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl object-cover border border-blue-400/30 shadow-sm shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xs sm:text-sm font-black text-white tracking-tight truncate">
                  PAINEL ADMINISTRATIVO
                </h1>
                <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full shrink-0">
                  Online
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate hidden sm:block">
                WS Segurança — Clientes, Garantias & Produtos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs h-8 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hidden md:inline-flex"
            >
              <Upload className="h-3.5 w-3.5 mr-1 text-slate-400" /> Importar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportarJson}
              className="text-xs h-8 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hidden md:inline-flex"
            >
              <Download className="h-3.5 w-3.5 mr-1 text-slate-400" /> Exportar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="text-xs h-8 text-rose-300 bg-rose-950/40 border-rose-900/50 hover:bg-rose-900/60 cursor-pointer font-bold px-2.5"
            >
              <LogOut className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>

        {/* Abas de Navegação Responsivas em Grid 2 Colunas */}
        <div className="mx-auto max-w-6xl px-3 sm:px-5 pb-2">
          <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setAbaAtiva("clientes")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer truncate ${
                abaAtiva === "clientes"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Cadastros ({clientes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setAbaAtiva("produtos")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer truncate ${
                abaAtiva === "produtos"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Package className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Banners ({produtos.length})</span>
            </button>
          </div>
        </div>
      </header>


      {/* ── CONTEÚDO 1: GERENCIADOR DE CLIENTES ── */}
      {abaAtiva === "clientes" && (
        <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,450px)_1fr]">
          {/* Formulário de Cadastro */}
          <section className="card-elevated h-fit p-6 bg-slate-900 border-slate-800 text-slate-100 rounded-xl border">
            <h2 className="text-base font-bold text-white">Novo cadastro de cliente</h2>
            <p className="mt-1 text-xs text-slate-400">
              Preencha os dados cadastrais, valores, forma de pagamento e termo de garantia.
            </p>

            <form onSubmit={onSubmitCliente} className="mt-6 space-y-4">
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

              {/* Seção de Valores e Pagamento */}
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

              {/* Seção do Termo de Garantia */}
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

                <div className="space-y-2">
                  <p className="field-label text-xs font-semibold text-slate-300">
                    Selecione os itens cobertos na garantia:
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

          {/* Lista de Clientes */}
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
      )}

      {/* ── CONTEÚDO 2: GERENCIADOR DE BANNERS & PRODUTOS DA TELA PRINCIPAL ── */}
      {abaAtiva === "produtos" && (
        <main className="mx-auto max-w-6xl px-3 sm:px-5 py-5 sm:py-8 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-md">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                Gerenciador de Banners & Produtos
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Edite valores, troque fotos e adicione novos itens à tela principal.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1 sm:pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={restaurarCatalogoPadrao}
                className="text-xs h-9 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 cursor-pointer flex-1 sm:flex-initial"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restaurar
              </Button>
              <Button
                size="sm"
                onClick={abrirModalCriarProduto}
                className="text-xs h-9 bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer shadow-md flex-1 sm:flex-initial"
              >
                <Plus className="h-4 w-4 mr-1" /> Novo Banner
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {produtos.map((prod) => (
              <div
                key={prod.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 flex flex-col justify-between space-y-3 sm:space-y-4 shadow-sm"
              >
                <div>
                  <div className="relative h-40 w-full rounded-xl bg-slate-950 border border-slate-800 p-3 flex items-center justify-center overflow-hidden">
                    <img
                      src={prod.imagemUrl || "/intelbras.png"}
                      alt={prod.nome}
                      className="max-h-28 max-w-full object-contain rounded"
                    />
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-slate-900/90 text-blue-300 border border-slate-700 px-2 py-0.5 rounded-md">
                      {prod.categoria}
                    </span>
                    {prod.destaque && (
                      <span className="absolute top-2 right-2 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md">
                        ★ Destaque
                      </span>
                    )}
                    {obterLogoMarca(prod.marca) && prod.imagemUrl !== obterLogoMarca(prod.marca) && (
                      <img
                        src={obterLogoMarca(prod.marca)}
                        alt={prod.marca ?? ""}
                        className="absolute bottom-2 right-2 h-5 w-auto object-contain opacity-90 bg-white/10 rounded px-1"
                      />
                    )}
                  </div>

                  <div className="mt-3 space-y-1">
                    <h3 className="text-sm font-bold text-white leading-snug">{prod.nome}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{prod.descricao}</p>
                    <p className="text-sm font-extrabold text-emerald-400 pt-1">
                      R$ {prod.valor || "Sob consulta"}
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {prod.id.slice(0, 8)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirModalEditarProduto(prod)}
                      className="text-xs h-8 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1 text-blue-400" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removerProduto(prod.id)}
                      className="h-8 w-8 text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ── Modal Adicionar / Editar Produto ── */}
      <Dialog open={modalProdutoAberto} onOpenChange={setModalProdutoAberto}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-2 shrink-0 border-b border-slate-800/80">
            <DialogTitle className="text-white font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-400" />
              {produtoEditando ? "Editar Produto / Banner" : "Adicionar Novo Produto / Banner"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={salvarProdutoModal} className="flex flex-col flex-1 overflow-hidden">
            <div className="space-y-4 p-5 overflow-y-auto flex-1 max-h-[calc(85vh-140px)]">
              <div className="space-y-1.5">
                <Label className="field-label text-xs text-slate-300">Nome do Produto</Label>
                <Input
                  value={formProdNome}
                  onChange={(e) => setFormProdNome(e.target.value)}
                  placeholder="Ex.: Câmera Wi-Fi Intelbras Full HD"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="field-label text-xs text-slate-300">Valor (R$)</Label>
                  <Input
                    value={formProdValor}
                    onChange={(e) => setFormProdValor(e.target.value)}
                    placeholder="299,00"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="field-label text-xs text-slate-300">Categoria</Label>
                  <select
                    value={formProdCategoria}
                    onChange={(e) => setFormProdCategoria(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-white"
                  >
                    {CATEGORIAS_PRODUTO.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="field-label text-xs text-slate-300">
                  Marca do Equipamento
                </Label>
                <select
                  value={formProdMarca}
                  onChange={(e) => handleMarcaChange(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-white cursor-pointer"
                >
                  {MARCAS_PRODUTO.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Preview de Imagem */}
              {formProdImagem && (
                <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                  <img
                    src={formProdImagem}
                    alt="Preview"
                    className="h-14 w-14 object-contain rounded-md bg-slate-900"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="text-xs text-slate-400">
                    <p className="font-semibold text-slate-200">Preview da imagem</p>
                    <p className="text-[11px] truncate max-w-[180px]">{formProdMarca}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="field-label text-xs text-slate-300">Imagem do Produto</Label>
                {/* Upload de foto do dispositivo */}
                <input
                  type="file"
                  accept="image/*"
                  ref={imgUploadRef}
                  className="hidden"
                  onChange={handleImagemUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => imgUploadRef.current?.click()}
                  className="w-full text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 cursor-pointer gap-2"
                >
                  <Upload className="h-3.5 w-3.5 text-blue-400" />
                  Carregar Imagem do Dispositivo
                </Button>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Intelbras", src: "/intelbras.png" },
                    { label: "JFL", src: "/jfl.png" },
                    { label: "Logo WS", src: "/logo.jpg" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setFormProdImagem(item.src)}
                      className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                        formProdImagem === item.src
                          ? "border-blue-500 bg-blue-950/40 text-blue-300"
                          : "border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      <img src={item.src} alt={item.label} className="h-6 w-auto object-contain" />
                      <span className="text-[10px]">{item.label}</span>
                    </button>
                  ))}
                </div>
                <Input
                  value={formProdImagem.startsWith("data:") ? "" : formProdImagem}
                  onChange={(e) => setFormProdImagem(e.target.value)}
                  placeholder="Ou cole um link de imagem online..."
                  className="bg-slate-800/60 border-slate-700 text-xs text-slate-300"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="field-label text-xs text-slate-300">Descrição do Produto</Label>
                <Textarea
                  rows={3}
                  value={formProdDescricao}
                  onChange={(e) => setFormProdDescricao(e.target.value)}
                  placeholder="Principais funções, zonas, alcance, resolução..."
                  className="bg-slate-800 border-slate-700 text-white text-xs"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formProdDestaque}
                  onChange={(e) => setFormProdDestaque(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span>Destacar este produto na tela principal pública</span>
              </label>
            </div>

            <DialogFooter className="p-4 border-t border-slate-800 shrink-0 bg-slate-900 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalProdutoAberto(false)}
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer shadow-md"
              >
                Salvar Produto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
