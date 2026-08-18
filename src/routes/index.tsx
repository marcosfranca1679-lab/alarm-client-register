import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { ShieldCheck, Search, Trash2, FileText, Plus, Download, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listarClientes, salvarCliente, removerCliente } from "@/lib/clientes.functions";
import {
  MODELOS_CENTRAL,
  apenasDigitos,
  cpfValido,
  formatarCpf,
  formatarData,
  formatarMac,
  formatarTelefone,
  type Cliente,
} from "@/lib/clientes.types";
import {
  lerClientesLocais,
  salvarClientesLocais,
  mesclarClientes,
} from "@/lib/clientes.storage";
import {
  buscarClientesSupabase,
  salvarClienteSupabase,
  removerClienteSupabase,
} from "@/lib/clientes.supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cadastro de Clientes — Sistemas de Alarme" },
      {
        name: "description",
        content:
          "Registre clientes, CPF, endereço, MAC e modelo da central de alarme e gere o documento de cadastro.",
      },
      { property: "og:title", content: "Cadastro de Clientes — Sistemas de Alarme" },
      {
        property: "og:description",
        content: "Registro de instalações de alarme com emissão de documento de cadastro.",
      },
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
  const [form, setForm] = useState(vazio);
  const [busca, setBusca] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const listar = useServerFn(listarClientes);
  const salvar = useServerFn(salvarCliente);
  const remover = useServerFn(removerCliente);

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const local = lerClientesLocais();
      const supa = await buscarClientesSupabase();

      let listaCombinada = local;
      if (supa && Array.isArray(supa)) {
        listaCombinada = mesclarClientes(supa, local);
      }

      try {
        const srv = await listar();
        if (srv && Array.isArray(srv)) {
          listaCombinada = mesclarClientes(srv, listaCombinada);
        }
      } catch {
        // Ignora falha do servidor local se Supabase/localStorage respondeu
      }

      salvarClientesLocais(listaCombinada);
      return listaCombinada;
    },
  });

  const criar = useMutation({
    mutationFn: async (dados: typeof vazio) => {
      // 1. Tenta salvar no Supabase
      const doSupabase = await salvarClienteSupabase(dados);

      const novo: Cliente = doSupabase || {
        ...dados,
        id: crypto.randomUUID(),
        status: "ativo",
        criadoEm: new Date().toISOString(),
      };

      const atuais = lerClientesLocais();
      const atualizados = [novo, ...atuais.filter((c) => c.id !== novo.id)];
      salvarClientesLocais(atualizados);

      try {
        await salvar({ data: dados });
      } catch (e) {
        console.warn("Salvamento no servidor ignorado:", e);
      }
      return novo;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      setForm(vazio);
      toast.success("Cliente cadastrado com sucesso.");
    },
    onError: () => toast.error("Não foi possível salvar o cadastro."),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      await removerClienteSupabase(id);

      const atuais = lerClientesLocais();
      const atualizados = atuais.filter((c) => c.id !== id);
      salvarClientesLocais(atualizados);

      try {
        await remover({ data: { id } });
      } catch (e) {
        console.warn("Remoção no servidor ignorada:", e);
      }
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cadastro removido.");
    },
  });

  function exportarJson() {
    const dados = lerClientesLocais();
    const str = JSON.stringify(dados, null, 2);
    const blob = new Blob([str], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes_alarme_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup baixado com sucesso!");
  }

  function importarJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const conteudo = evt.target?.result as string;
        const parsed = JSON.parse(conteudo);
        if (Array.isArray(parsed)) {
          const atuais = lerClientesLocais();
          const mesclados = mesclarClientes(parsed, atuais);
          salvarClientesLocais(mesclados);
          qc.invalidateQueries({ queryKey: ["clientes"] });
          toast.success(`${parsed.length} cadastro(s) importado(s) com sucesso!`);
        } else {
          toast.error("Arquivo JSON inválido.");
        }
      } catch {
        toast.error("Falha ao ler o arquivo JSON.");
      }
    };
    reader.readAsText(file);
  }

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
                ? "MAC deve ter 12 caracteres hexadecimais."
                : !form.modeloCentral
                  ? "Selecione o modelo da central."
                  : null;
    if (erro) {
      toast.error(erro);
      return;
    }
    criar.mutate(form);

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
      <header className="bg-surface text-surface-foreground">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Central de Cadastros</h1>
            <p className="text-xs opacity-70">Sistemas de alarme e monitoramento</p>
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
              title="Importar cadastros de um arquivo JSON"
              className="text-xs"
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              Importar JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportarJson}
              title="Exportar backup dos cadastros em JSON"
              className="text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              Exportar JSON
            </Button>
            <span className="hidden text-xs opacity-70 sm:inline ml-2 border-l pl-3">
              {clientes.length} cadastro{clientes.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        <section className="card-elevated h-fit p-6">
          <h2 className="text-base font-bold">Novo cadastro</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Preencha os dados do cliente e da central instalada.
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
                <Label className="field-label">Modelo da central</Label>
                <Select
                  value={form.modeloCentral}
                  onValueChange={(v) => setForm({ ...form, modeloCentral: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELOS_CENTRAL.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="field-label" htmlFor="obs">
                Observações
              </Label>
              <Textarea
                id="obs"
                rows={3}
                maxLength={500}
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Zonas, sensores instalados, senha de coação, etc."
              />
            </div>

            <Button type="submit" className="w-full" disabled={criar.isPending}>
              <Plus className="h-4 w-4" />
              {criar.isPending ? "Salvando..." : "Cadastrar cliente"}
            </Button>
          </form>
        </section>

        <section className="card-elevated p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-bold">Clientes cadastrados</h2>
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

          <div className="mt-5 space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
            {!isLoading && filtrados.length === 0 && (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum cadastro encontrado. Registre o primeiro cliente ao lado.
                </p>
              </div>
            )}

            {filtrados.map((c) => (
              <article
                key={c.id}
                className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4"
              >
                <div className="min-w-[180px] flex-1">
                  <h3 className="text-sm font-semibold">{c.nome}</h3>
                  <p className="text-xs text-muted-foreground">
                    {c.cpf} · {c.telefone}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.endereco}</p>
                </div>
                <div className="min-w-[150px]">
                  <p className="field-label">Central</p>
                  <p className="text-sm">{c.modeloCentral}</p>
                  <p className="font-mono text-xs text-muted-foreground">{c.macCentral}</p>
                </div>
                <div className="min-w-[110px]">
                  <p className="field-label">Cadastro</p>
                  <p className="text-xs text-muted-foreground">{formatarData(c.criadoEm)}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <Link to="/cliente/$id" params={{ id: c.id }}>
                      <FileText className="h-4 w-4" />
                      Documento
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Excluir cadastro de ${c.nome}`}
                    onClick={() => excluir.mutate(c.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
