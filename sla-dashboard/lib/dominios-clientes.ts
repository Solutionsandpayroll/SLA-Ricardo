export const DOMINIOS_CLIENTES = [
  "nazdar.com",
  "marketingdrs.com",
  "flexco.com",
  "oncehub.com",
  "safeguardglobal.com",
  "neo-si.com",
  "hemmersbach.com",
  "xinfushe.com",
  "bubblebpm.com",
  "globalexpansion.com",
  "rivermate.com",
  "remofirst.com",
  "actionad.agency",
  "europortage.com",
  "accder.pe",
  "pharmapoc.com",
  "siffi.com",
  "bettebuna.com",
  "elephant.re",
  "sailglobal.com",
  "marcopayroll.com",
  "sunshine-aupair.com",
  "ematys.com",
]

export function esDominioCliente(email: string): boolean {
  if (!email) return false
  const dominio = email.split("@")[1]?.toLowerCase()
  return DOMINIOS_CLIENTES.includes(dominio)
}
