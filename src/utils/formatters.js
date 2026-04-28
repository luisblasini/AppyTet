export const formatCOP = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const num = Math.floor(val);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return 'A definir';
  // Already DD/MM/YYYY or DD/MM
  if (/^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/.test(dateStr)) {
    const parts = dateStr.split('/');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2] || new Date().getFullYear();
    return `${d}/${m}/${y}`;
  }
  // ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [y, m, d] = dateStr.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }
  // Try Date parse
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, '0');
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}/${parsed.getFullYear()}`;
  }
  return dateStr;
};

export const formatCurrency = (amount, currency = 'COP') => {
    if (amount === undefined || amount === null || isNaN(amount)) return '0';
    if (currency === 'BRL') {
        const num = Number(amount);
        return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    const formatted = Math.floor(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${currency} ${formatted}`;
};

export const formatDateISO = (dateStr) => {
  if (!dateStr) return '';
  // If already ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.split('T')[0];
  
  // If DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dateStr)) {
    const parts = dateStr.split('/');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${y}-${m}-${d}`;
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};
export const toTitleCase = (str) => {
  if (!str || typeof str !== 'string') return '';
  const prepositions = ['de', 'da', 'do', 'dos', 'das', 'e'];
  return str
    .toLowerCase()
    .split(' ')
    .filter(w => w.length > 0)
    .map((word, index) => {
      if (index > 0 && prepositions.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};
