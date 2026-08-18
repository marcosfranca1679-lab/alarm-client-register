import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { Cliente } from "./clientes.types";

const ARQUIVO_LOCAL = path.join(process.cwd(), "data", "clientes.json");
const ARQUIVO_TMP = path.join(os.tmpdir(), "alarm_clientes.json");

let memoria: Cliente[] | null = null;

export async function lerClientes(): Promise<Cliente[]> {
  if (memoria && memoria.length > 0) return memoria;

  for (const arq of [ARQUIVO_LOCAL, ARQUIVO_TMP]) {
    try {
      const conteudo = await fs.readFile(arq, "utf8");
      const dados = JSON.parse(conteudo) as Cliente[];
      if (Array.isArray(dados) && dados.length > 0) {
        memoria = dados;
        return memoria;
      }
    } catch {
      // Tenta o próximo local
    }
  }

  return memoria || [];
}

export async function gravarClientes(lista: Cliente[]): Promise<void> {
  memoria = lista;
  for (const arq of [ARQUIVO_LOCAL, ARQUIVO_TMP]) {
    try {
      await fs.mkdir(path.dirname(arq), { recursive: true });
      await fs.writeFile(arq, JSON.stringify(lista, null, 2), "utf8");
    } catch {
      // Tenta o próximo local
    }
  }
}

