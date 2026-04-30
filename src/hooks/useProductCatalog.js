import { useState, useEffect } from 'react';
import { getProductsFromSupabase, updateProductSupabase, saveProductSupabase } from '../supabase';
import { parsePriceUpdateAI } from '../gemini';

/**
 * Hook to manage the product catalog and exchange rates.
 * Extracted from App.jsx to reduce complexity.
 */
export const useProductCatalog = () => {
  const [pricesDb, setPricesDb] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [manualRate, setManualRate] = useState(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [priceUpdateText, setPriceUpdateText] = useState('');

  // Initial load
  useEffect(() => {
    // 1. Fetch Exchange Rate
    fetch('https://api.exchangerate-api.com/v4/latest/BRL')
      .then(res => res.json())
      .then(data => {
        if (data?.rates?.COP && !isNaN(data.rates.COP)) {
          setExchangeRate(data.rates.COP);
          setManualRate(data.rates.COP);
        } else {
          console.warn('Exchange rate API returned unexpected data:', data);
        }
      })
      .catch(err => console.error("Error fetching rates:", err));

    // 2. Load products from Supabase
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await getProductsFromSupabase();
    if (data.length > 0) {
      // Alphabetical sort by Passeio or name
      const sorted = data.sort((a, b) => {
        const nameA = (a.Passeio || a.name || '').toLowerCase();
        const nameB = (b.Passeio || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }).map(p => ({ ...p, uuid: p.uuid || Math.random().toString(36).substring(2, 9) }));
      
      setPricesDb(sorted);
      console.log(`[useProductCatalog] Loaded ${sorted.length} sorted products from Supabase ✅`);
    } else {
      console.warn('[useProductCatalog] Supabase returned 0 products.');
    }
  };

  /**
   * Handle AI-driven price updates in the catalog.
   */
  const handleAIPriceUpdate = async () => {
    if (!priceUpdateText || priceUpdateText.trim() === '') {
      alert('Texto vazio.');
      return;
    }

    setIsProcessingAI(true);
    try {
      const response = await parsePriceUpdateAI(priceUpdateText, pricesDb);
      console.log("Gemini Price Update Result:", response);

      if (response && response.updates && response.updates.length > 0) {
        let updateCount = 0;
        const newPrices = [...pricesDb];

        response.updates.forEach(update => {
          const idx = newPrices.findIndex(p => 
            (p.id && update.id && p.id === update.id) || 
            (p.Passeio || '').toLowerCase() === (update.Passeio || '').toLowerCase()
          );

          if (idx !== -1) {
            newPrices[idx] = {
              ...newPrices[idx],
              Valor_venda_COP: update.Valor_venda_COP || newPrices[idx].Valor_venda_COP,
              ENTRADA: update.ENTRADA !== undefined ? update.ENTRADA : newPrices[idx].ENTRADA,
              Preco_custo_COP: update.Preco_custo_COP !== undefined ? update.Preco_custo_COP : newPrices[idx].Preco_custo_COP
            };
            updateCount++;
          } else if (update.Valor_venda_COP > 0) {
            newPrices.push({
              Passeio: update.Passeio,
              Valor_venda_COP: update.Valor_venda_COP || 0,
              ENTRADA: update.ENTRADA || 0,
              Preco_custo_COP: update.Preco_custo_COP || 0,
              Ciudad: 'Cartagena',
              Local: '', 
              Hora: '', 
              Taxas_valor: 0,
              id: null,
              uuid: Math.random().toString(36).substring(2, 9)
            });
            updateCount++;
          }
        });

        setPricesDb(newPrices);
        alert(`IA processou com sucesso e atualizou ${updateCount} passeios. Clique em 'Salvar Alterações' para persistir no banco.`);
        setPriceUpdateText('');
      } else {
        alert('A IA não detectou atualizaciones explícitas no texto.');
      }
    } catch (err) {
      console.error('Erro ao processar preços via IA:', err);
      alert('Erro na IA: ' + err.message);
    } finally {
      setIsProcessingAI(false);
    }
  };

  /**
   * Sync bookingData with pricesDb updates (e.g. from Settings).
   * This ensures that if a product is updated in the catalog, it reflects in the current booking.
   */
  const syncBookingWithCatalog = (bookingData, setBookingData) => {
    if (bookingData.tours && bookingData.tours.length > 0) {
      let changed = false;
      const newTours = bookingData.tours.map(tour => {
        const updatedDbTour = pricesDb.find(dbTour => (dbTour.id === tour.id) || (dbTour.Passeio === tour.Passeio));
        if (updatedDbTour) {
          if (
            tour.Local !== updatedDbTour.Local ||
            tour.meet_point !== updatedDbTour.meet_point ||
            tour.Hora !== updatedDbTour.Hora ||
            tour.time !== updatedDbTour.time ||
            tour.Taxas_valor !== updatedDbTour.Taxas_valor ||
            tour.Taxas_info !== updatedDbTour.Taxas_info ||
            tour.voucher_obs !== updatedDbTour.voucher_obs
          ) {
            changed = true;
            return {
              ...tour,
              Local: updatedDbTour.Local,
              meet_point: updatedDbTour.meet_point,
              Hora: updatedDbTour.Hora,
              time: updatedDbTour.time,
              Taxas_valor: updatedDbTour.Taxas_valor,
              Taxas_info: updatedDbTour.Taxas_info,
              fees_value: updatedDbTour.Taxas_valor, 
              fees_info: updatedDbTour.Taxas_info,
              voucher_obs: updatedDbTour.voucher_obs
            };
          }
        }
        return tour;
      });
      if (changed) {
        setBookingData(prev => ({ ...prev, tours: newTours }));
      }
    }
  };

  return {
    pricesDb,
    setPricesDb,
    exchangeRate,
    setExchangeRate,
    manualRate,
    setManualRate,
    isProcessingAI,
    setIsProcessingAI,
    priceUpdateText,
    setPriceUpdateText,
    handleAIPriceUpdate,
    loadProducts,
    syncBookingWithCatalog
  };
};
