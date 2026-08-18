import { promises as fs } from "node:fs";
import path from "node:path";
import type { Cliente } from "./clientes.types";

const ARQUIVO = path.join(process.cwd(), "data", "clientes.json");

// Fallback usado quando o sistema de arquivos do servidor é somente leitura.
let memoria: Cliente[] | null = null;

export async function lerClientes(): Promise<Cliente[]> {
  if (memoria) return memoria;
  try {
    const conteudo = await fs.readFile(ARQUIVO, "utf8");
    const dados = JSON.parse(conteudo) as Cliente[];
    memoria = Array.isArray(dados) ? dados : [];
  } catch {
    memoria = [];
  }
  return memoria;
}

export async function gravarClientes(lista: Cliente[]): Promise<void> {
  memoria = lista;
  try {
    await fs.mkdir(path.dirname(ARQUIVO), { recursive: true });
    await fs.writeFile(ARQUIVO, JSON.stringify(lista, null, 2), "utf8");
  } catch {
    // mantém apenas em memória se o disco não permitir escrita
  }
}
