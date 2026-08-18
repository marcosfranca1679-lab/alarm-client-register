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
  OPCOES_GARANTIA_PADRAO,
  PERIODOS_VALIDADE_GARANTIA,
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
      { title: "WS Segurança Residencial — Cadastro de Clientes" },
      { name: "description", content: "Cadastro de clientes e manutenção de alarmes." },
    ],
  }),
  component: Index,
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

function Index() {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState(vazio);
  const [busca, setBusca] = useState("");
  const [clienteManutencao, setClienteManutencao] = useState<Cliente | null>(null);
  const [descricaoManutencao, setDescricaoManutencao] = useState("");
  const [historicoExpandido, setHistoricoExpandido] = useState<string | null>(null);

  // Estados do Termo de Garantia no Cadastro
  const [validadeGarantia, setValidadeGarantia] = useState("90 dias (Padrão - Lei do Consumidor CDC)");
  const [coberturasGarantia, setCoberturasGarantia] = useState<string[]>([
    OPCOES_GARANTIA_PADRAO[0],
    OPCOES_GARANTIA_PADRAO[1],
    OPCOES_GARANTIA_PADRAO[2],
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  useEffect(() => {
    setMounted(true);
  }, []);

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
      setCoberturasGarantia([
        OPCOES_GARANTIA_PADRAO[0],
        OPCOES_GARANTIA_PADRAO[1],
        OPCOES_GARANTIA_PADRAO[2],
      ]);
      setValidadeGarantia("90 dias (3 meses)");
      toast.success("Cliente e Termo de Garantia cadastrados com sucesso!");
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

    // Embutir opções de garantia no formulário
    const obsFinal = embutirGarantia(form.observacoes, {
      validade: validadeGarantia,
      coberturas: coberturasGarantia,
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
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="bg-surface text-surface-foreground border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-5">
          <img
            src="/logo.jpg"
            alt="WS Segurança Residencial"
            className="h-12 w-12 rounded-2xl object-cover border border-blue-400/30 shadow-md ring-2 ring-blue-500/20"
          />
          <div>
            <h1 className="text-xl font-extrabold leading-tight tracking-tight text-white">
              WS SEGURANÇA RESIDENCIAL
            </h1>
            <p className="text-xs text-blue-200/80 font-medium">
              Central de Cadastros, Manutenção & Termos de Garantia
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
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs bg-white text-slate-900 hover:bg-slate-100 font-semibold border border-slate-200 shadow-sm"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5 text-slate-800" /> Importar JSON
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportarJson}
              className="text-xs bg-white text-slate-900 hover:bg-slate-100 font-semibold border border-slate-200 shadow-sm"
            >
              <Download className="h-3.5 w-3.5 mr-1.5 text-slate-800" /> Exportar JSON
            </Button>
            <span className="hidden text-xs font-medium text-white/90 sm:inline ml-2 border-l border-white/20 pl-3">
              <span>{clientes.length}</span> {clientes.length === 1 ? "cadastro" : "cadastros"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,430px)_1fr]">
        {/* ── Formulário de Cadastro ── */}
        <section className="card-elevated h-fit p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Novo cadastro de cliente
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Preencha os dados do cliente, central e condições de garantia.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="field-label" htmlFor="nome">
                Nome completo
              </Label>
              <Input
                id="nome"
                value={form.nome}
                maxLength={120}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex.: Marcos Ribeiro de Souza"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="field-label" htmlFor="cpf">
                  CPF
                </Label>
                <Input
                  id="cpf"
                  inputMode="numeric"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: formatarCpf(e.target.value) })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="field-label" htmlFor="telefone">
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  inputMode="tel"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: formatarTelefone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="field-label" htmlFor="endereco">
                Endereço da instalação
              </Label>
              <Input
                id="endereco"
                value={form.endereco}
                maxLength={200}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                placeholder="Rua, número, bairro, cidade/UF"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="field-label" htmlFor="mac">
                  MAC da central
                </Label>
                <Input
                  id="mac"
                  value={form.macCentral}
                  onChange={(e) => setForm({ ...form, macCentral: formatarMac(e.target.value) })}
                  placeholder="00:1A:2B:3C:4D:5E"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="field-label" htmlFor="modeloCentral">
                  Modelo da central
                </Label>
                <select
                  id="modeloCentral"
                  value={form.modeloCentral}
                  onChange={(e) => setForm({ ...form, modeloCentral: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer text-slate-900 dark:text-slate-100"
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

            {/* ── Seção de Seleção do Termo de Garantia ── */}
            <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 space-y-3.5 dark:border-blue-900/50 dark:bg-blue-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950 dark:text-blue-200">
                  <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Termo de Garantia da Manutenção</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  coberturasGarantia.length === 0
                    ? "text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60"
                    : "text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60"
                }`}>
                  {coberturasGarantia.length === 0 ? "Padrão CDC 90 dias" : "Personalizada"}
                </span>
              </div>

              {coberturasGarantia.length === 0 ? (
                <div className="rounded-md bg-amber-50/90 dark:bg-amber-950/40 p-2.5 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-950 dark:text-amber-200 leading-tight">
                  ⚖️ <strong>Garantia Legal Padrão de 90 dias</strong> (Art. 26 do CDC) ativa. Aplica-se automaticamente quando o cliente não contrata coberturas adicionais.
                </div>
              ) : (
                <div className="rounded-md bg-emerald-50/90 dark:bg-emerald-950/40 p-2.5 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-950 dark:text-emerald-200 leading-tight">
                  🛡️ <strong>Garantia Personalizada / Estendida</strong> ativa com {coberturasGarantia.length} cobertura(s) selecionada(s).
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCoberturasGarantia([]);
                    setValidadeGarantia("90 dias (Padrão - Lei do Consumidor CDC)");
                  }}
                  className={`text-[11px] h-7 flex-1 font-medium ${
                    coberturasGarantia.length === 0 ? "border-amber-500 bg-amber-50 text-amber-900 font-bold" : ""
                  }`}
                >
                  ⚖️ Padrão 90 Dias (CDC)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCoberturasGarantia([...OPCOES_GARANTIA_PADRAO]);
                  }}
                  className={`text-[11px] h-7 flex-1 font-medium ${
                    coberturasGarantia.length === OPCOES_GARANTIA_PADRAO.length ? "border-blue-500 bg-blue-50 text-blue-900 font-bold" : ""
                  }`}
                >
                  ➕ Marcar Todas
                </Button>
              </div>

              <div className="space-y-1">
                <Label className="field-label text-xs">Período Total da Garantia</Label>
                <select
                  value={validadeGarantia}
                  onChange={(e) => setValidadeGarantia(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer text-slate-900 dark:text-slate-100 font-medium"
                >
                  {PERIODOS_VALIDADE_GARANTIA.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <p className="field-label text-xs font-semibold">
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
                            ? "bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800 text-slate-900 dark:text-slate-100 font-medium shadow-2xs"
                            : "bg-transparent border-dashed border-slate-200 dark:border-slate-800 text-muted-foreground opacity-70"
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
                          className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="leading-tight">{op}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="field-label" htmlFor="obs">
                Observações adicionais (opcional)
              </Label>
              <Textarea
                id="obs"
                rows={2}
                maxLength={500}
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Zonas, sensores instalados, senha de coação, etc."
              />
            </div>

            <Button type="submit" className="w-full font-medium" disabled={criar.isPending}>
              <Plus className="h-4 w-4 mr-1.5" />
              {criar.isPending ? "Salvando..." : "Cadastrar Cliente & Emitir Termo"}
            </Button>
          </form>
        </section>

        {/* ── Lista de Clientes Cadastrados ── */}
        <section className="card-elevated p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Clientes cadastrados
            </h2>
            <div className="relative ml-auto w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, CPF ou MAC"
                className="pl-9"
              />
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {isLoading && (
              <p className="text-sm text-muted-foreground">Carregando dados do Supabase...</p>
            )}
            {!isLoading && filtrados.length === 0 && (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <p className="text-sm text-muted-foreground">
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
                  className="rounded-lg border bg-card p-4 transition-all hover:border-slate-300 space-y-2.5"
                >
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="min-w-[180px] flex-1">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {c.nome}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        <span>{c.cpf}</span> · <span>{c.telefone}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{c.endereco}</p>
                    </div>

                    <div className="min-w-[140px]">
                      <p className="field-label">Central</p>
                      <p className="text-sm font-medium">{c.modeloCentral}</p>
                      <p className="font-mono text-xs text-muted-foreground">{c.macCentral}</p>
                    </div>

                    <div className="min-w-[110px]">
                      <p className="field-label">Cadastro</p>
                      <p className="text-xs text-muted-foreground">{formatarData(c.criadoEm)}</p>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setClienteManutencao(c);
                          setDescricaoManutencao("");
                        }}
                        className="text-xs border-amber-600/30 text-amber-700 bg-amber-50/50 hover:bg-amber-100 font-semibold dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700/50 cursor-pointer"
                      >
                        <Wrench className="h-3.5 w-3.5 mr-1 text-amber-600" /> Salvar Manutenção
                      </Button>

                      <Button asChild variant="secondary" size="sm" className="cursor-pointer">
                        <Link to="/cliente/$id" params={{ id: c.id }}>
                          <FileText className="h-4 w-4 mr-1 text-slate-700" /> Documento & Garantia
                        </Link>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Excluir ${c.nome}`}
                        onClick={() => excluir.mutate(c.id)}
                        className="cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 text-rose-500 hover:text-rose-700" />
                      </Button>
                    </div>
                  </div>

                  {/* Badge de Garantia e Observações */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {garantia.coberturas.length === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
                        <ShieldCheck className="h-3 w-3 text-amber-600" />
                        <span>Garantia Legal: 90 dias (Padrão CDC)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        <span>Garantia Contratada: {garantia.validade}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-normal">
                          ({garantia.coberturas.length} coberturas)
                        </span>
                      </span>
                    )}

                    {obsLimpa && (
                      <span className="text-[11px] text-muted-foreground truncate max-w-xs">
                        Obs: {obsLimpa}
                      </span>
                    )}
                  </div>

                  {/* Histórico de Manutenções */}
                  {manuts.length > 0 ? (
                    <div className="mt-2 border-t pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300 font-medium">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          <span>
                            <span>Última manutenção: </span>
                            <strong>{formatarData(ultima?.dataHora || "")}</strong>
                          </span>
                          {ultima?.descricao && (
                            <span className="text-muted-foreground font-normal ml-1">
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
                            className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 underline font-medium cursor-pointer"
                          >
                            {historicoExpandido === c.id
                              ? "Ocultar histórico"
                              : `Ver histórico (${manuts.length})`}
                          </button>
                        )}
                      </div>
                      {historicoExpandido === c.id && (
                        <div className="mt-2 space-y-1.5 rounded-md bg-slate-50 dark:bg-slate-900/50 p-2.5 border text-xs">
                          <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                            <History className="h-3.5 w-3.5" /> Histórico completo:
                          </p>
                          {manuts.map((m) => (
                            <div
                              key={m.id}
                              className="flex justify-between border-b pb-1 last:border-0 last:pb-0"
                            >
                              <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                                📅 {formatarData(m.dataHora)}
                              </span>
                              <span className="text-muted-foreground">{m.descricao}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1 border-t pt-1.5 text-[11px] text-muted-foreground flex items-center gap-1">
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Wrench className="h-5 w-5 text-amber-600" /> Salvar Nova Manutenção
            </DialogTitle>
          </DialogHeader>
          {clienteManutencao && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-amber-50/70 border border-amber-200/60 p-3 text-xs dark:bg-amber-950/20 dark:border-amber-800/40">
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                  {clienteManutencao.nome}
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Central: {clienteManutencao.modeloCentral} ({clienteManutencao.macCentral})
                </p>
              </div>
              <div className="space-y-1">
                <Label className="field-label flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-500" /> Data e Hora do Registro:
                </Label>
                <div className="rounded-md border bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm font-mono font-medium text-slate-800 dark:text-slate-200">
                  {formatarData(new Date().toISOString())}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="descManut" className="field-label">
                  Descrição dos serviços executados:
                </Label>
                <Textarea
                  id="descManut"
                  rows={3}
                  value={descricaoManutencao}
                  onChange={(e) => setDescricaoManutencao(e.target.value)}
                  placeholder="Ex.: Troca de bateria da central, testes de sirene e ajuste dos sensores das zonas..."
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setClienteManutencao(null)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium cursor-pointer"
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
