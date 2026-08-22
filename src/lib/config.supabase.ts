import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./clientes.supabase";
import type { ConfigValores } from "./clientes.types";

const TABLE = "configuracoes";
const CHAVE = "valores";
const LS_KEY = "ws_config_valores";

const baseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

export function lerConfigLocal(): ConfigValores | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as ConfigValores) : null;
  } catch {
    return null;
  }
}

export function salvarConfigLocal(cfg: ConfigValores) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
  } catch {}
}

const SYSTEM_CONFIG_CPF = "888.888.888-88";
const SYSTEM_CONFIG_NOME = "__CONFIG_VALORES__";

export async function buscarConfigValoresSupabase(): Promise<ConfigValores | null> {
  // 1. Tenta na tabela configuracoes
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?chave=eq.${CHAVE}&select=valor`,
      { method: "GET", headers: baseHeaders }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0]?.valor) {
        const valor = data[0].valor;
        return typeof valor === "string" ? JSON.parse(valor) : (valor as ConfigValores);
      }
    }
  } catch (err) {
    console.warn("Falha ao buscar em configuracoes, tentando clientes:", err);
  }

  // 2. Fallback: busca na tabela clientes
  try {
    const resCli = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?cpf=eq.${SYSTEM_CONFIG_CPF}&select=*`,
      { method: "GET", headers: baseHeaders }
    );
    if (resCli.ok) {
      const dataCli = await resCli.json();
      if (Array.isArray(dataCli) && dataCli.length > 0) {
        const raw = dataCli[0]?.observacoes;
        if (raw) {
          return JSON.parse(raw) as ConfigValores;
        }
      }
    }
  } catch (e) {
    console.warn("Falha no fallback de configuracao clientes:", e);
  }

  return null;
}

export async function salvarConfigValoresSupabase(
  cfg: ConfigValores
): Promise<{ ok: boolean; erro?: string }> {
  salvarConfigLocal(cfg);

  // 1. Tenta salvar na tabela configuracoes
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?on_conflict=chave`, {
      method: "POST",
      headers: {
        ...baseHeaders,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({ chave: CHAVE, valor: cfg }),
    });
    if (res.ok) return { ok: true };
  } catch {
    // Continua para fallback
  }

  // 2. Fallback garantido na tabela clientes
  try {
    const resGet = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?cpf=eq.${SYSTEM_CONFIG_CPF}&select=id`,
      { method: "GET", headers: baseHeaders }
    );
    const dataGet = resGet.ok ? await resGet.json() : [];
    const payload = {
      nome: SYSTEM_CONFIG_NOME,
      endereco: "SISTEMA_CONFIG",
      cpf: SYSTEM_CONFIG_CPF,
      telefone: "00000000000",
      mac_central: "000000000000",
      modelo_central: "SISTEMA_CONFIG",
      observacoes: JSON.stringify(cfg),
      status: "sistema",
    };

    if (Array.isArray(dataGet) && dataGet.length > 0) {
      const id = dataGet[0].id;
      const resUpdate = await fetch(`${SUPABASE_URL}/rest/v1/clientes?id=eq.${id}`, {
        method: "PATCH",
        headers: baseHeaders,
        body: JSON.stringify(payload),
      });
      return { ok: resUpdate.ok };
    } else {
      const resInsert = await fetch(`${SUPABASE_URL}/rest/v1/clientes`, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify(payload),
      });
      return { ok: resInsert.ok };
    }
  } catch (err) {
    console.warn("Erro ao salvar configuracao no Supabase:", err);
    return { ok: false, erro: "Falha de conexão ao salvar na nuvem." };
  }
}
