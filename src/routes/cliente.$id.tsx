import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { formatarData } from "@/lib/clientes.types";
import { buscarClientesSupabase } from "@/lib/clientes.supabase";
import { listarClientes } from "@/lib/clientes.functions";

export const Route = createFileRoute("/cliente/$id")({
  head: () => ({
    meta: [
      { title: "Documento de Cadastro — WS Segurança Residencial" },
      { name: "description", content: "Ficha de cadastro do cliente e da central de alarme." },
    ],
  }),
  component: Documento,
});

function Linha({ rotulo, valor, mono }: { rotulo: string; valor: string; mono?: boolean }) {
  return (
    <div className="border-b py-3">
      <p className="field-label">{rotulo}</p>
      <p className={`mt-1 text-sm ${mono ? "font-mono" : ""}`}>{valor || "—"}</p>
    </div>
  );
}

function Documento() {
  const { id } = Route.useParams();

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const supa = await buscarClientesSupabase();
      return supa ?? [];
    },
    retry: 2,
  });

  const cliente = clientes.find((c) => c.id === id);

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-3xl px-5">
        <div className="no-print mb-6 flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">← Voltar</Link>
          </Button>
          <Button size="sm" onClick={() => window.print()}>Imprimir / Salvar PDF</Button>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

        {!isLoading && !cliente && (
          <div className="card-elevated p-8 text-center">
            <p className="text-sm text-muted-foreground">Cadastro não encontrado.</p>
          </div>
        )}

        {cliente && (
          <article className="card-elevated print-sheet p-8">
            <header className="flex items-center gap-4 border-b pb-6">
              <img src="/logo.jpg" alt="WS Segurança Residencial"
                className="h-14 w-14 rounded-2xl object-cover border border-slate-200 shadow-sm" />
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  WS SEGURANÇA RESIDENCIAL
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Ficha de Cadastro de Alarme & Manutenção Eletrônica
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="field-label">Protocolo</p>
                <p className="font-mono text-xs font-bold text-slate-900">{cliente.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </header>

            <section className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide">Dados do cliente</h2>
              <div className="mt-2 grid gap-x-8 sm:grid-cols-2">
                <Linha rotulo="Nome completo" valor={cliente.nome} />
                <Linha rotulo="CPF" valor={cliente.cpf} mono />
                <Linha rotulo="Telefone" valor={cliente.telefone} />
                <Linha rotulo="Data do cadastro" valor={formatarData(cliente.criadoEm)} />
              </div>
              <Linha rotulo="Endereço da instalação" valor={cliente.endereco} />
            </section>

            <section className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide">Dados da central</h2>
              <div className="mt-2 grid gap-x-8 sm:grid-cols-2">
                <Linha rotulo="Modelo da central" valor={cliente.modeloCentral} />
                <Linha rotulo="MAC da central" valor={cliente.macCentral} mono />
              </div>
              <Linha rotulo="Observações" valor={cliente.observacoes} />
            </section>

            {cliente.manutencoes && cliente.manutencoes.length > 0 && (
              <section className="mt-6">
                <h2 className="text-sm font-bold uppercase tracking-wide">
                  Histórico de Manutenções Registradas
                </h2>
                <div className="mt-2 space-y-2">
                  {cliente.manutencoes.map((m) => (
                    <div key={m.id} className="flex justify-between border-b py-2 text-sm">
                      <span className="font-mono font-medium">{formatarData(m.dataHora)}</span>
                      <span className="text-muted-foreground">{m.descricao}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <footer className="mt-10 border-t pt-6 text-xs text-muted-foreground">
              <p>Documento gerado automaticamente pelo sistema WS Segurança Residencial.</p>
              <p className="mt-1">Data de impressão: {formatarData(new Date().toISOString())}</p>
            </footer>
          </article>
        )}
      </div>
    </div>
  );
}
