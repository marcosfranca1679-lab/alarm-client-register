import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  FileCheck,
  ArrowLeft,
  Printer,
  DollarSign,
  CreditCard,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatarData,
  extrairGarantia,
  OPCOES_GARANTIA_PADRAO,
} from "@/lib/clientes.types";
import {
  buscarClientesSupabase,
  criarDownloadTemporarioSupabase,
  dispararDownloadBase64,
} from "@/lib/clientes.supabase";

/** Carrega jsPDF via CDN dinamicamente */
async function carregarJsPDF(): Promise<any> {
  if ((window as any).jspdf?.jsPDF) return (window as any).jspdf.jsPDF;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => resolve((window as any).jspdf?.jsPDF);
    script.onerror = () => reject(new Error("Falha ao carregar jsPDF"));
    document.head.appendChild(script);
  });
}

/** Obtém o logo como base64 para incluir no PDF */
async function obterLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch("/logo.jpg");
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}










export const Route = createFileRoute("/cliente/$id")({
  head: () => ({
    meta: [
      { title: "Documento de Cadastro & Termo de Garantia — WS Segurança Residencial" },
      {
        name: "description",
        content: "Ficha de cadastro, valores e termo de garantia de manutenção de alarme.",
      },
    ],
  }),
  component: Documento,
});

function Linha({ rotulo, valor, mono }: { rotulo: string; valor: string; mono?: boolean }) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 py-2.5">
      <p className="field-label text-xs text-muted-foreground">{rotulo}</p>
      <p
        className={`mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100 ${
          mono ? "font-mono" : ""
        }`}
      >
        {valor || "—"}
      </p>
    </div>
  );
}

function Documento() {
  const { id } = Route.useParams();

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const lista = await buscarClientesSupabase();
      return lista ?? [];
    },
    enabled: typeof window !== "undefined",
    staleTime: 30_000,
    retry: 1,
  });

  const cliente = clientes.find((c) => c.id === id);
  const { obsLimpa, garantia } = cliente
    ? extrairGarantia(cliente.observacoes)
    : {
        obsLimpa: "",
        garantia: {
          validade: "90 dias (CDC)",
          coberturas: [],
          valorServico: "",
          formaPagamento: "PIX",
          tipoCobrancaGarantia: "mensal" as const,
        },
      };

  const [downloadTemp, setDownloadTemp] = useState<{ nomeArquivo: string; segundos: number } | null>(null);

  useEffect(() => {
    if (!downloadTemp) return;
    if (downloadTemp.segundos <= 0) { setDownloadTemp(null); return; }
    const timer = setInterval(() => {
      setDownloadTemp((prev) => prev ? { ...prev, segundos: prev.segundos - 1 } : null);
    }, 1000);
    return () => clearInterval(timer);
  }, [downloadTemp]);

  async function gerarEBaixarPDF() {
    if (!cliente) return;
    toast.info("Gerando documento oficial em PDF...");
    try {
      const JsPDF = await carregarJsPDF();
      if (!JsPDF) throw new Error("jsPDF não carregou");

      const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const logoBase64 = await obterLogoBase64();

      const marg = 12;
      const wTotal = 210 - marg * 2; // 186mm
      let y = 12;

      // ── CABEÇALHO OFICIAL ──
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, "JPEG", marg, y, 16, 16);
        } catch {
          // fallback se falhar imagem
        }
      }

      const textX = logoBase64 ? marg + 19 : marg;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42); // #0f172a
      doc.text("WS SEGURANÇA RESIDENCIAL", textX, y + 4.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105); // #475569
      doc.text("Ficha de Cadastro, Valores & Termo de Garantia da Manutenção", textX, y + 9);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139); // #64748b
      doc.text("Sistema Eletrônico de Alarme e Monitoramento", textX, y + 13);

      // Box Protocolo (canto superior direito)
      const protoW = 38;
      const protoX = 210 - marg - protoW;
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(protoX, y, protoW, 14, 2, 2, "FD");

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("PROTOCOLO", protoX + protoW / 2, y + 4.5, { align: "center" });

      doc.setFontSize(9);
      doc.setFont("courier", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(cliente.id.slice(0, 8).toUpperCase(), protoX + protoW / 2, y + 10.5, { align: "center" });

      // Linha divisória
      y += 18;
      doc.setDrawColor(226, 232, 240);
      doc.line(marg, y, 210 - marg, y);
      y += 5;

      // Helper para títulos de seção
      const tituloSecao = (txt: string, cor: [number, number, number] = [30, 41, 59]) => {
        doc.setFillColor(241, 245, 249);
        doc.rect(marg, y, wTotal, 5.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...cor);
        doc.text(txt.toUpperCase(), marg + 2, y + 4);
        y += 7.5;
      };

      // Helper para campos em 2 colunas
      const gridDuasColunas = (
        r1: string, v1: string,
        r2: string, v2: string,
        mono1 = false, mono2 = false
      ) => {
        const colW = (wTotal - 6) / 2;
        const col2X = marg + colW + 6;

        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text(r1.toUpperCase(), marg, y);
        doc.text(r2.toUpperCase(), col2X, y);
        y += 3.5;

        doc.setFontSize(8);
        doc.setFont(mono1 ? "courier" : "helvetica", mono1 ? "bold" : "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(v1 || "—", marg, y);

        doc.setFont(mono2 ? "courier" : "helvetica", mono2 ? "bold" : "normal");
        doc.text(v2 || "—", col2X, y);
        y += 5;
      };

      const campoLinha = (r: string, v: string) => {
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text(r.toUpperCase(), marg, y);
        y += 3.5;

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        const linhas = doc.splitTextToSize(v || "—", wTotal);
        doc.text(linhas, marg, y);
        y += linhas.length * 4 + 1;
      };

      // ── SEÇÃO 1: DADOS DO CLIENTE ──
      tituloSecao("1. Dados do Cliente e Instalação");
      gridDuasColunas("Nome Completo", cliente.nome, "CPF", cliente.cpf, false, true);
      gridDuasColunas("Telefone / WhatsApp", cliente.telefone, "Data do Cadastro", formatarData(cliente.criadoEm));
      campoLinha("Endereço Completo da Instalação", cliente.endereco);
      y += 2;

      // ── SEÇÃO 2: DADOS DO EQUIPAMENTO ──
      tituloSecao("2. Dados do Equipamento / Central");
      gridDuasColunas("Modelo da Central", cliente.modeloCentral, "MAC Address da Central", cliente.macCentral, false, true);
      if (obsLimpa) {
        campoLinha("Observações Técnicas", obsLimpa);
      }
      y += 2;

      // ── SEÇÃO 3: CONDIÇÕES COMERCIAIS & PAGAMENTO ──
      tituloSecao("3. Condições Comerciais & Pagamento", [5, 150, 105]);

      const boxW = (wTotal - 4) / 2;
      const boxH = 17;

      // Card Esquerda: Valor do Serviço
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(marg, y, boxW, boxH, 2, 2, "FD");

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("VALOR DO SERVIÇO / INSTALAÇÃO", marg + 3, y + 4.5);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(4, 120, 87);
      doc.text(garantia.valorServico ? `R$ ${garantia.valorServico}` : "Sob consulta", marg + 3, y + 10);

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Forma de Pagamento: ${garantia.formaPagamento || "PIX"}`, marg + 3, y + 14.5);

      // Card Direita: Garantia Estendida
      const card2X = marg + boxW + 4;
      doc.setFillColor(239, 246, 255);
      doc.setDrawColor(191, 219, 254);
      doc.roundedRect(card2X, y, boxW, boxH, 2, 2, "FD");

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("COBRANÇA DA GARANTIA ESTENDIDA", card2X + 3, y + 4.5);

      if (garantia.coberturas.length > 0) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(29, 78, 216);
        const txtValor = garantia.tipoCobrancaGarantia === "total" && garantia.valorTotalGarantia
          ? `R$ ${garantia.valorTotalGarantia.toFixed(2).replace(".", ",")} Total à Vista`
          : garantia.valorMensalGarantia
            ? `R$ ${garantia.valorMensalGarantia.toFixed(2).replace(".", ",")}/mês`
            : "Incluso";
        doc.text(txtValor, card2X + 3, y + 10);

        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(`${garantia.coberturas.length} item(ns) contratado(s)`, card2X + 3, y + 14.5);
      } else {
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(180, 83, 9);
        doc.text("Garantia Legal CDC (Inclusa)", card2X + 3, y + 10);

        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Sem cobrança adicional", card2X + 3, y + 14.5);
      }

      y += boxH + 4;

      // ── SEÇÃO 4: TERMO DE GARANTIA OFICIAL ──
      // Box principal do termo
      const termoH = 68;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(191, 219, 254);
      doc.roundedRect(marg, y, wTotal, termoH, 2, 2, "FD");

      // Cabeçalho do Termo
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 58, 138);
      doc.text("TERMO DE GARANTIA DA MANUTENÇÃO", marg + 4, y + 6);

      // Badge Validade
      const badgeW = 34;
      const badgeX = 210 - marg - badgeW - 4;
      doc.setFillColor(37, 99, 235);
      doc.roundedRect(badgeX, y + 2, badgeW, 6, 1.5, 1.5, "F");
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(`Validade: ${garantia.validade}`, badgeX + badgeW / 2, y + 6.2, { align: "center" });

      let termoY = y + 11;

      // Box Modalidade CDC / Estendida
      if (garantia.coberturas.length === 0) {
        doc.setFillColor(254, 243, 199);
        doc.setDrawColor(252, 211, 77);
        doc.roundedRect(marg + 3, termoY, wTotal - 6, 11, 1.5, 1.5, "FD");

        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(146, 64, 14);
        doc.text("MODALIDADE: GARANTIA LEGAL PADRÃO DE 90 DIAS (ART. 26 DO CDC)", marg + 5, termoY + 4);

        doc.setFontSize(5.8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 53, 15);
        doc.text("Vigência exclusiva da garantia legal obrigatória de 90 dias (Lei 8.078/1990 CDC) para os serviços executados.", marg + 5, termoY + 8.5);
      } else {
        doc.setFillColor(236, 253, 245);
        doc.setDrawColor(167, 243, 208);
        doc.roundedRect(marg + 3, termoY, wTotal - 6, 11, 1.5, 1.5, "FD");

        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(6, 95, 70);
        doc.text("MODALIDADE: GARANTIA PERSONALIZADA / ESTENDIDA CONTRATADA", marg + 5, termoY + 4);

        doc.setFontSize(5.8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(4, 120, 87);
        doc.text(`Coberturas técnicas contratadas com prazo total de ${garantia.validade} (90 dias legais CDC + período adicional).`, marg + 5, termoY + 8.5);
      }

      termoY += 14;

      // Lista de Coberturas (Todas as 7 opções padrão com check [✓] ou [✕])
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("1. COBERTURAS DO TERMO:", marg + 4, termoY);
      termoY += 3.5;

      OPCOES_GARANTIA_PADRAO.forEach((item) => {
        const incluso = garantia.coberturas.includes(item);
        if (incluso) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(4, 120, 87);
          doc.text("[✓]", marg + 5, termoY);
          doc.setTextColor(15, 23, 42);
          doc.text(item, marg + 11, termoY);
        } else {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(156, 163, 175);
          doc.text("[✕]", marg + 5, termoY);
          doc.setTextColor(148, 163, 184);
          doc.text(item, marg + 11, termoY);
        }
        termoY += 4.3;
      });

      y += termoH + 4;

      // ── SEÇÃO 5: CONSIDERAÇÕES FINAIS ──
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("5. CONSIDERAÇÕES FINAIS:", marg, y);
      y += 3.5;

      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const txtFinal = "A garantia cobre integralmente os serviços e itens descritos neste termo em conformidade com as normas vigentes de proteção ao consumidor (CDC), não se estendendo a danos por mau uso, intervenções de terceiros não autorizados ou causas externas não cobertas.";
      const linhasFinal = doc.splitTextToSize(txtFinal, wTotal);
      doc.text(linhasFinal, marg, y);
      y += linhasFinal.length * 3.2 + 6;

      // ── ASSINATURAS ──
      const signW = 75;
      const sign1X = marg + 6;
      const sign2X = 210 - marg - signW - 6;

      // Linhas de assinatura
      doc.setDrawColor(100, 116, 139);
      doc.line(sign1X, y, sign1X + signW, y);
      doc.line(sign2X, y, sign2X + signW, y);
      y += 4;

      // Assinatura Cliente
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(cliente.nome, sign1X + signW / 2, y, { align: "center" });

      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Assinatura do Cliente / Contratante", sign1X + signW / 2, y + 3.5, { align: "center" });
      doc.setFont("courier", "normal");
      doc.text(`CPF: ${cliente.cpf}`, sign1X + signW / 2, y + 6.5, { align: "center" });

      // Assinatura Empresa
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text("WS SEGURANÇA RESIDENCIAL", sign2X + signW / 2, y, { align: "center" });

      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Responsável Técnico / Emissor", sign2X + signW / 2, y + 3.5, { align: "center" });
      doc.text("Sistema de Alarme e Segurança", sign2X + signW / 2, y + 6.5, { align: "center" });

      // ── RODAPÉ OFICIAL ──
      const rodapeY = 290;
      doc.setDrawColor(226, 232, 240);
      doc.line(marg, rodapeY - 3, 210 - marg, rodapeY - 3);

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Documento oficial emitido por WS Segurança Residencial • (48) 99911-8524 • Emissão: ${formatarData(new Date().toISOString())}`, 210 / 2, rodapeY, { align: "center" });

      // Gera PDF em Base64
      const pdfBase64 = doc.output("datauristring").split(",")[1];
      const nomeArquivo = `termo_${cliente.nome.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`;

      // Envia cópia temporária de segurança para o Supabase (auto-apaga em 60s)
      toast.info("Enviando ao Supabase...");
      const tempId = await criarDownloadTemporarioSupabase(nomeArquivo, pdfBase64);

      // Dispara o download nativo no Android WebView ou navegador
      dispararDownloadBase64(nomeArquivo, pdfBase64, "application/pdf");

      if (tempId) {
        setDownloadTemp({ nomeArquivo, segundos: 60 });
        toast.success("PDF oficial gerado e salvo na pasta Downloads!");
      } else {
        toast.success("PDF baixado com sucesso!");
      }
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      toast.error("Erro ao gerar PDF. Abrindo tela de impressão...");
      setTimeout(() => window.print(), 300);
    }
  }




  return (
    <div className="min-h-screen py-8 bg-slate-100/60 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-5">
        <div className="no-print mb-6 flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="cursor-pointer">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar ao Início
            </Link>
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={gerarEBaixarPDF}
              className="border-blue-400 text-blue-600 dark:border-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer shadow-sm text-xs"
            >
              <Download className="h-4 w-4 mr-1.5 text-blue-500" />
              Baixar Termo PDF
            </Button>
            <Button
              size="sm"
              onClick={() => window.print()}
              className="bg-slate-900 text-white hover:bg-slate-800 cursor-pointer shadow-sm text-xs"
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Imprimir / Salvar PDF
            </Button>
          </div>
        </div>


        {isLoading && (
          <div className="card-elevated p-8 text-center bg-white dark:bg-slate-900">
            <p className="text-sm text-muted-foreground">Carregando dados do documento...</p>
          </div>
        )}

        {!isLoading && !cliente && (
          <div className="card-elevated p-8 text-center bg-white dark:bg-slate-900">
            <p className="text-sm text-muted-foreground">Cadastro não encontrado.</p>
          </div>
        )}

        {cliente && (
          <article
            id="documento-termo-garantia"
            className="card-elevated print-sheet p-8 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-7"
          >
            {/* ── Cabeçalho Oficial ── */}
            <header className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
              <img
                src="/logo.jpg"
                alt="WS Segurança Residencial"
                className="h-16 w-16 rounded-2xl object-cover border border-slate-200 shadow-sm ring-2 ring-blue-500/10"
              />
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  WS SEGURANÇA RESIDENCIAL
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                  Ficha de Cadastro, Valores & Termo de Garantia da Manutenção
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Sistema Eletrônico de Alarme e Monitoramento
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="field-label text-xs">Protocolo</p>
                <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border">
                  {cliente.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </header>

            {/* ── Seção 1: Dados do Cliente ── */}
            <section>
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <FileCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  1. Dados do Cliente e Instalação
                </h2>
              </div>
              <div className="mt-2 grid gap-x-8 sm:grid-cols-2">
                <Linha rotulo="Nome completo" valor={cliente.nome} />
                <Linha rotulo="CPF" valor={cliente.cpf} mono />
                <Linha rotulo="Telefone para contato" valor={cliente.telefone} />
                <Linha rotulo="Data do cadastro" valor={formatarData(cliente.criadoEm)} />
              </div>
              <Linha rotulo="Endereço completo da instalação" valor={cliente.endereco} />
            </section>

            {/* ── Seção 2: Dados da Central de Alarme ── */}
            <section>
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  2. Dados do Equipamento / Central
                </h2>
              </div>
              <div className="mt-2 grid gap-x-8 sm:grid-cols-2">
                <Linha rotulo="Modelo da central" valor={cliente.modeloCentral} />
                <Linha rotulo="MAC Address da central" valor={cliente.macCentral} mono />
              </div>
              {obsLimpa && <Linha rotulo="Observações técnicas" valor={obsLimpa} />}
            </section>

            {/* ── Seção 3: Valores Comerciais & Condições de Pagamento ── */}
            <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  3. Condições Comerciais & Pagamento
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border">
                  <p className="field-label text-[11px] text-muted-foreground">
                    Valor do Serviço / Instalação
                  </p>
                  <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {garantia.valorServico ? `R$ ${garantia.valorServico}` : "Sob consulta"}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Forma de Pagamento:{" "}
                    <strong>{garantia.formaPagamento || "PIX"}</strong>
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border">
                  <p className="field-label text-[11px] text-muted-foreground">
                    Cobrança da Garantia Estendida
                  </p>
                  {garantia.coberturas.length > 0 ? (
                    <div>
                      <p className="text-base font-extrabold text-blue-700 dark:text-blue-300 mt-0.5">
                        {garantia.tipoCobrancaGarantia === "total" && garantia.valorTotalGarantia
                          ? `R$ ${garantia.valorTotalGarantia.toFixed(2).replace(".", ",")} Total à Vista`
                          : garantia.valorMensalGarantia
                            ? `R$ ${garantia.valorMensalGarantia.toFixed(2).replace(".", ",")}/mês`
                            : "Incluso"}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        {garantia.coberturas.length} item(ns) a R${" "}
                        {garantia.valorItemGarantia?.toFixed(2).replace(".", ",") || "12,60"}/item/mês
                        ({garantia.tipoCobrancaGarantia === "total" ? "Valor Total Já" : "Cobrança Mensal"})
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                        Garantia Legal CDC (Inclusa)
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Sem cobrança adicional de garantia estendida.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ── Seção 4: Histórico de Manutenções (se houver) ── */}
            {cliente.manutencoes && cliente.manutencoes.length > 0 && (
              <section>
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    4. Histórico de Manutenções Registradas
                  </h2>
                </div>
                <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {cliente.manutencoes.map((m) => (
                    <div key={m.id} className="flex justify-between py-2">
                      <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                        📅 {formatarData(m.dataHora)}
                      </span>
                      <span className="text-muted-foreground">{m.descricao}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Seção Oficial: Termo de Garantia da Manutenção ── */}
            <section className="rounded-xl border border-blue-200/80 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200/70 dark:border-blue-900/50 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-blue-950 dark:text-blue-200 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    TERMO DE GARANTIA DA MANUTENÇÃO
                  </h2>
                  <p className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">
                    WS SEGURANÇA RESIDENCIAL
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block text-[11px] font-bold bg-blue-600 text-white px-2.5 py-1 rounded-md shadow-xs">
                    Validade: {garantia.validade}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                A <strong>WS Segurança Residencial</strong> oferece garantia sobre os serviços de manutenção realizados, conforme as condições descritas abaixo.
              </p>

              {/* Destaque da Modalidade de Garantia */}
              {garantia.coberturas.length === 0 ? (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 dark:text-amber-200">
                    <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>
                      MODALIDADE: GARANTIA LEGAL PADRÃO DE 90 DIAS (LEI DO CONSUMIDOR — ART. 26 DO CDC)
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed">
                    O cliente <strong>não contratou coberturas adicionais ou estendidas</strong>. Portanto, vigora exclusivamente a <strong>Garantia Legal Obrigatória de 90 (noventa) dias</strong> prevista no Artigo 26, Inciso II da Lei nº 8.078/1990 (Código de Defesa do Consumidor), cobrindo a execução dos serviços realizados contra vícios ou defeitos técnicos aparentes ou ocultos.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>MODALIDADE: GARANTIA PERSONALIZADA / ESTENDIDA CONTRATADA</span>
                  </div>
                  <p className="text-[11px] text-emerald-900 dark:text-emerald-300 leading-relaxed">
                    O cliente contratou coberturas técnicas específicas para os serviços de manutenção com prazo total de <strong>{garantia.validade}</strong> (90 dias legais do CDC + período adicional estendido).
                  </p>
                </div>
              )}

              {/* 1. O que a garantia cobre */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
                  1. COBERTURAS DO TERMO:
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {garantia.coberturas.length === 0
                    ? "Nenhuma cobertura adicional foi contratada. Vigência exclusiva da garantia legal de 90 dias do CDC para o serviço realizado:"
                    : "Itens técnicos e serviços cobertos conforme contratação do cliente:"}
                </p>
                <div className="grid gap-1.5 pt-1">
                  {OPCOES_GARANTIA_PADRAO.map((item) => {
                    const incluso = garantia.coberturas.includes(item);
                    return (
                      <div
                        key={item}
                        className={`flex items-start gap-2 rounded-md p-2 text-xs transition-colors ${
                          incluso
                            ? "bg-white dark:bg-slate-900 font-semibold text-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800 shadow-2xs"
                            : "bg-slate-100/50 dark:bg-slate-800/30 text-muted-foreground line-through opacity-60 border border-dashed border-slate-200"
                        }`}
                      >
                        {incluso ? (
                          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <span className="leading-snug">{item}</span>
                        {incluso ? (
                          <span className="ml-auto text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200">
                            INCLUSO
                          </span>
                        ) : (
                          <span className="ml-auto text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border">
                            NÃO CONTRATADO
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Situações não cobertas */}
              <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase">
                  2. SITUAÇÕES NÃO COBERTAS:
                </h3>
                <p className="text-[11px] text-muted-foreground">A garantia não cobre danos provocados por:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 pl-1">
                  <li>Mau uso ou utilização inadequada do equipamento;</li>
                  <li>Quedas, impactos ou danos físicos causados pelo cliente ou terceiros;</li>
                  <li>Alterações, desmontagem ou tentativa de reparo por pessoas não autorizadas;</li>
                  <li>Modificações na instalação sem autorização da WS Segurança Residencial;</li>
                  <li>Danos provocados intencionalmente;</li>
                  <li>Problemas decorrentes de equipamentos ou instalações que não fazem parte do serviço contratado.</li>
                </ul>
              </div>

              {/* 3. Avaliação Técnica */}
              <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase">
                  3. AVALIAÇÃO TÉCNICA:
                </h3>
                <p className="text-[11px] leading-relaxed">
                  Em caso de falha, a WS Segurança Residencial realizará uma avaliação técnica para identificar a causa do problema e verificar se o atendimento está dentro das condições de garantia. Caso seja constatado que o problema está coberto, o reparo ou substituição será realizado <strong>sem custos adicionais ao cliente</strong>.
                </p>
              </div>

              {/* 4. Validade e Composição */}
              <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase">
                  4. COMPOSIÇÃO DO PRAZO (90 DIAS LEGAIS + PRAZO ESTENDIDO):
                </h3>
                <p className="text-[11px] leading-relaxed">
                  A garantia total fornecida pela <strong>WS Segurança Residencial</strong> é estruturada cumulativamente:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] pl-1 text-slate-700 dark:text-slate-300">
                  <li>
                    <strong>Garantia Legal Obrigatória (90 dias)</strong>: Prevista no Art. 26, II do Código de Defesa do Consumidor (CDC), cobrindo integralmente todos os serviços executados contra falhas técnicas ou vícios de funcionamento.
                  </li>
                  <li>
                    <strong>Garantia Estendida / Contratual Adicional</strong>: Prazo adicional contratado pelo cliente que se <u>soma aos 90 dias da lei</u>, assegurando cobertura contínua e reposição dos componentes selecionados no presente termo.
                  </li>
                </ul>
                <p className="text-[11px] font-bold text-blue-950 dark:text-blue-200 mt-1 bg-blue-100/60 dark:bg-blue-900/40 p-2 rounded border border-blue-200 dark:border-blue-800">
                  Validade Total Acordada: {garantia.validade} (a contar de {formatarData(cliente.criadoEm)}).
                </p>
              </div>

              {/* 5. Considerações Finais */}
              <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase">
                  5. CONSIDERAÇÕES FINAIS:
                </h3>
                <p className="text-[11px] leading-relaxed">
                  A garantia cobre integralmente os serviços e itens descritos neste termo em conformidade com as normas vigentes de proteção ao consumidor, não se estendendo a danos por mau uso, intervenções de terceiros não autorizados ou causas externas não cobertas.
                </p>
              </div>
            </section>

            {/* ── Assinaturas ── */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold text-slate-900 dark:text-slate-100">{cliente.nome}</p>
                <p className="text-[11px] text-muted-foreground">Assinatura do Cliente / Contratante</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">CPF: {cliente.cpf}</p>
              </div>

              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold text-slate-900 dark:text-slate-100">WS SEGURANÇA RESIDENCIAL</p>
                <p className="text-[11px] text-muted-foreground">Responsável Técnico / Emissor</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Sistema de Alarme e Segurança</p>
              </div>
            </div>

            {/* ── Rodapé ── */}
            <footer className="border-t border-slate-200 dark:border-slate-800 pt-4 text-center text-[11px] text-muted-foreground">
              <p>Documento oficial emitido por WS Segurança Residencial.</p>
              <p className="mt-0.5">Data de emissão: {formatarData(new Date().toISOString())}</p>
            </footer>
          </article>
        )}
      </div>

      {/* Notificação Flutuante de Download Temporário no Supabase (PDF) */}
      {downloadTemp && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-emerald-500/50 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md text-slate-100 space-y-2 animate-in fade-in slide-in-from-bottom-3 no-print">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-emerald-400 animate-bounce" />
              <p className="text-xs font-bold text-white truncate">{downloadTemp.nomeArquivo}</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
              {downloadTemp.segundos}s
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            PDF enviado ao Supabase para download no WebView. Será <strong>auto-excluído da nuvem em {downloadTemp.segundos}s</strong> por segurança.
          </p>
        </div>
      )}
    </div>
  );
}

