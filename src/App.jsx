import React, { useState, useEffect } from 'react';
import './index.css';
import { Copy, Check, Plane, DollarSign, Calendar, MessageSquare, Plus, Trash2, Download, Settings, Users, History, FileText, Send, GripVertical, Calculator } from 'lucide-react';
// import productsUnified from './data/products_unified.json'; // DEPRECATED: Supabase is the source of truth
import {
  cleanDuplicateProducts,
  cleanDuplicateContacts,
  deleteContact
} from './db'; // Mantenemos solo las funciones de utilidad que aún no hemos migrado

import logo from './assets/logo.png';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { parsePriceUpdateAI, getGeminiKey, setGeminiKey } from './gemini';
import { getProviderMessage } from './data/providerTemplates';
import { 
  getProductsFromSupabase, updateProductSupabase, saveProductSupabase, deleteProductSupabase,
  saveBookingSupabase, getContactsFromSupabase, getConfirmationsFromSupabase, deleteConfirmationSupabase
} from './supabase';

// Modular Components & Utils
import HistoryDashboard from './components/HistoryDashboard';
import ContactsDashboard from './components/ContactsDashboard';
import FinanceDashboard from './components/FinanceDashboard';
import SettingsDashboard from './components/SettingsDashboard';
import SortableTourRow from './components/SortableTourRow';
import PassengerForm from './components/PassengerForm';
import BookingDetails from './components/BookingDetails';
import VoucherPreview from './components/VoucherPreview';
import { useBookingTotals } from './hooks/useBookingTotals';
import { usePricesMap } from './hooks/usePricesMap';
import { useAIProcessor } from './hooks/useAIProcessor';
import { formatCOP, formatDateDisplay, formatCurrency, toTitleCase } from './utils/formatters';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


const INITIAL_BOOKING_STATE = {
  name: '',
  passport: '',
  cpf: '',
  address: '',
  cep: '',
  dob: '',
  email: '',
  phone: '',
  instagram: '',
  city: '',
  arrival: '',
  departure: '',
  pax: '',
  paxChildren: '',
  companions: '',
  hotel: '',
  source: '',
  nextDestination: '',
  emergency: '',
  motivoViagem: '',
  geniLink: '',
  voucherObservations: '',
  discountValue: 0,
  discountType: 'PERCENT', // or 'COP'
  childAges: [],
  companionList: [],
  tours: []
};


const App = () => {
  const [activeTab, setActiveTab] = useState('booking'); // booking, history, contacts, settings
  const [step, setStep] = useState(1);
  const [rawMessage, setRawMessage] = useState('');
  const [bookingData, setBookingData] = useState(INITIAL_BOOKING_STATE);
  const [isCopying, setIsCopying] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSavingPDF, setIsSavingPDF] = useState(false);
  const [isSavingData, setIsSavingData] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [contactsData, setContactsData] = useState([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [pricesDb, setPricesDb] = useState([]);
  const [priceUpdateText, setPriceUpdateText] = useState('');
  const [exchangeRate, setExchangeRate] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false); // Desativa Gemini para testes locais

  const [aiKeyInput, setAiKeyInput] = useState(getGeminiKey());
  const [whatsappText, setWhatsappText] = useState('');
  const [showProviderMsgs, setShowProviderMsgs] = useState(false);
  const [toursSuggestions, setToursSuggestions] = useState([]);
  const [priceSearch, setPriceSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [contactSearch, setContactSearch] = useState('');
  const [expandedContactId, setExpandedContactId] = useState(null);
  const [globalTaxasText, setGlobalTaxasText] = useState(localStorage.getItem('TET_GLOBAL_TAXAS_TEXT') || 'Taxas: [VALOR] por pessoa somente em dinero pesos colombianos (sujeitos a alteração)');

  // Hook Financeiro
  const {
    paymentMethod,
    setPaymentMethod,
    wiseMarkup,
    setWiseMarkup,
    manualRate,
    setManualRate,
    financialOverrides,
    setFinancialOverrides,
    totals,
    generateWhatsAppMessage
  } = useBookingTotals(bookingData, pricesDb, exchangeRate);

  // Hook: O(1) product catalog lookup (replaces all .find() calls on pricesDb)
  const { findProduct } = usePricesMap(pricesDb);

  // Hook: Gemini AI orchestration (processMessage, handleSmartUpdate)
  const {
    isProcessingAI,
    setIsProcessingAI, // Now exported
    processMessage,
    handleSmartUpdate,
  } = useAIProcessor({
    pricesDb,
    findProduct,
    bookingData,
    setBookingData,
    setStep,
    offlineMode, // Pass offlineMode to the hook
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      setBookingData((prev) => {
        const oldIndex = prev.tours.findIndex((t) => String(t.uuid) === String(active.id));
        const newIndex = prev.tours.findIndex((t) => String(t.uuid) === String(over.id));
        return {
          ...prev,
          tours: arrayMove(prev.tours, oldIndex, newIndex)
        };
      });
    }
  };

  // Auto-load data when switching to History or Contacts tab
  useEffect(() => {
    const loadTabData = async () => {
      if (activeTab === 'history') {
        setLoadingTab(true);
        const data = await getConfirmationsFromSupabase(20);
        setHistoryData(data);
        setLoadingTab(false);
      } else if (activeTab === 'contacts') {
        setLoadingTab(true);
        const data = await getContactsFromSupabase();
        setContactsData(data);
        setLoadingTab(false);
      }
    };
    loadTabData();
  }, [activeTab]);

  useEffect(() => {
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

    // V4: Load products from Supabase (clean catalog, no duplicates)
    const loadProducts = async () => {
      const data = await getProductsFromSupabase();
      if (data.length > 0) {
        // V5: Alphabetical sort by Passeio or name
          const sorted = data.sort((a, b) => {
            const nameA = (a.Passeio || a.name || '').toLowerCase();
            const nameB = (b.Passeio || b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
          }).map(p => ({ ...p, uuid: p.uuid || Math.random().toString(36).substring(2, 9) }));
          setPricesDb(sorted);
          console.log(`[V5] Loaded ${sorted.length} sorted products from Supabase (with UUIDs) ✅`);
      } else {
        console.warn('[V4] Supabase returned 0 products, using local JSON fallback.');
      }
    };
    loadProducts();

  }, []);

  // Sync bookingData with pricesDb updates (e.g. from Settings)
  useEffect(() => {
    if (bookingData.tours && bookingData.tours.length > 0) {
      setBookingData(prev => {
        let changed = false;
        const newTours = prev.tours.map(tour => {
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
                fees_value: updatedDbTour.Taxas_valor, // using mapped values
                fees_info: updatedDbTour.Taxas_info,
                voucher_obs: updatedDbTour.voucher_obs
              };
            }
          }
          return tour;
        });
        if (changed) {
          return { ...prev, tours: newTours };
        }
        return prev;
      });
    }
  }, [pricesDb]);

  // Date Formatter Helper for Filename
  const formatDateForFilename = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'sem-data';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };







  // Load a history item back into the booking editor
  const loadFromHistory = (item) => {
    setBookingData({
      id: item.id,
      name: item.name || '',
      passport: item.passport || '',
      cpf: item.cpf || '',
      address: item.address || '',
      cep: item.cep || '',
      dob: item.dob || '',
      email: item.email || '',
      phone: item.phone || '',
      instagram: item.instagram || '',
      city: item.city || '',
      arrival: item.arrival || '',
      departure: item.departure || '',
      pax: item.pax || '',
      paxChildren: item.paxChildren || '',
      companions: item.companions || '',
      hotel: item.hotel || '',
      source: item.source || '',
      nextDestination: item.nextDestination || '',
      emergency: item.emergency || '',
      motivoViagem: item.motivoViagem || '',
      geniLink: item.geniLink || '',
      voucherObservations: item.voucherObservations || '',
      discountValue: item.discountValue || 0,
      discountType: item.discountType || 'PERCENT',
      companionList: item.companionList || [],
      childAges: item.childAges || [],  // BUGFIX: guard against undefined crash on .map()
      tours: item.tours || []
    });
    setNotes(item.notes || '');
    setPaymentMethod(item.paymentMethod || 'entrada_saldo');
    setActiveTab('booking');
    setStep(2);
  };

  // Smart Command Handler — Gemini AI


  // Export contacts to CSV - Robust Version
  const exportContactsCSV = () => {
    if (contactsData.length === 0) {
      alert('Nenhum contato para exportar.');
      return;
    }
    const headers = [
      'Nome', 'Telefone', 'Email', 'Instagram', 'CPF', 'Passaporte',
      'Data Nascimento', 'Endereço', 'CEP', 'Cidade',
      'Hotel', 'Chegada', 'Saída', 'Pax', 'Acompanhantes',
      'Fonte', 'Emergência', 'Motivo Viagem', 'Próximo Destino'
    ];

    const escapeCsv = (val) => {
      if (!val) return '';
      const str = String(val);
      if (str.includes(';') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = contactsData.map(c => [
      escapeCsv(c.name), escapeCsv(c.phone), escapeCsv(c.email), escapeCsv(c.instagram), escapeCsv(c.cpf), escapeCsv(c.passport),
      escapeCsv(c.dob), escapeCsv(c.address), escapeCsv(c.cep), escapeCsv(c.city),
      escapeCsv(c.hotel), escapeCsv(c.arrival), escapeCsv(c.departure), escapeCsv(c.pax), escapeCsv(c.companions),
      escapeCsv(c.source), escapeCsv(c.emergency), escapeCsv(c.motivoViagem), escapeCsv(c.nextDestination)
    ]);

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contatos_TET_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert(`Exportados ${contactsData.length} contatos con sucesso!`);
  };

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
              Local: '', Hora: '', Taxas_valor: 0,
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

  const handleNewBooking = () => {
    setActiveTab('booking');
    setStep(1);
    setBookingData(INITIAL_BOOKING_STATE);
    setRawMessage('');
    setNotes('');
    setFinancialOverrides({});
    setPaymentMethod('entrada_saldo');
  };

  const handleConvertToBooking = (calcData) => {
    setBookingData({
      ...bookingData,
      name: calcData.name,
      pax: calcData.pax,
      paxChildren: 0,
      tours: calcData.tours.map(t => ({
        ...t,
        uuid: t.uuid || (Date.now().toString() + Math.random().toString(36).substring(7)),
        'Valor de venda (COP)': t.Valor_venda_COP || 0,
        'ENTRADA': t.ENTRADA || 0,
        'Preço custo (COP)': t.Preco_custo_COP || 0,
        Local: t.Local || '',
        Hora: t.Hora || '',
        Taxas_valor: t.Taxas_valor || 0,
        Ciudad: t.Ciudad || '',
        hasVariableTime: Boolean(t.hasVariableTime)
      }))
    });
    setStep(2); // Jump direct to details
    setActiveTab('booking');
    setRawMessage('');
    setNotes('');
  };

  const handleStartCalculator = () => {
    handleNewBooking(); // Reset state
    setStep(2); // Go straight to the grid
    setActiveTab('calculator'); // Keep 'calculator' active for the sidebar highlight
  };



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

  const copyToClipboard = async () => {
    if (activeTab === 'booking' && !isSavingData) {
      await handleSaveData();
    }
    navigator.clipboard.writeText(whatsappText || generateWhatsAppMessage());
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 2000);
  };

  const handleSaveData = async () => {
    if (isSavingData) return;
    setIsSavingData(true);

    const sanitizePayload = (obj) => {
      const clean = JSON.parse(JSON.stringify(obj, (key, value) => {
        if (typeof value === 'number' && isNaN(value)) return 0;
        if (value === undefined) return null;
        return value;
      }));
      return clean;
    };

    // 1. Interactive Check: Price Changes or New Products
    const productsToUpdate = [];
    const newProductsToSave = [];

    for (const tour of bookingData.tours) {
      const original = pricesDb.find(p => (p.Passeio || '').toLowerCase() === (tour.Passeio || '').toLowerCase());

      if (original) {
        // Check if prices differ from DB
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
        // It's a brand new product not in Prices DB
        newProductsToSave.push(tour);
      }
    }

    // 2. Save to Supabase
    try {
      // Build companions string from companionList if used
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

      // FIX: Capture returned bookingId to prevent duplicate INSERT on re-save
      const savedBookingId = await saveBookingSupabase(cleanData);
      if (savedBookingId && !bookingData.id) {
        setBookingData(prev => ({ ...prev, id: savedBookingId }));
      }

      // Refresh history data immediately
      const updatedHistory = await getConfirmationsFromSupabase(20);
      setHistoryData(updatedHistory);

      console.log(`✅ Reserva ${bookingData.id ? 'atualizada' : 'salva'} no banco de dados com sucesso! ID: ${savedBookingId || bookingData.id}`);

      // 3. Post-save Catalog Update (Optional/Supabase)
      // This part is now sequenced AFTER the booking is safely stored.
      if (productsToUpdate.length > 0 || newProductsToSave.length > 0) {
        // We use a small timeout to let the UI breathe
        setTimeout(async () => {
          if (productsToUpdate.length > 0) {
            const updateNames = productsToUpdate.map(p => p.name).join(', ');
            if (window.confirm(`Detectamos mudanças de preços em: ${updateNames}.\n\nDeseja atualizar o Catálogo Master com esses novos valores?`)) {
              try {
                for (const p of productsToUpdate) {
                  await updateProductSupabase(p.id, { 
                    Passeio: p.name,
                    Valor_venda_COP: p.newVenda, 
                    ENTRADA: p.newEntrada 
                  });
                }
                alert('Catálogo atualizado!');
              } catch (supaErr) {
                console.error('Supabase update error:', supaErr);
              }
            }
          }

          if (newProductsToSave.length > 0) {
            const newNames = newProductsToSave.map(p => p.Passeio).join(', ');
            if (window.confirm(`Novos produtos detectados: ${newNames}.\n\nDeseja salvá-los no Catálogo Master?`)) {
              try {
                for (const p of newProductsToSave) {
                  // Ensure we use keys expected by toSupabaseProduct
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
              } catch (supaErr) {
                console.error('Supabase save error:', supaErr);
              }
            }
          }
        }, 500);
      }

    } catch (err) {
      console.error('Firestore Save Error:', err);
      alert('Erro ao salvar no banco de dados. Verifique sua conexão.');
    } finally {
      setIsSavingData(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (isSavingPDF) return;
    setIsSavingPDF(true);
    const toursCount = bookingData.tours.length;
    if (toursCount > 0) {
      try {
        await new Promise(r => setTimeout(r, 600)); // Ensure UI is painted and fonts loaded
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < toursCount; i++) {
          const el = document.getElementById(`voucher-tour-${i}`);
          if (!el) continue;

          const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 1200
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.85);
          const pageHeight = (canvas.height * pdfWidth) / canvas.width;

          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pageHeight, undefined, 'FAST');
        }

        const filename = `VOUCHERS_${bookingData.name?.replace(/\s+/g, '_') || 'PAX'}_${formatDateForFilename(new Date())}.pdf`;
        pdf.save(filename);
        alert('Reserva salva e PDF gerado com sucesso!');
      } catch (err) {
        console.error('PDF Generation Error:', err);
        alert('Erro ao gerar PDF: ' + err.message + '. Tentando impressão nativa...');
        window.print();
      } finally {
        setIsSavingPDF(false);
      }
    } else {
      alert('Nenhum passeio para gerar voucher.');
      setIsSavingPDF(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-area">
          <img src={logo} alt="TET Logo" className="sidebar-logo" />
        </div>
        <nav className="nav-menu">
          <button className={`nav-item ${activeTab === 'booking' ? 'active' : ''}`} onClick={handleNewBooking}>
            <Plus size={20} /> <span>Nova Reserva</span>
          </button>
          <button className={`nav-item ${activeTab === 'calculator' ? 'active' : ''}`} onClick={handleStartCalculator}>
            <Calculator size={20} /> <span>Calculadora</span>
          </button>
          <button className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <History size={20} /> <span>Histórico</span>
          </button>
          <button className={`nav-item ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>
            <DollarSign size={20} /> <span>Financeiro</span>
          </button>
          <button className={`nav-item ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')}>
            <Users size={20} /> <span>Contatos</span>
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={20} /> <span>Configuração</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {(activeTab === 'booking' || activeTab === 'calculator') && (
          <div className="booking-flow">
            {step === 1 && activeTab === 'booking' && (
              <PassengerForm 
                rawMessage={rawMessage} 
                setRawMessage={setRawMessage} 
                processMessage={processMessage}
                offlineMode={offlineMode}
                setOfflineMode={setOfflineMode}
              />
            )}

            {(step === 2 || activeTab === 'calculator') && (
              <BookingDetails 
                bookingData={bookingData}
                setBookingData={setBookingData}
                pricesDb={pricesDb}
                totals={totals}
                wiseMarkup={wiseMarkup}
                setWiseMarkup={setWiseMarkup}
                manualRate={manualRate}
                setManualRate={setManualRate}
                exchangeRate={exchangeRate}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                financialOverrides={financialOverrides}
                setFinancialOverrides={setFinancialOverrides}
                step={step}
                setStep={setStep}
                sensors={sensors}
                handleDragEnd={handleDragEnd}
                notes={notes}
                setNotes={setNotes}
                isProcessingAI={isProcessingAI}
                isCalculatorMode={activeTab === 'calculator'}
                generateWhatsAppMessage={generateWhatsAppMessage}
                handleConvertToBooking={handleConvertToBooking}
                handleSmartUpdate={handleSmartUpdate}
                handleSaveData={handleSaveData}
                isSavingData={isSavingData}
              />
            )}

            {step === 3 && (
              <VoucherPreview 
                bookingData={bookingData}
                setBookingData={setBookingData}
                pricesDb={pricesDb}
                whatsappText={whatsappText}
                setWhatsappText={setWhatsappText}
                generateWhatsAppMessage={generateWhatsAppMessage}
                copyToClipboard={copyToClipboard}
                isCopying={isCopying}
                handleGeneratePDF={handleGeneratePDF}
                isSavingPDF={isSavingPDF}
                handleSaveData={handleSaveData}
                isSavingData={isSavingData}
                paymentMethod={paymentMethod}
                logo={logo}
                globalTaxasText={globalTaxasText}
                showProviderMsgs={showProviderMsgs}
                setShowProviderMsgs={setShowProviderMsgs}
                getProviderMessage={getProviderMessage}
                handleSmartUpdate={handleSmartUpdate}
                isProcessingAI={isProcessingAI}
                notes={notes}
                setNotes={setNotes}
                setStep={setStep}
              />
            )}
          </div>
        )}

        {/* Histórico Tab */}
        {activeTab === 'history' && (
          <HistoryDashboard
            historyData={historyData}
            loadingTab={loadingTab}
            historySearch={historySearch}
            setHistorySearch={setHistorySearch}
            expandedHistoryId={expandedHistoryId}
            setExpandedHistoryId={setExpandedHistoryId}
            handleDeleteConfirmation={handleDeleteConfirmation}
            loadFromHistory={loadFromHistory}
            getConfirmations={getConfirmationsFromSupabase}
            setHistoryData={setHistoryData}
            setLoadingTab={setLoadingTab}
          />
        )}

        {/* Contatos Tab */}
        {activeTab === 'contacts' && (
          <ContactsDashboard
            contactsData={contactsData}
            loadingTab={loadingTab}
            contactSearch={contactSearch}
            setContactSearch={setContactSearch}
            expandedContactId={expandedContactId}
            setExpandedContactId={setExpandedContactId}
            exportContactsCSV={exportContactsCSV}
            getContacts={getContactsFromSupabase}
            setContactsData={setContactsData}
            setLoadingTab={setLoadingTab}
            deleteContact={deleteContact}
            setHistorySearch={setHistorySearch}
            setActiveTab={setActiveTab}
          />
        )}

        {/* Dashoard Financiero (Full) */}
        {activeTab === 'finance' && (
          <FinanceDashboard
            historyData={historyData}
            loadingTab={loadingTab}
            getConfirmations={getConfirmationsFromSupabase}
            setHistoryData={setHistoryData}
            setLoadingTab={setLoadingTab}
            formatCOP={formatCOP}
          />
        )}

        {/* Configurações Tab */}
        {activeTab === 'settings' && (
          <SettingsDashboard
            aiKeyInput={aiKeyInput}
            setAiKeyInput={setAiKeyInput}
            saveGeminiKey={setGeminiKey}
            getGeminiKey={getGeminiKey}
            manualRate={manualRate}
            setManualRate={setManualRate}
            exchangeRate={exchangeRate}
            setExchangeRate={setExchangeRate}
            wiseMarkup={wiseMarkup}
            setWiseMarkup={setWiseMarkup}
            priceSearch={priceSearch}
            setPriceSearch={setPriceSearch}
            pricesDb={pricesDb}
            setPricesDb={setPricesDb}
            formatCOP={formatCOP}
            deleteProduct={deleteProductSupabase}
            updateProduct={updateProductSupabase}
            saveProduct={saveProductSupabase}
            cleanDuplicateProducts={cleanDuplicateProducts}
            getProducts={getProductsFromSupabase}
            priceUpdateText={priceUpdateText}
            setPriceUpdateText={setPriceUpdateText}
            handleAIPriceUpdate={handleAIPriceUpdate}
            isProcessingAI={isProcessingAI}
            getConfirmations={getConfirmationsFromSupabase}
            getContacts={getContactsFromSupabase}
            setHistoryData={setHistoryData}
            setContactsData={setContactsData}
            cleanDuplicateContacts={cleanDuplicateContacts}
            loadingTab={loadingTab}
            setLoadingTab={setLoadingTab}
            globalTaxasText={globalTaxasText}
            setGlobalTaxasText={(txt) => {
              setGlobalTaxasText(txt);
              localStorage.setItem('TET_GLOBAL_TAXAS_TEXT', txt);
            }}
          />
        )}
      </main >
    </div >
  );
};

export default App;
