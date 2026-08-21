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

export async function buscarConfigValoresSupabase(): Promise<ConfigValores | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?chave=eq.${CHAVE}&select=valor`,
      { method: "GET", headers: baseHeaders }
    );
    if (!res.ok) {
      console.warn("Config GET falhou:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const valor = data[0]?.valor;
    if (!valor) return null;
    return typeof valor === "string" ? JSON.parse(valor) : (valor as ConfigValores);
  } catch (err) {
    console.warn("Erro ao buscar configurações:", err);
    return null;
  }
}

export async function salvarConfigValoresSupabase(
  cfg: ConfigValores
): Promise<{ ok: boolean; erro?: string }> {
  salvarConfigLocal(cfg);
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
    const texto = await res.text();
    console.warn("Config POST falhou:", res.status, texto);
    if (res.status === 404 || texto.includes("does not exist")) {
      return {
        ok: false,
        erro: "A tabela 'configuracoes' ainda não existe no banco. Rode o SQL fornecido no painel do banco de dados.",
      };
    }
    return { ok: false, erro: `Erro ${res.status}: ${texto.slice(0, 140)}` };
  } catch (err) {
    console.warn("Erro ao salvar configurações:", err);
    return { ok: false, erro: "Falha de conexão com a nuvem." };
  }
}
