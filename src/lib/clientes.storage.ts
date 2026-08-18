import type { Cliente, Manutencao } from "./clientes.types";

const STORAGE_KEY = "alarm_clientes_data_v1";

export function lerClientesLocais(): Cliente[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const dados = JSON.parse(raw);
    return Array.isArray(dados) ? dados : [];
  } catch (err) {
    console.error("Erro ao ler localStorage:", err);
    return [];
  }
}

export function salvarClientesLocais(lista: Cliente[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  } catch (err) {
    console.error("Erro ao salvar no localStorage:", err);
  }
}

export function mesclarClientes(servidor: Cliente[], local: Cliente[]): Cliente[] {
  const mapa = new Map<string, Cliente>();

  for (const item of servidor) {
    if (item && item.id) {
      mapa.set(item.id, { ...item, manutencoes: item.manutencoes || [] });
    }
  }

  for (const item of local) {
    if (item && item.id) {
      const existente = mapa.get(item.id);
      const manutsExistentes = existente?.manutencoes || [];
      const manutsNovas = item.manutencoes || [];
      const manutsMap = new Map<string, Manutencao>();

      for (const m of [...manutsExistentes, ...manutsNovas]) {
        if (m && m.id) manutsMap.set(m.id, m);
      }

      const manutsCombinadas = Array.from(manutsMap.values()).sort((a, b) =>
        (b.dataHora || "").localeCompare(a.dataHora || "")
      );

      mapa.set(item.id, {
        ...existente,
        ...item,
        manutencoes: manutsCombinadas,
      });
    }
  }

  return Array.from(mapa.values()).sort((a, b) => (b.criadoEm || "").localeCompare(a.criadoEm || ""));
}
