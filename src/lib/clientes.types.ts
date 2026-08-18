export type StatusCliente = "ativo" | "inativo";

export type Cliente = {
  id: string;
  nome: string;
  endereco: string;
  cpf: string;
  telefone: string;
  macCentral: string;
  modeloCentral: string;
  observacoes: string;
  status: StatusCliente;
  criadoEm: string;
};

export type NovoCliente = Omit<Cliente, "id" | "criadoEm" | "status">;


export const MODELOS_CENTRAL = [
  "Intelbras AMT 8000",
  "Intelbras AMT 4010 Smart",
  "Intelbras AMT 2018 E",
  "Intelbras AMT 1016 NET",
  "JFL Active 20 Ultra",
  "JFL Active 8 Ultra",
  "JFL SmartCloud 18",
  "Positivo Casa Inteligente",
  "Compatec Onix 8",
  "Outro modelo",
];

export function apenasDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function formatarCpf(valor: string) {
  const d = apenasDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

export function formatarTelefone(valor: string) {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function formatarMac(valor: string) {
  const limpo = valor
    .toUpperCase()
    .replace(/[^0-9A-F]/g, "")
    .slice(0, 12);
  return limpo.replace(/(.{2})(?=.)/g, "$1:");
}

export function cpfValido(valor: string) {
  const cpf = apenasDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
  let dig = ((soma * 10) % 11) % 10;
  if (dig !== Number(cpf[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
  dig = ((soma * 10) % 11) % 10;
  return dig === Number(cpf[10]);
}

export function formatarData(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
