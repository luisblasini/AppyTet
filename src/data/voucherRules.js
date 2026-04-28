/**
 * voucherRules.js — Diccionario Semántico de Vouchers (DEPRECADO)
 *
 * NOTA: Este archivo ha sido refactorizado en la v5 para usar la 
 * Fuente de la Verdad Unificada (final_master_catalog.json / Supabase).
 *
 * Las reglas ahora viven dentro de cada objeto de producto en los campos:
 * - meet_point / Local
 * - time / Hora
 * - fees_info / Taxas_info
 * - voucher_obs
 */

const VOUCHER_RULES = {
  // Archivo vaciado intencionalmente. 
  // La lógica dinámica ahora prioriza el catálogo unificado (SST).
};

/**
 * Busca las reglas semánticas de voucher.
 * @returns {object|null} - Null para forzar el uso del catálogo.
 */
export function getVoucherRules(tourName) {
  // Retorna null para que VoucherPreview use t.meet_point y t.fees_info.
  return null;
}

export default VOUCHER_RULES;
