import { useState, useCallback } from 'react';
import { parseWhatsAppMessageAI, parseSmartNotesAI } from '../gemini';
import { upsertContactSupabase } from '../supabase';
import { toTitleCase } from '../utils/formatters';

// ─── Date Utilities ───────────────────────────────────────────────────────────

const MONTH_MAP = {
  'janeiro': '01', 'jan': '01', 'enero': '01',
  'fevereiro': '02', 'fev': '02', 'febrero': '02', 'feb': '02',
  'março': '03', 'mar': '03', 'marzo': '03',
  'abril': '04', 'abr': '04',
  'maio': '05', 'mai': '05', 'mayo': '05', 'may': '05',
  'junho': '06', 'jun': '06', 'junio': '06',
  'julho': '07', 'jul': '07', 'julio': '07',
  'agosto': '08', 'ago': '08',
  'setembro': '09', 'set': '09', 'septiembre': '09', 'sep': '09',
  'outubro': '10', 'out': '10', 'octubre': '10', 'oct': '10',
  'novembro': '11', 'nov': '11', 'noviembre': '11',
  'dezembro': '12', 'dez': '12', 'diciembre': '12', 'dic': '12'
};

/**
 * Converts a date string in any common format to ISO 8601 (YYYY-MM-DD).
 * Supports: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, "9 de agosto", etc.
 */
export const formatDateToISO = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return '';
  let clean = dateStr.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  // Text month: "9 de agosto", "12 março"
  const textMatch = clean.toLowerCase().match(/(\d{1,2})\s*(?:de\s*)?([a-zçñ]+)/);
  if (textMatch) {
    const day = textMatch[1].padStart(2, '0');
    const month = MONTH_MAP[textMatch[2]] || '01';
    const year = new Date().getFullYear().toString();
    return `${year}-${month}-${day}`;
  }

  // Numeric with any delimiter: / - or .
  const parts = clean.split(/[\/\-.]/);
  if (parts.length >= 2) {
    // Detect if first part is a 4-digit year (YYYY-MM-DD already handled, but YYYY/MM/DD)
    if (parts[0].length === 4) {
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = (parts[2] || '01').padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    // DD/MM/YYYY or DD.MM.YYYY
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    let y = parts[2];
    if (!y) y = new Date().getFullYear().toString();
    if (y.length === 2) y = '20' + y;
    return `${y}-${m}-${d}`;
  }
  return clean;
};

// ─── Fields allowed from AI response ──────────────────────────────────────────
const ALLOWED_FIELDS = [
  'name', 'phone', 'passport', 'cpf', 'address', 'cep', 'dob', 'email',
  'instagram', 'city', 'arrival', 'departure', 'pax', 'paxChildren',
  'companionList', 'hotel', 'source', 'nextDestination', 'emergency',
  'motivoViagem', 'geniLink'
];

const DATE_FIELDS = ['arrival', 'departure', 'dob'];

// ─── Schema Validation Layer ──────────────────────────────────────────────────
// Ensures AI response fields meet expected types before touching React state.
// This prevents dirty data (wrong types, labels embedded in values) from
// corrupting the bookingData object.
const sanitizeAIResponse = (aiResponse) => {
  const sanitized = {};

  ALLOWED_FIELDS.forEach(field => {
    let val = aiResponse[field];
    if (val === undefined || val === null) return;

    // Reject values that are just the field label echoed back
    if (typeof val === 'string') {
      const labelPatterns = [
        /^nome\s*completo/i, /^passaporte/i, /^cpf/i, /^endere[çc]o/i,
        /^cep/i, /^data\s*de/i, /^email/i, /^celular/i, /^instagram/i,
        /^cidade/i, /^hotel/i, /^motivo/i, /^como\s*conheceu/i,
        /^contato\s*de\s*emerg/i, /^pr[oó]ximo\s*destino/i,
        /^YYYY-MM-DD$/i
      ];
      if (labelPatterns.some(p => p.test(val.trim()))) return;
    }

    // Type coercion and cleanup per field
    if (DATE_FIELDS.includes(field)) {
      val = formatDateToISO(String(val));
      // Final guard: if still not ISO, discard
      if (val && !/^\d{4}-\d{2}-\d{2}$/.test(val)) val = '';
    } else if (field === 'name') {
      val = toTitleCase(String(val));
    } else if (field === 'pax' || field === 'paxChildren') {
      // Extract digits only
      const digits = String(val).replace(/\D/g, '');
      val = digits || (field === 'paxChildren' ? '0' : '');
    } else if (field === 'companionList') {
      if (!Array.isArray(val)) return;
      val = val.map(c => ({
        name: toTitleCase(String(c?.name || '')),
        doc: String(c?.doc || ''),
        dob: formatDateToISO(String(c?.dob || ''))
      }));
    } else if (field === 'phone') {
      // Keep only digits and leading +
      val = String(val).replace(/[^\d+]/g, '');
    } else {
      val = String(val).trim();
    }

    if (val !== '' && val !== undefined) {
      sanitized[field] = val;
    }
  });

  return sanitized;
};

// ─── Main Hook ────────────────────────────────────────────────────────────────

/**
 * useAIProcessor
 */
export const useAIProcessor = ({
  pricesDb,
  findProduct,
  bookingData,
  setBookingData,
  setStep,
  offlineMode = false,
}) => {
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const parseMessageOffline = useCallback((text) => {
    const nameMatch = text.match(/(?:nome|cliente|passageiro)[:\s]+([A-ZÀ-Ú][^\n,]+)/i);
    const paxMatch = text.match(/(\d+)\s*(?:adultos?|pax|pessoas?)/i);
    const chdMatch = text.match(/(\d+)\s*(?:crianças?|chd|menores?)/i);
    const phoneMatch = text.match(/(\+?\d[\d\s\-()]{8,}\d)/i);
    const arrivalMatch = text.match(/(?:chegada|entrada|check.?in)[:\s]+([^\n\r]+)/i);
    const departureMatch = text.match(/(?:saída|saida|partida|check.?out)[:\s]+([^\n\r]+)/i);
    const hotelMatch = text.match(/(?:hotel|hospedagem|alojamento)[:\s]+([^\n\r,]+)/i);

    return {
      name: toTitleCase(nameMatch?.[1]?.trim() || ''),
      pax: paxMatch?.[1] || '2',
      paxChildren: chdMatch?.[1] || '0',
      phone: phoneMatch?.[1]?.trim() || '',
      arrival: arrivalMatch?.[1]?.trim() || '',
      departure: departureMatch?.[1]?.trim() || '',
      hotel: hotelMatch?.[1]?.trim() || '',
      tours: []
    };
  }, []);

  const hydrateTour = useCallback((t) => {
    const dbMatch = findProduct(t.ID, t.Passeio);
    return {
      ...t,
      'Valor de venda (COP)': t.Valor_venda_COP || 0,
      'ENTRADA': t.ENTRADA || 0,
      'Preço custo (COP)': t.Preco_custo_COP || 0,
      Local: (dbMatch?.Local && dbMatch.Local !== '0') ? dbMatch.Local : (t.Local || ''),
      Hora: dbMatch?.Hora || t.Hora || '',
      Taxas_valor: dbMatch?.Taxas_valor ?? t.Taxas_valor ?? 0,
      Taxas_info: dbMatch?.Taxas_info || t.Taxas_info || '',
      voucher_obs: dbMatch?.voucher_obs || t.voucher_obs || '',
      uuid: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
      Cidade: t.Ciudad || 'Cartagena',
      date: formatDateToISO(t.date),
      hasVariableTime: dbMatch ? Boolean(dbMatch.hasVariableTime) : false,
    };
  }, [findProduct]);

  const processMessage = useCallback(async (rawMessage) => {
    if (!rawMessage || rawMessage.length < 10) {
      alert('Mensagem muito curta.');
      return;
    }

    if (offlineMode) {
      const parsed = parseMessageOffline(rawMessage);
      setBookingData(prev => ({ ...prev, ...parsed }));
      setStep(2);
      return;
    }

    setIsProcessingAI(true);
    try {
      const aiResponse = await parseWhatsAppMessageAI(rawMessage, pricesDb);
      console.log('[AI Parser] Raw AI response:', JSON.stringify(aiResponse, null, 2));
      const mappedTours = (aiResponse.tours || []).map(hydrateTour);
      // [BLOQUE 2] Schema validation layer replaces ad-hoc field-by-field cleanup
      const safeFields = sanitizeAIResponse(aiResponse);
      console.log('[AI Parser] Sanitized fields:', JSON.stringify(safeFields, null, 2));
      const newData = { ...bookingData, ...safeFields, tours: mappedTours };
      setBookingData(newData);
      if (newData.name) {
        // [REMEDIACIÓN 1.2] Silent Failure eliminado.
        // Si el guardado del contacto falla, el error se propaga hacia el catch externo
        // para alertar al usuario en lugar de ocultar la falla de red.
        await upsertContactSupabase({
          name:      newData.name,
          phone:     newData.phone,
          cpf:       newData.cpf,
          passport:  newData.passport,
          email:     newData.email,
          address:   newData.address,   // [NUEVO]
          cep:       newData.cep,        // [NUEVO]
          dob:       newData.dob,        // [NUEVO]
          city:      newData.city,       // [NUEVO]
          instagram: newData.instagram,  // [NUEVO]
        });
      }
      setStep(2);
    } catch (err) {
      console.error('Erro ao processar mensagem via Gemini:', err);
      alert('Erro ao processar a mensagem via IA. ' + err.message);
    } finally {
      setIsProcessingAI(false);
    }
  }, [offlineMode, parseMessageOffline, pricesDb, bookingData, setBookingData, setStep, hydrateTour]);

  const handleSmartUpdate = useCallback(async (notes) => {
    if (!notes || notes.trim() === '') {
      alert('A nota está vazia.');
      return;
    }
    setIsProcessingAI(true);
    try {
      const updates = await parseSmartNotesAI(notes, bookingData, pricesDb);
      if (Object.keys(updates).length > 0) {
        setBookingData(prev => ({ ...prev, ...updates }));
        const msg = updates.tours ? `Adicionado ${updates.tours.length} tour(s) e atualizado dados via IA!` : 'Dados atualizados via Smart Chat IA!';
        alert(msg);
      } else {
        alert('A IA não retornou atualizações.');
      }
    } catch (err) {
      console.error('Erro no Smart Chat via Gemini:', err);
      alert('Erro ao processar a nota via IA. ' + err.message);
    } finally {
      setIsProcessingAI(false);
    }
  }, [bookingData, pricesDb, setBookingData]);

  return {
    isProcessingAI,
    setIsProcessingAI,
    processMessage,
    handleSmartUpdate,
    hydrateTour,
  };
};
