import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listarClientes } from "@/lib/clientes.functions";
import { formatarData } from "@/lib/clientes.types";
import { buscarClientesSupabase } from "@/lib/clientes.supabase";

export const Route = createFileRoute("/cliente/$id")({
  head: () => ({
    meta: [
      { title: "Documento de Cadastro — Sistema de Alarme" },
      {
        name: "description",
        content: "Documento de cadastro do cliente e da central de alarme instalada.",
      },
      { property: "og:title", content: "Documento de Cadastro — Sistema de Alarme" },
      {
        property: "og:description",
        content: "Ficha completa do cliente e da central de alarme para impressão.",
      },
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
  const listar = useServerFn(listarClientes);
  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      try {
        const supa = await buscarClientesSupabase();
        if (supa && Array.isArray(supa)) {
          return supa;
        }
      } catch (e) {
        console.warn("Erro ao buscar Supabase:", e);
      }
      try {
        const srv = await listar();
        if (srv && Array.isArray(srv)) return srv;
      } catch (e) {
        console.warn("Erro ao listar do servidor:", e);
      }
      return [];
    },
  });

  const cliente = clientes?.find((c) => c.id === id);

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-3xl px-5">
        <div className="no-print mb-6 flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <Button
            className="ml-auto"
            size="sm"
            onClick={() => window.print()}
            disabled={!cliente}
          >
            <Printer className="h-4 w-4" />
            Imprimir / Salvar PDF
          </Button>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando documento...</p>}

        {!isLoading && !cliente && (
          <div className="card-elevated p-10 text-center">
            <p className="text-sm text-muted-foreground">Cadastro não encontrado.</p>
          </div>
        )}

        {cliente && (
          <article className="card-elevated print-sheet p-8">
            <header className="flex items-center gap-4 border-b pb-6">
              <img
                src="/logo.jpg"
                alt="WS Segurança Residencial"
                className="h-14 w-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
              />
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
                <div className="mt-2 space-y-2 border-t pt-2">
                  {cliente.manutencoes.map((m) => (
                    <div key={m.id} className="border-b py-2 flex items-start justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900 font-mono">
                          📅 {formatarData(m.dataHora)}
                        </span>
                        <p className="text-slate-700 mt-0.5">{m.descricao}</p>
                      </div>
                      <span className="text-[10px] uppercase bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-semibold">
                        Manutenção Realizada
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-14 grid gap-10 sm:grid-cols-2">
              <div className="border-t pt-2 text-center">
                <p className="text-xs text-muted-foreground">Assinatura do cliente</p>
              </div>
              <div className="border-t pt-2 text-center">
                <p className="text-xs text-muted-foreground">Responsável técnico</p>
              </div>
            </section>
          </article>
        )}
      </div>
    </div>
  );
}
