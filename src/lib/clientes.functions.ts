import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Cliente } from "./clientes.types";

const dadosClienteSchema = z.object({
  nome: z.string().trim().min(3).max(120),
  endereco: z.string().trim().min(5).max(200),
  cpf: z.string().trim().min(11).max(14),
  telefone: z.string().trim().min(10).max(20),
  macCentral: z.string().trim().min(12).max(17),
  modeloCentral: z.string().trim().min(2).max(80),
  observacoes: z.string().trim().max(500).default(""),
});

export const listarClientes = createServerFn({ method: "GET" }).handler(async () => {
  const { lerClientes } = await import("./clientes.server");
  const lista = await lerClientes();
  return [...lista]
    .map((c) => ({ ...c, status: c.status ?? "ativo" }))
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
});

export const salvarCliente = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => dadosClienteSchema.parse(input))
  .handler(async ({ data }) => {
    const { lerClientes, gravarClientes } = await import("./clientes.server");
    const lista = await lerClientes();
    const cliente: Cliente = {
      ...data,
      id: crypto.randomUUID(),
      status: "ativo",
      criadoEm: new Date().toISOString(),
    };
    await gravarClientes([...lista, cliente]);
    return cliente;
  });

export const atualizarCliente = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    dadosClienteSchema.extend({ id: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { lerClientes, gravarClientes } = await import("./clientes.server");
    const lista = await lerClientes();
    const atualizada = lista.map((c) => (c.id === data.id ? { ...c, ...data } : c));
    await gravarClientes(atualizada);
    return { ok: true };
  });

export const alterarStatusCliente = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().min(1), status: z.enum(["ativo", "inativo"]) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { lerClientes, gravarClientes } = await import("./clientes.server");
    const lista = await lerClientes();
    await gravarClientes(
      lista.map((c) => (c.id === data.id ? { ...c, status: data.status } : c)),
    );
    return { ok: true };
  });

export const removerCliente = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { lerClientes, gravarClientes } = await import("./clientes.server");
    const lista = await lerClientes();
    await gravarClientes(lista.filter((c) => c.id !== data.id));
    return { ok: true };
  });
