import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  FileCheck,
  ArrowLeft,
  Printer,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatarData,
  extrairGarantia,
  OPCOES_GARANTIA_PADRAO,
} from "@/lib/clientes.types";
import { buscarClientesSupabase } from "@/lib/clientes.supabase";

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

  return (
    <div className="min-h-screen py-8 bg-slate-100/60 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-5">
        <div className="no-print mb-6 flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="cursor-pointer">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar ao Início
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() => window.print()}
            className="ml-auto bg-slate-900 text-white hover:bg-slate-800 cursor-pointer shadow-sm"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Imprimir / Salvar PDF
          </Button>
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
          <article className="card-elevated print-sheet p-8 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-7">
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
    </div>
  );
}
