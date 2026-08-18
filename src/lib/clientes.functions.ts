import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { type Cliente, gerarId } from "./clientes.types";
import {
  buscarClientesSupabase,
  salvarClienteSupabase,
  removerClienteSupabase,
} from "./clientes.supabase";

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
  try {
    const supa = await buscarClientesSupabase();
    if (supa && Array.isArray(supa)) return supa;
  } catch (err) {
    console.warn("Erro ao listar clientes no servidor:", err);
  }
  return [];
});

export const salvarCliente = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => dadosClienteSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const res = await salvarClienteSupabase(data);
      if (res) return res;
    } catch (err) {
      console.warn("Erro ao salvar cliente no servidor:", err);
    }
    return {
      ...data,
      id: gerarId(),
      status: "ativo",
      criadoEm: new Date().toISOString(),
      manutencoes: [],
    };
  });

export const removerCliente = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    try {
      await removerClienteSupabase(data.id);
    } catch (err) {
      console.warn("Erro ao remover cliente no servidor:", err);
    }
    return { ok: true };
  });
