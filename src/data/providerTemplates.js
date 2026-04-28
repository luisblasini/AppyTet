/**
 * Templates para mensagens automáticas aos fornecedores via WhatsApp.
 * 
 * REGLAS:
 * - Solo se muestra el SALDO que el proveedor tiene que cobrar (no total ni entrada)
 * - Para Rosario de Mar: saldo = valor total (pagan 100% al proveedor, la entrada ya es un pago previo de la agencia)
 * - El teléfono y web siempre son de la agencia
 */

const AGENCY_PHONE  = '(+55) 11 981758504';
const AGENCY_WEB    = 'www.thexperiencetravel.com';

const getPax = (data, tour) =>
  parseInt(tour.paxOverride) || (parseInt(data.pax || 0) + parseInt(data.paxChildren || 0));

const formatCOP = (val) =>
  Math.round(val).toLocaleString('es-CO');

const formatCustomDate = (dateStr) => {
  if (!dateStr || dateStr.toLowerCase() === 'a definir') return 'A definir';
  
  // Asume formato de entrada YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parts[0], parseInt(parts[1]) - 1, parts[2]);
    const day = String(d.getDate()).padStart(2, '0');
    // Meses en mayuscula inicial (Ej: Ene, Feb, Mar)
    const month = d.toLocaleString('es-CO', { month: 'short' }).charAt(0).toUpperCase() + d.toLocaleString('es-CO', { month: 'short' }).slice(1).replace('.', '');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

// Title Case helper
const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s|-|\/|\()(\w)/g, (_, c) => _.replace(c, c.toUpperCase()));
};

export const providerTemplates = {
  // Rosario de Mar
  'rosario de mar': (data, tour) => {
    const pax    = getPax(data, tour);
    const venda  = tour.Valor_venda_COP || tour['Valor de venda (COP)'] || 0;
    const entr   = tour.ENTRADA || tour['ENTRADA'] || 0;
    const custo  = (tour.Preco_custo_COP && tour.Preco_custo_COP > 0) ? tour.Preco_custo_COP : (venda - entr);
    const repasse = custo * pax; 
    const plan   = (tour.Descricao || tour.Passeio || 'arrecife').toLowerCase();
    
    return `*ROSÁRIO DE MAR*
📅 *Fecha uso:* ${formatCustomDate(tour.date)}
✅ *Plan:* ${plan}
✅ *Titular reserva:* ${toTitleCase(data.name)}
✅ *ID titular:* ${data.passport || data.cpf || '—'}
✅ *Celular:* ${AGENCY_PHONE}
✅ *N° Pax:* ${String(pax).padStart(2, '0')}
✅ *Agencia:* The Experience Travel
✅ *Vendedor:* The Experience Travel
✅ *Saldo a pagar:* COP ${formatCOP(repasse)}
✅ *Observaciones:* ${data.voucherObservations || ''}

📞 ${AGENCY_PHONE} | ${AGENCY_WEB}`;
  },

  // Capri
  'capri': (data, tour) => {
    const pax = getPax(data, tour);
    const venda  = tour.Valor_venda_COP || tour['Valor de venda (COP)'] || 0;
    const entr   = tour.ENTRADA || tour['ENTRADA'] || 0;
    const custo  = (tour.Preco_custo_COP && tour.Preco_custo_COP > 0) ? tour.Preco_custo_COP : (venda - entr);
    const repasse = custo * pax;

    return `${toTitleCase(data.name)} - ${String(pax).padStart(2, '0')} pax
${toTitleCase(tour.Passeio)} - ${formatCustomDate(tour.date)}
Saldo COP ${formatCOP(repasse)}`;
  },

  // Fenix
  'fenix': (data, tour) => handleFenix(data, tour),

  // Pago 100% anticipado (Bora Bora, Pau'e, Top 3)
  'bora bora': (data, tour) => handlePrepaid(data, tour),
  'paue': (data, tour) => handlePrepaid(data, tour),
  'pau´e': (data, tour) => handlePrepaid(data, tour),
  'top 3': (data, tour) => handlePrepaid(data, tour),

  // Alondra (Transfers y Aviario) - Pago a fin de mes
  'alondra': (data, tour) => handleAlondra(data, tour),
  'transfer': (data, tour) => handleAlondra(data, tour),
  'aviario': (data, tour) => handleAlondra(data, tour),

  // Template genérico
  'default': (data, tour) => {
    const pax     = getPax(data, tour);
    const venda   = tour.Valor_venda_COP || tour['Valor de venda (COP)'] || 0;
    const entr    = tour.ENTRADA || tour['ENTRADA'] || 0;
    const custo   = (tour.Preco_custo_COP && tour.Preco_custo_COP > 0) ? tour.Preco_custo_COP : (venda - entr);
    const repasse = custo * pax;
    
    return `*RESERVA: ${(tour.Passeio || '').toUpperCase()}*
📅 *Data:* ${formatCustomDate(tour.date)}
✅ *Titular:* ${toTitleCase(data.name)}
✅ *ID titular:* ${data.passport || data.cpf || '—'}
✅ *Celular:* ${AGENCY_PHONE}
✅ *N° Pax:* ${String(pax).padStart(2, '0')}
✅ *Agencia:* The Experience Travel
✅ *Saldo a pagar:* COP ${formatCOP(repasse)}
✅ *Observaciones:* ${data.voucherObservations || ''}

📞 ${AGENCY_PHONE} | ${AGENCY_WEB}`;
  },
};

// --- Helpers Específicos ---

function handlePrepaid(data, tour) {
  const pax = getPax(data, tour);
  const adults = parseInt(data.pax || 0);
  const kids = parseInt(data.paxChildren || 0);
  
  const venda  = tour.Valor_venda_COP || tour['Valor de venda (COP)'] || 0;
  const entr   = tour.ENTRADA || tour['ENTRADA'] || 0;
  const custo  = (tour.Preco_custo_COP && tour.Preco_custo_COP > 0) ? tour.Preco_custo_COP : (venda - entr);
  const repasse = custo * pax;

  return `DATOS DE RESERVA

- Fecha de reserva: ${formatCustomDate(tour.date)}
- Titular de la reserva: ${toTitleCase(data.name)}
- Total adultos: ${adults}
- *Total niños:* ${kids}
- *Total infantes:* 0
- Abono: COP ${formatCOP(repasse)}
- Agencia: The Experience Travel 
- Comentarios adicionales: ${data.voucherObservations || ''}
- Nombre de los acompañantes: ${data.companionList?.map(c => c.name).join(', ') || ''}`;
}

function handleFenix(data, tour) {
  const pax = getPax(data, tour);
  const venda  = tour.Valor_venda_COP || tour['Valor de venda (COP)'] || 0;
  const entr   = tour.ENTRADA || tour['ENTRADA'] || 0;
  const custo  = (tour.Preco_custo_COP && tour.Preco_custo_COP > 0) ? tour.Preco_custo_COP : (venda - entr);
  const repasse = custo * pax;

  let saldoText = formatCOP(repasse);

  // Buscar si la reserva tiene otro "tour" que sea una decoracion de fenix o paquete ninho
  // y que no sea este mismo item.
  const decorTours = (data.tours || []).filter(t => 
    t !== tour && 
    (t.Passeio || '').toLowerCase().includes('fenix') && 
    ((t.Passeio || '').toLowerCase().includes('decor') || (t.Descricao || '').toLowerCase().includes('decor') || (t.Passeio || '').toLowerCase().includes('nin') || (t.Descricao || '').toLowerCase().includes('nin'))
  );
  
  if (decorTours.length > 0) {
    const dTour = decorTours[0];
    const dPax = getPax(data, dTour);
    const dVenda = dTour.Valor_venda_COP || dTour['Valor de venda (COP)'] || 0;
    const dEntr = dTour.ENTRADA || dTour['ENTRADA'] || 0;
    const dCusto = (dTour.Preco_custo_COP && dTour.Preco_custo_COP > 0) ? dTour.Preco_custo_COP : (dVenda - dEntr);
    saldoText += ` + ${formatCOP(dCusto * dPax)}`;
  }

  return `1. Nombre y apellido del titular de la reserva: ${toTitleCase(data.name)}
2. Cédula o ID: ${data.passport || data.cpf || '—'}
3. Fecha de Pasadía o Cena en la Isla: ${tour.Passeio}
4. Numero de personas: ${pax}
5. Hora del tour: ${tour.time || tour.Hora || '—'}
6. Correo electronico de la agencia, hotel o vendedor: info@thexperiencetravel.com
7. Nombre de agencia, hotel o vendedor: The Experience Travel
8. Contacto de celular del cliente: ${AGENCY_PHONE}
9. Abono: 
10. Saldo: ${saldoText}
11. Fecha de Pasadía o Cena en la Isla: ${formatCustomDate(tour.date)}`;
}

function handleAlondra(data, tour) {
  // Para Alondra pasamos el numero REAL de personas en el whatsapp (aunque el voucher cobre 1 transfer completo)
  // El costo total en BD para transfers suele estar seteado a nivel de 1 pax (precio total del vehiculo). 
  // OJO: Si el pax (personas fisicas) es mayor a 1, no debemos multiplicar el costo del *vehiculo* por personas.
  // Solo aplicamos multiplicador si no es un transfer cerrado.
  
  const isTransfer = (tour.Passeio || '').toLowerCase().includes('transfer');
  
  // Real PAX num for message
  const realPax = parseInt(data.pax || 0) + parseInt(data.paxChildren || 0);
  // Default to 1 if missing
  const paxToShow = realPax > 0 ? realPax : 1; 

  const venda  = tour.Valor_venda_COP || tour['Valor de venda (COP)'] || 0;
  const entr   = tour.ENTRADA || tour['ENTRADA'] || 0;
  const custo  = (tour.Preco_custo_COP && tour.Preco_custo_COP > 0) ? tour.Preco_custo_COP : (venda - entr);
  
  // Para transfers el costo ya es por el vehiculo total. Para aviario, depende si es por persona.
  const billingPax = isTransfer ? 1 : getPax(data, tour); 
  const repasse = custo * billingPax;

  return `*RESERVA: ${(tour.Passeio || '').toUpperCase()}*
📅 *Data:* ${formatCustomDate(tour.date)}
✅ *Titular:* ${toTitleCase(data.name)}
✅ *Celular:* ${AGENCY_PHONE}
✅ *Horario:* ${tour.Hora || '—'}
✅ *Hotel:* ${data.hotel || '—'}
✅ *Actividad:* ${toTitleCase(tour.Passeio)}
✅ *N° Pax:* ${paxToShow}
✅ *Acompañantes:* ${data.companionList?.map(c => c.name).join(', ') || '—'}
✅ *Agencia:* The Experience Travel
✅ *Saldo a pagar:* COP ${formatCOP(repasse)}
✅ *Estado:* Pendiente`;
}

export const getProviderMessage = (tourName, data, tour) => {
  const key = (tourName || '').toLowerCase();
  const foundKey = Object.keys(providerTemplates).find(k => key.includes(k));
  const templateFn = providerTemplates[foundKey] || providerTemplates['default'];
  return templateFn(data, tour);
};
