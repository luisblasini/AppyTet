import { useState, useMemo } from 'react';
import { formatCurrency, formatDateDisplay } from '../utils/formatters';

export const useBookingTotals = (bookingData, pricesDb, exchangeRate, manualRate) => {
  const [paymentMethod, setPaymentMethod] = useState('entrada_saldo');
  const [wiseMarkup, setWiseMarkup] = useState(6);       // % markup, updated tracking as per standard
  const [financialOverrides, setFinancialOverrides] = useState({});  // direct overrides: {totalCOP, entradaBRL, saldoCOP, totalBRL}

  const totals = useMemo(() => {
    const globalAdults = parseInt(bookingData.pax) || 0;
    const globalChildren = parseInt(bookingData.paxChildren) || 0;
    const globalTotalPax = globalAdults + globalChildren;

    let rawTotalCOP = 0;
    let rawEntradaCOP = 0;

    const calculatedTours = (bookingData.tours || []).map(tour => {
      const tourName = (tour.Passeio || tour.name || '').toLowerCase();
      const tourId = tour.ID || tour.id;

      // --- PAX LOGIC ---
      let tourPax = (tour.paxOverride !== undefined && tour.paxOverride !== '')
        ? parseInt(tour.paxOverride)
        : globalTotalPax;
      
      const originalPax = tourPax; // Keep track of people for messaging

      // Transfers and private boats are billed per service, not per person
      if (
        tourName.includes('transfer') ||
        tourName.includes('lancha privada') ||
        tourName.includes('sunset lancha')
      ) {
        tourPax = 1;
      }

      // --- PRICE NORMALIZATION: bridge v4 DB keys to UI keys ---
      const baseSale = tour['Valor de venda (COP)'] !== undefined
        ? tour['Valor de venda (COP)']
        : (tour.Valor_venda_COP || tour.price_sale || 0);
      const baseEntry = tour['ENTRADA'] !== undefined
        ? tour['ENTRADA']
        : (tour.price_entry || 0);

      let salePrice = baseSale;
      let entryPrice = baseEntry;
      let costPrice = baseSale - baseEntry;
      // --- WALKING TOUR DYNAMIC PRICING (Hernán PROD-119 / Andrés PROD-120) ---
      if (
        tourId === 'PROD-119' || tourId === 'PROD-120' ||
        tourName.includes('walking tour')
      ) {
        const isHernan = tourId === 'PROD-119' || tourName.includes('hernan');
        const isAndres = tourId === 'PROD-120' || tourName.includes('andres');
        const count = tourPax;

        // Sale Price (portfolio total)
        let totalVenta = 0;
        if (count === 1) totalVenta = 500000;
        else if (count === 2) totalVenta = 325000 * count;
        else if (count === 3) totalVenta = 300000 * count;
        else if (count === 4) totalVenta = 330000 * count;
        else totalVenta = 310000 * count;

        // Cost components
        const costoCastillo = 38000 * count;
        const costoAgua = 10000 * count;
        const costoTransporte = count <= 3 ? 30000 : 264000;

        let costoGuianza = 0;
        if (isHernan) {
          if (count <= 4) costoGuianza = 320000;
          else if (count <= 7) costoGuianza = 600000;
          else if (count <= 15) costoGuianza = 900000;
          else costoGuianza = 1200000;
        } else if (isAndres) {
          if (count <= 2) costoGuianza = 300000;
          else if (count <= 4) costoGuianza = 400000;
          else if (count <= 6) costoGuianza = 600000;
          else if (count <= 15) costoGuianza = 900000;
          else costoGuianza = 1200000;
        } else {
          costoGuianza = 320000;
        }

        const totalCosto = costoGuianza + costoCastillo + costoAgua + costoTransporte;
        salePrice = totalVenta;
        entryPrice = totalVenta - totalCosto;
        costPrice = totalCosto;
        tourPax = 1; // billed as a single service block
      }

      if (tour.saldoEmEntrada) {
        entryPrice = salePrice;
      }

      const rowTotal = salePrice * tourPax;
      const rowEntry = entryPrice * tourPax;
      const rowCost = costPrice * tourPax;

      rawTotalCOP += rowTotal;
      rawEntradaCOP += rowEntry;

      return {
        ...tour,
        calculatedSale: rowTotal,
        calculatedEntry: rowEntry,
        calculatedCost: rowCost,
        tourPaxUsed: tourPax,
        originalPax: originalPax
      };
    });

    // 1. Hierarchy: Override Total overrides raw sums before doing math.
    const baseTotalForDiscounts = financialOverrides.totalCOP !== undefined ? financialOverrides.totalCOP : rawTotalCOP;

    // Calculate discount over base Total
    const isPercent = String(bookingData.discountType || 'PERCENT').toUpperCase() === 'PERCENT';
    const discountAmount = bookingData.discountValue > 0
      ? (isPercent ? (baseTotalForDiscounts * bookingData.discountValue / 100) : bookingData.discountValue)
      : 0;

    // Apply Waterfall Logic
    const totalCOPFinal = baseTotalForDiscounts - discountAmount;
    
    // Protect Entry: Don't go negative. If discount > entry, entry becomes 0.
    const entradaCOPFinal = Math.max(0, rawEntradaCOP - discountAmount);
    
    // Remaining discount overflows to Saldo
    const residualDiscount = discountAmount > rawEntradaCOP ? (discountAmount - rawEntradaCOP) : 0;
    
    // Base Saldo is Total - Entrada, then we subtract the rest of the discount if applicable.
    // Also protect the saldo from going negative.
    const saldoBase = baseTotalForDiscounts - rawEntradaCOP;
    const saldoCOP = Math.max(0, saldoBase - residualDiscount);

    // Apply Exchange Multipliers
    const multiplier = 1 + (wiseMarkup / 100);
    const effectiveRate = manualRate > 0 ? manualRate : (exchangeRate || 0);
    // FIX: Use parseFloat + toFixed(2) to preserve BRL decimal cents
    const totalBRL = effectiveRate > 0 ? parseFloat(((totalCOPFinal / effectiveRate) * multiplier).toFixed(2)) : 0;
    const entradaBRL = effectiveRate > 0 ? parseFloat(((entradaCOPFinal / effectiveRate) * multiplier).toFixed(2)) : 0;

    return {
      totalCOP: totalCOPFinal,
      entradaCOP: entradaCOPFinal,
      saldoCOP,
      totalBRL,
      entradaBRL,
      discountAmount,
      paxCount: globalTotalPax,
      calculatedTours
    };
  }, [bookingData, pricesDb, exchangeRate, wiseMarkup, manualRate, financialOverrides]);

  // --- WHATSAPP MESSAGE
  const generateWhatsAppMessage = () => {
    const today = new Date().toLocaleDateString('pt-BR');
    const paxCount = totals.paxCount || 1;
    const isQuotation = financialOverrides?.isQuotation === true;

    // For messaging, prioritize manual overrides, fallback to calculated totals
    const effectiveTotalCOP = financialOverrides.totalCOP !== undefined ? financialOverrides.totalCOP : totals.totalCOP;
    const effectiveTotalBRL = financialOverrides.totalBRL !== undefined ? financialOverrides.totalBRL : totals.totalBRL;
    const effectiveEntradaBRL = financialOverrides.entradaBRL !== undefined ? financialOverrides.entradaBRL : totals.entradaBRL;
    const effectiveSaldoCOP = financialOverrides.saldoCOP !== undefined ? financialOverrides.saldoCOP : totals.saldoCOP;

    if (isQuotation) {
      // --- MODE: QUOTATION (New Format) ---
      let message = `COTAÇÃO The Experience Travel\n\n`;
      
      (totals.calculatedTours || []).forEach((tour, idx) => {
        let tourName = tour.Passeio || tour.name;
        tourName = tourName.replace(/plan arrecife/gi, '').replace(/arrecife de/gi, '').replace(/arrecife/gi, '').trim();
        // Use originalPax for display (real people), fallback to paxCount, floor at 1 to prevent NaN/Infinity
        const rawPax = tour.originalPax !== undefined ? tour.originalPax : (tour.tourPaxUsed !== undefined ? tour.tourPaxUsed : paxCount);
        const pax = Math.max(1, parseInt(rawPax) || 1);
        // Subtotal relies directly on hook calculated value, avoids compounding
        const subtotal = tour.calculatedSale || 0;
        // Derive unit price dynamically from subtotal to handle block-pricing (like walking tours)
        const unitPrice = pax > 0 ? (subtotal / pax) : subtotal;
        
        message += `${idx + 1}. ${tourName}\n`;
        if (unitPrice === 0 && subtotal === 0) {
          message += `   Valor: PAGO\n`;
        } else {
          message += `   Valor: ${formatCurrency(unitPrice, 'COP')} x ${pax} = ${formatCurrency(subtotal, 'COP')}\n`;
        }
      });

      message += `\n`; // Spacer
      
      const hasDiscount = totals.discountAmount > 0;
      const grossTotalCOP = effectiveTotalCOP + totals.discountAmount;

      if (hasDiscount) {
        message += `Valor Total (sem desconto): ${formatCurrency(grossTotalCOP, 'COP')}\n`;
        message += `Desconto: -${formatCurrency(totals.discountAmount, 'COP')}\n`;
        message += `Valor Final com desconto: ${formatCurrency(effectiveTotalCOP, 'COP')} para ${paxCount} ${paxCount > 1 ? 'pessoas' : 'pessoa'}\n`;
      } else {
        message += `Valor Total: ${formatCurrency(effectiveTotalCOP, 'COP')} para ${paxCount} ${paxCount > 1 ? 'pessoas' : 'pessoa'}\n`;
      }
      
      if (paymentMethod === 'total_pix') {
        message += `Pagamento Integral (PIX): ${formatCurrency(effectiveTotalCOP, 'COP')} = ${formatCurrency(effectiveTotalBRL, 'BRL')} via pix no câmbio de ${today}\n`;
      } else {
        message += `Entrada: ${formatCurrency(totals.entradaCOP, 'COP')} = ${formatCurrency(effectiveEntradaBRL, 'BRL')} via pix no câmbio de ${today}\n`;
        message += `Saldo: ${formatCurrency(effectiveSaldoCOP, 'COP')} (+ taxas) via link no cartão\n`;
      }
      
      message += `\nEsta cotação é válida por 24h. Reserva sujeita a disponibilidade.`;
      
      return message;
    }

    // --- MODE: RESERVATION (New Format) ---
    let message = `*Forma de Pagamento*\n`;
    const hasDiscount = totals.discountAmount > 0;
    const grossTotalCOP = effectiveTotalCOP + totals.discountAmount;

    if (hasDiscount) {
      message += `Valor Total: ${formatCurrency(grossTotalCOP, 'COP')}\n`;
      message += `Desconto: -${formatCurrency(totals.discountAmount, 'COP')}\n`;
      message += `Valor Final com desconto: ${formatCurrency(effectiveTotalCOP, 'COP')} para ${paxCount} ${paxCount > 1 ? 'pessoas' : 'pessoa'}\n`;
    } else {
      message += `Valor Total: ${formatCurrency(effectiveTotalCOP, 'COP')} para ${paxCount} ${paxCount > 1 ? 'pessoas' : 'pessoa'}\n`;
    }

    if (paymentMethod === 'total_pix') {
      message += `Pagamento Integral (PIX): ${formatCurrency(effectiveTotalCOP, 'COP')} = ${formatCurrency(effectiveTotalBRL, 'BRL')} via pix no câmbio de ${today}\n`;
    } else {
      message += `Entrada: ${formatCurrency(totals.entradaCOP, 'COP')} = ${formatCurrency(effectiveEntradaBRL, 'BRL')} via pix no câmbio de ${today}\n`;
      message += `Saldo: ${formatCurrency(effectiveSaldoCOP, 'COP')} (+ taxas) via link no cartão\n`;
    }

    message += `\n*Dados para depósito da entrada*\n`;
    if (paymentMethod === 'total_pix') message = message.replace('*Dados para depósito da entrada*', '*Dados para depósito*');
    
    message += `Banco Inter\n`;
    message += `Juliana Rotta 3 Experience Travel\n`;
    message += `Pix CNPJ: 14.909.728.0001/45`;

    return message;
  };


  return {
    paymentMethod,
    setPaymentMethod,
    wiseMarkup,
    setWiseMarkup,
    financialOverrides,
    setFinancialOverrides,
    totals,
    generateWhatsAppMessage
  };
};
