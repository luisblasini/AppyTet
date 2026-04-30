import { useState } from 'react';
import { saveBookingSupabase, deleteConfirmationSupabase, getConfirmationsFromSupabase, updateProductSupabase, saveProductSupabase } from '../supabase';

/**
 * Hook to handle saving and deleting bookings in Supabase.
 * Extracted from App.jsx to improve maintainability.
 */
export const useBookingPersistence = ({
  bookingData,
  setBookingData,
  pricesDb,
  totals,
  paymentMethod,
  notes,
  setHistoryData,
  setLoadingTab
}) => {
  const [isSavingData, setIsSavingData] = useState(false);

  /**
   * Sanitizes the payload for Supabase.
   */
  const sanitizePayload = (obj) => {
    return JSON.parse(JSON.stringify(obj, (key, value) => {
      if (typeof value === 'number' && isNaN(value)) return 0;
      if (value === undefined) return null;
      return value;
    }));
  };

  /**
   * Main function to save booking data and optionally update the product catalog.
   */
  const handleSaveData = async () => {
    if (isSavingData) return;
    setIsSavingData(true);

    try {
      // 1. Identify Price Changes or New Products for Catalog update
      const productsToUpdate = [];
      const newProductsToSave = [];

      for (const tour of bookingData.tours) {
        const original = pricesDb.find(p => (p.Passeio || '').toLowerCase() === (tour.Passeio || '').toLowerCase());

        if (original) {
          const hasVendaDiff = tour['Valor de venda (COP)'] !== original.Valor_venda_COP;
          const hasEntradaDiff = tour['ENTRADA'] !== original.ENTRADA;

          if (hasVendaDiff || hasEntradaDiff) {
            productsToUpdate.push({
              id: original.id,
              name: tour.Passeio,
              oldVenda: original.Valor_venda_COP,
              newVenda: tour['Valor de venda (COP)'],
              oldEntrada: original.ENTRADA,
              newEntrada: tour['ENTRADA']
            });
          }
        } else {
          newProductsToSave.push(tour);
        }
      }

      // 2. Prepare and Save Booking to Supabase
      const finalCompanions = (bookingData.companionList && bookingData.companionList.length > 0)
        ? bookingData.companionList.map(c => `${c.name || ''} ${c.doc ? `(${c.doc})` : ''}`).filter(b => b.trim() !== '').join('\n')
        : bookingData.companions;

      const cleanData = sanitizePayload({
        ...bookingData,
        contact: {
          name: bookingData.name,
          phone: bookingData.phone,
          cpf: bookingData.cpf,
          email: bookingData.email,
          passport: bookingData.passport,
          address: bookingData.address,
          cep: bookingData.cep,
          dob: bookingData.dob,
          instagram: bookingData.instagram,
          city: bookingData.city,
          source: bookingData.source,
          emergency: bookingData.emergency,
          motivoViagem: bookingData.motivoViagem,
          nextDestination: bookingData.nextDestination
        },
        companions: finalCompanions,
        totals,
        paymentMethod,
        notes,
        status: 'confirmed'
      });

      const savedBookingId = await saveBookingSupabase(cleanData);
      
      // Update local state to include ID if it was a new booking
      if (savedBookingId && !bookingData.id) {
        setBookingData(prev => ({ ...prev, id: savedBookingId }));
      }

      // Refresh history data
      const updatedHistory = await getConfirmationsFromSupabase(20);
      setHistoryData(updatedHistory);

      console.log(`✅ Reserva ${bookingData.id ? 'atualizada' : 'salva'} com sucesso! ID: ${savedBookingId || bookingData.id}`);

      // 3. Catalog Update (Synchronous instead of setTimeout)
      if (productsToUpdate.length > 0) {
        const updateNames = productsToUpdate.map(p => p.name).join(', ');
        if (window.confirm(`Detectamos mudanças de preços em: ${updateNames}.\n\nDeseja atualizar o Catálogo Master com esses novos valores?`)) {
          for (const p of productsToUpdate) {
            await updateProductSupabase(p.id, { 
              Passeio: p.name,
              Valor_venda_COP: p.newVenda, 
              ENTRADA: p.newEntrada 
            });
          }
          alert('Catálogo atualizado!');
        }
      }

      if (newProductsToSave.length > 0) {
        const newNames = newProductsToSave.map(p => p.Passeio).join(', ');
        if (window.confirm(`Novos produtos detectados: ${newNames}.\n\nDeseja salvá-los no Catálogo Master?`)) {
          for (const p of newProductsToSave) {
            const productToSave = {
              ...p,
              Passeio: p.Passeio,
              Valor_venda_COP: p['Valor de venda (COP)'],
              ENTRADA: p['ENTRADA'],
              Preco_custo_COP: p['Preço custo (COP)'] || p.Preco_custo_COP
            };
            await saveProductSupabase(productToSave);
          }
          alert('Novos produtos adicionados ao catálogo!');
        }
      }

    } catch (err) {
      console.error('[useBookingPersistence] Save Error:', err);
      alert('Erro ao salvar no banco de dados. Verifique sua conexão.');
    } finally {
      setIsSavingData(false);
    }
  };

  /**
   * Handle deletion of a booking.
   */
  const handleDeleteConfirmation = async (id) => {
    if (window.confirm('Deseja excluir esta confirmação permanentemente?')) {
      setLoadingTab(true);
      try {
        await deleteConfirmationSupabase(id);
        const data = await getConfirmationsFromSupabase(20);
        setHistoryData(data);
      } catch (err) {
        alert('Erro al eliminar: ' + err.message);
      } finally {
        setLoadingTab(false);
      }
    }
  };

  return {
    isSavingData,
    handleSaveData,
    handleDeleteConfirmation
  };
};
