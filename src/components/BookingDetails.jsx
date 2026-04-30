import React from 'react';
import { 
  DndContext, 
  closestCenter
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { Users, Trash2, MessageSquare, Plus, Calendar } from 'lucide-react';
import SortableTourRow from './SortableTourRow';
import { formatCurrency, toTitleCase } from '../utils/formatters';

const BookingDetails = ({ 
  bookingData, 
  setBookingData, 
  pricesDb, 
  totals, 
  wiseMarkup, 
  setWiseMarkup, 
  manualRate, 
  setManualRate,
  exchangeRate,
  paymentMethod, 
  setPaymentMethod, 
  financialOverrides, 
  setFinancialOverrides, 
  step, 
  setStep,
  sensors,
  handleDragEnd,
  notes,
  setNotes,
  isProcessingAI,
  isCalculatorMode = false,
  generateWhatsAppMessage,
  handleConvertToBooking,
  handleSmartUpdate,
  handleSaveData,
  isSavingData
}) => {
  const [isQuotation, setIsQuotation] = React.useState(isCalculatorMode);

  // Auto-set quotation mode if in calculator
  React.useEffect(() => {
    if (isCalculatorMode) {
      setIsQuotation(true);
      if (!financialOverrides.isQuotation) {
        setFinancialOverrides(prev => ({ ...prev, isQuotation: true }));
      }
    }
  }, [isCalculatorMode]);

  // Custom Search State
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showResults, setShowResults] = React.useState(false);

  // Filter pricesDb based on search
  const filteredTours = React.useMemo(() => {
    if (!searchTerm) return [];
    return pricesDb.filter(t => 
      (t.Passeio || t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.Ciudad || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 15);
  }, [searchTerm, pricesDb]);

  const handleAddTour = (found) => {
    const uniqueUuid = Date.now().toString() + Math.random().toString(36).substring(7);
    const newTour = found
      ? {
          ...found,
          Passeio: found.Passeio || found.name,
          'Valor de venda (COP)': found.Valor_venda_COP || found['Valor de venda (COP)'] || 0,
          'ENTRADA': found.ENTRADA || found['ENTRADA'] || 0,
          'Preço custo (COP)': found.Preco_custo_COP || found['Preço custo (COP)'] || 0,
          uuid: uniqueUuid
        }
      : {
          Passeio: searchTerm || 'Novo Item',
          'Valor de venda (COP)': 0,
          'ENTRADA': 0,
          'Preço custo (COP)': 0,
          Local: '', Taxas_valor: 0, Taxas_info: '', Hora: '', Ciudad: '',
          uuid: uniqueUuid
        };
    setBookingData({ ...bookingData, tours: [...(bookingData.tours || []), newTour] });
    setSearchTerm('');
    setShowResults(false);
  };

  return (
    <div className="card fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="mb-0">
          <Calendar size={20} className="inline-icon" />
          {isCalculatorMode ? ' Calculadora de Preços' : ' Detalhes da Reserva'}
        </h3>
        <button className="btn-icon" onClick={() => setStep(1)} title="Voltar">
          <Trash2 size={18} color="red" />
        </button>
      </div>

      {/* --- PASSENGER FIELDS: always visible (compact in calculator mode) --- */}
      <div className="grid-2">
        <div>
          <span className="label">Nome</span>
          <input
            className="input-field"
            placeholder="Nome completo"
            value={bookingData.name}
            onChange={e => setBookingData({ ...bookingData, name: toTitleCase(e.target.value) })}
          />
        </div>
        <div>
          <span className="label">Pax (Adultos)</span>
          <input
            type="number"
            className="input-field"
            value={bookingData.pax}
            onChange={e => setBookingData({ ...bookingData, pax: e.target.value })}
          />
        </div>

        {/* Show arrival/departure only in full booking mode */}
        {!isCalculatorMode && (
          <>
            <div>
              <span className="label">Chegada / Arribo</span>
              <input
                type="date"
                className="input-field"
                value={bookingData.arrival ? bookingData.arrival.split('/').reverse().join('-') : ''}
                onChange={e => {
                  const [y, m, d] = e.target.value.split('-');
                  setBookingData({ ...bookingData, arrival: `${d}/${m}/${y}` });
                }}
              />
            </div>
          </>
        )}

        <div>
          <span className="label">CHD (Crianças)</span>
          <input
            type="number"
            className="input-field"
            placeholder="Qtd menores"
            value={bookingData.paxChildren}
            onChange={e => {
              const val = e.target.value;
              const count = parseInt(val) || 0;
              const newAges = [...(bookingData.childAges || [])];
              if (count > newAges.length) {
                for (let i = newAges.length; i < count; i++) newAges.push('');
              } else {
                newAges.splice(count);
              }
              setBookingData({ ...bookingData, paxChildren: val, childAges: newAges });
            }}
          />
        </div>

        {!isCalculatorMode && (
          <div>
            <span className="label">Saída / Partida</span>
            <input
              type="date"
              className="input-field"
              value={bookingData.departure ? bookingData.departure.split('/').reverse().join('-') : ''}
              onChange={e => {
                const [y, m, d] = e.target.value.split('-');
                setBookingData({ ...bookingData, departure: `${d}/${m}/${y}` });
              }}
            />
          </div>
        )}
      </div>

      {/* Extended fields — full booking mode only */}
      {!isCalculatorMode && (
        <>
          <div className="grid-3 mt-4">
            <div>
              <span className="label">Hotel / Acomodação</span>
              <input className="input-field" placeholder="Nome do hotel ou endereço" value={bookingData.hotel} onChange={e => setBookingData({ ...bookingData, hotel: e.target.value })} />
            </div>
            <div>
              <span className="label">Passaporte / ID</span>
              <input className="input-field" placeholder="Número doc" value={bookingData.passport} onChange={e => setBookingData({ ...bookingData, passport: e.target.value })} />
            </div>
            <div>
              <span className="label">CPF</span>
              <input className="input-field" placeholder="000.000.000-00" value={bookingData.cpf} onChange={e => setBookingData({ ...bookingData, cpf: e.target.value })} />
            </div>
            <div>
              <span className="label">E-mail</span>
              <input className="input-field" placeholder="cliente@email.com" value={bookingData.email} onChange={e => setBookingData({ ...bookingData, email: e.target.value })} />
            </div>
          </div>

          {/* Dynamic Child Ages Inputs */}
          {(bookingData.childAges || []).length > 0 && (
            <div className="mt-4 animate-in" style={{ background: '#fdf2f8', padding: '15px', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
              <span className="label" style={{ color: 'var(--secondary)', display: 'block', marginBottom: '10px' }}>
                <Users size={14} className="inline-icon" /> Idades das Crianças (CHD):
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {bookingData.childAges.map((age, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--secondary)' }}>Idade CHD {idx + 1}</span>
                    <input
                      type="number"
                      className="input-field"
                      style={{ width: '60px', padding: '8px', textAlign: 'center', borderColor: 'var(--secondary)', fontWeight: 'bold' }}
                      placeholder="Anos"
                      value={age}
                      onChange={e => {
                        const newAges = [...bookingData.childAges];
                        newAges[idx] = e.target.value;
                        setBookingData({ ...bookingData, childAges: newAges });
                      }}
                    />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.7rem', color: '#be185d', marginTop: '10px', fontWeight: '500' }}>
                * Digite a idade para identificar as tarifas corretas nos tours infantis.
              </p>
            </div>
          )}

          {/* DYNAMIC COMPANIONS */}
          {!isCalculatorMode && parseInt(bookingData.pax) > 1 && (
            <div className="mt-4 animate-in" style={{ background: '#f0fdf4', padding: '15px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
              <span className="label" style={{ color: 'var(--primary)', display: 'block', marginBottom: '10px' }}>
                <Users size={14} className="inline-icon" /> Dados dos Acompanhantes ({(parseInt(bookingData.pax) || 1) - 1}):
              </span>
              {Array.from({ length: Math.max(0, (parseInt(bookingData.pax) || 1) - 1) }).map((_, idx) => {
                const comp = (bookingData.companionList && bookingData.companionList[idx]) ? bookingData.companionList[idx] : { name: '', doc: '' };
                return (
                  <div key={idx} className="grid-2 mb-2" style={{ gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Nome Acomp. {idx + 1}</span>
                      <input
                        className="input-field"
                        placeholder="Nome completo"
                        value={comp.name}
                          onChange={e => {
                            const newList = [...(bookingData.companionList || [])];
                            newList[idx] = { ...comp, name: toTitleCase(e.target.value) };
                            setBookingData({ ...bookingData, companionList: newList });
                          }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Doc / Passaporte</span>
                      <input
                        className="input-field"
                        placeholder="Documento"
                        value={comp.doc}
                        onChange={e => {
                          const newList = [...(bookingData.companionList || [])];
                          newList[idx] = { ...comp, doc: e.target.value };
                          setBookingData({ ...bookingData, companionList: newList });
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <hr className="my-4" />

      {/* --- TOURS SECTION --- */}
      <h3>Paseos &amp; Serviços</h3>
      <div className="search-box mt-2">
        <div className="dropdown-container">
          <input
            placeholder="🔍 Buscar paseo ou cidade..."
            className="input-field"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
          />
          {showResults && filteredTours.length > 0 && (
            <div className="dropdown-results">
              {filteredTours.map((t, idx) => (
                <div 
                  key={idx} 
                  className="dropdown-item" 
                  onClick={() => handleAddTour(t)}
                >
                  <span className="dropdown-item-title">{t.Passeio || t.name}</span>
                  <span className="dropdown-item-city">{t.Ciudad || 'General'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="btn-secondary" onClick={() => handleAddTour(null)}>
          <Plus size={18} /> Novo
        </button>
      </div>

      {/* Tour Table Header */}
      <div className="tour-header-grid hide-mobile mt-4">
        <div className="label"></div>
        <div className="label">Serviço / Paseo</div>
        <div className="label">Data</div>
        <div className="label">Pax</div>
        <div className="label">Venda (COP)</div>
        <div className="label">Entrada (COP)</div>
        <div className="label">Custo (COP)</div>
        <div className="label" style={{ textAlign: 'center' }}>Ações</div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={(bookingData.tours || []).map(t => String(t.uuid || t.id || Date.now()))}
          strategy={verticalListSortingStrategy}
        >
          <div className="mt-2">
            {(bookingData.tours || []).map((tour) => (
              <SortableTourRow
                key={tour.uuid || tour.id}
                tour={tour}
                bookingData={bookingData}
                setBookingData={setBookingData}
                totals={totals}
                onRemove={(id) => setBookingData({
                  ...bookingData,
                  tours: (bookingData.tours || []).filter(t => (t.uuid || t.id) !== id)
                })}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <hr className="my-4" />

      {/* --- AI NOTES (v4 position: before Financeiro) --- */}
      <div className="flex justify-between items-center">
        <h3>Asistente IA / Notas</h3>
        <button 
          className="btn-secondary" 
          onClick={() => handleSmartUpdate(notes)}
          disabled={isProcessingAI}
          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
        >
          {isProcessingAI ? 'Processando...' : '🪄 Aplicar Comando'}
        </button>
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '5px' }}>
        Cole novos detalhes aqui ou use como bloco de notas simples.
      </p>
      <textarea
        className="input-field"
        rows="3"
        placeholder="Ex: Mudar hotel para Selina... ou manter notas gerais."
        value={notes || ''}
        onChange={(e) => setNotes(e.target.value)}
      />

      <hr className="my-4" />

      {/* --- FINANCEIRO --- */}
      <h3>Financeiro</h3>
      <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <span className="label">Desconto no Total (Entrada):</span>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <input
                type="number"
                className="input-field"
                style={{ margin: 0 }}
                placeholder="Valor"
                value={bookingData.discountValue || ''}
                onChange={(e) => setBookingData({ ...bookingData, discountValue: parseFloat(e.target.value) || 0 })}
              />
              <select
                className="input-field"
                style={{ margin: 0, width: '90px' }}
                value={bookingData.discountType || 'PERCENT'}
                onChange={(e) => setBookingData({ ...bookingData, discountType: e.target.value })}
              >
                <option value="PERCENT">%</option>
                <option value="COP">COP</option>
              </select>
            </div>
            {totals.discountAmount > 0 && (
              <p style={{ fontSize: '0.7rem', color: '#0369a1', marginTop: '5px', fontWeight: 'bold' }}>
                ↳ Desconto aplicado: -{formatCurrency(totals.discountAmount, 'COP')} na entrada
              </p>
            )}
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', flex: 1 }}>
            El descuento se aplica sobre la entrada, reduciendo el total bruto y conservando el saldo intacto.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="label">Taxa Wise / Markup %:</span>
        <input
          type="number"
          className="mini-input"
          value={wiseMarkup}
          onChange={(e) => setWiseMarkup(parseFloat(e.target.value) || 0)}
        />
        <p style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>Markup aplicado na conversão COP ➜ BRL</p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="label">Cotação Wise (Manual):</span>
        <input
          type="number"
          className="mini-input"
          value={manualRate}
          onChange={(e) => setManualRate(Number(e.target.value))}
        />
        <span className="label">Ref: {exchangeRate || '—'}</span>
      </div>

      <div className="selector-bg mt-4">
        <button className={`selector-btn ${paymentMethod === 'entrada_saldo' ? 'active' : ''}`} onClick={() => { 
          setPaymentMethod('entrada_saldo'); 
          setFinancialOverrides(isCalculatorMode ? { isQuotation: true } : {}); 
        }}>Entrada + Saldo</button>
        <button className={`selector-btn ${paymentMethod === 'total_pix' ? 'active' : ''}`} onClick={() => { 
          setPaymentMethod('total_pix'); 
          setFinancialOverrides(isCalculatorMode ? { isQuotation: true } : {}); 
        }}>Integral (PIX)</button>
      </div>

      <div className="mt-4">
        {/* Editable Total Bruto COP */}
        <div className="total-pill pill-turquoise" style={{ cursor: 'pointer' }} onClick={(e) => { const el = e.currentTarget.querySelector('input'); if (el) { el.style.display = 'inline-block'; el.focus(); } }}>
          <span>Total Bruto</span>
          <span style={{ display: financialOverrides.totalCOP !== undefined ? 'none' : 'inline' }}>{formatCurrency(totals.totalCOP, 'COP')}</span>
          <input
            type="number"
            className="price-edit-input"
            style={{ display: financialOverrides.totalCOP !== undefined ? 'inline-block' : 'none', width: '120px', textAlign: 'right', background: 'transparent', border: '1px dashed var(--primary)', padding: '2px 6px', fontSize: '0.9rem' }}
            value={financialOverrides.totalCOP !== undefined ? financialOverrides.totalCOP : totals.totalCOP}
            onChange={(e) => setFinancialOverrides({ ...financialOverrides, totalCOP: parseFloat(e.target.value) || 0 })}
            onBlur={(e) => { if (parseFloat(e.target.value) === totals.totalCOP) { const { totalCOP, ...rest } = financialOverrides; setFinancialOverrides(rest); } }}
          />
        </div>

        {paymentMethod === 'entrada_saldo' ? (
          <>
            {/* Entrada COP */}
            <div className="total-pill pill-turquoise" style={{ background: '#e0f7fa' }}>
              <span>Entrada (COP)</span>
              <span>{formatCurrency(totals.entradaCOP, 'COP')}</span>
            </div>
            {/* Editable Entrada BRL */}
            <div className="total-pill pill-pink" style={{ cursor: 'pointer' }} onClick={(e) => { const el = e.currentTarget.querySelector('input'); if (el) { el.style.display = 'inline-block'; el.focus(); } }}>
              <span>Entrada (PIX)</span>
              <span style={{ display: financialOverrides.entradaBRL !== undefined ? 'none' : 'inline' }}>{formatCurrency(totals.entradaBRL, 'BRL')}</span>
              <input
                type="number"
                className="price-edit-input"
                style={{ display: financialOverrides.entradaBRL !== undefined ? 'inline-block' : 'none', width: '120px', textAlign: 'right', background: 'transparent', border: '1px dashed var(--accent)', padding: '2px 6px', fontSize: '0.9rem' }}
                value={financialOverrides.entradaBRL !== undefined ? financialOverrides.entradaBRL : totals.entradaBRL}
                onChange={(e) => setFinancialOverrides({ ...financialOverrides, entradaBRL: parseFloat(e.target.value) || 0 })}
                onBlur={(e) => { if (parseFloat(e.target.value) === totals.entradaBRL) { const { entradaBRL, ...rest } = financialOverrides; setFinancialOverrides(rest); } }}
              />
            </div>
            {/* Editable Saldo Cartão COP */}
            <div className="total-pill pill-turquoise" style={{ background: '#e0f2fe', cursor: 'pointer' }} onClick={(e) => { const el = e.currentTarget.querySelector('input'); if (el) { el.style.display = 'inline-block'; el.focus(); } }}>
              <span>Saldo Cartão</span>
              <span style={{ display: financialOverrides.saldoCOP !== undefined ? 'none' : 'inline' }}>{formatCurrency(totals.saldoCOP, 'COP')}</span>
              <input
                type="number"
                className="price-edit-input"
                style={{ display: financialOverrides.saldoCOP !== undefined ? 'inline-block' : 'none', width: '120px', textAlign: 'right', background: 'transparent', border: '1px dashed var(--primary)', padding: '2px 6px', fontSize: '0.9rem' }}
                value={financialOverrides.saldoCOP !== undefined ? financialOverrides.saldoCOP : totals.saldoCOP}
                onChange={(e) => setFinancialOverrides({ ...financialOverrides, saldoCOP: parseFloat(e.target.value) || 0 })}
                onBlur={(e) => { if (parseFloat(e.target.value) === totals.saldoCOP) { const { saldoCOP, ...rest } = financialOverrides; setFinancialOverrides(rest); } }}
              />
            </div>
          </>
        ) : (
          /* Editable Total PIX BRL */
          <div className="total-pill pill-pink" style={{ cursor: 'pointer' }} onClick={(e) => { const el = e.currentTarget.querySelector('input'); if (el) { el.style.display = 'inline-block'; el.focus(); } }}>
            <span>Total (PIX)</span>
            <span style={{ display: financialOverrides.totalBRL !== undefined ? 'none' : 'inline' }}>{formatCurrency(totals.totalBRL, 'BRL')}</span>
            <input
              type="number"
              className="price-edit-input"
              style={{ display: financialOverrides.totalBRL !== undefined ? 'inline-block' : 'none', width: '120px', textAlign: 'right', background: 'transparent', border: '1px dashed var(--accent)', padding: '2px 6px', fontSize: '0.9rem' }}
              value={financialOverrides.totalBRL !== undefined ? financialOverrides.totalBRL : totals.totalBRL}
              onChange={(e) => setFinancialOverrides({ ...financialOverrides, totalBRL: parseFloat(e.target.value) || 0 })}
              onBlur={(e) => { if (parseFloat(e.target.value) === totals.totalBRL) { const { totalBRL, ...rest } = financialOverrides; setFinancialOverrides(rest); } }}
            />
          </div>
        )}

        {Object.keys(financialOverrides).length > 0 && (
          <button className="btn-secondary mt-2" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setFinancialOverrides(isCalculatorMode ? { isQuotation: true } : {})}>
            ↺ Recalcular automático
          </button>
        )}
      </div>

      {/* --- WHATSAPP PREVIEW (Now integrated directly) --- */}
      <div className="card mt-6" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div className="flex justify-between items-center mb-2">
          <h4 className="flex items-center gap-2 m-0" style={{ fontSize: '0.9rem' }}>
            <MessageSquare size={16} /> Texto para WhatsApp
          </h4>
          <button 
            className="btn-secondary" 
            style={{ fontSize: '0.7rem', padding: '2px 8px' }} 
            onClick={() => {
              const text = generateWhatsAppMessage();
              navigator.clipboard.writeText(text);
              // Visual feedback instead of alert
              const btn = document.activeElement;
              if (btn) {
                const originalText = btn.innerText;
                btn.innerText = 'Copiado! ✅';
                setTimeout(() => btn.innerText = originalText, 2000);
              }
            }}
          >
            Copiar Texto
          </button>
        </div>
        <textarea
          className="input-field"
          rows="10"
          readOnly
          style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: '#fff', border: '1px solid #e2e8f0' }}
          value={generateWhatsAppMessage()}
        />
      </div>

      {/* Buttons */}
      <div className="grid-2 mt-6">
        {isCalculatorMode ? (
          <button className="btn-primary w-full" style={{ gridColumn: 'span 2' }} onClick={() => handleConvertToBooking(bookingData)}>
            Convertir en Reserva ✅
          </button>
        ) : (
          <>
            <button className="btn-secondary" onClick={() => {
              setFinancialOverrides({ ...financialOverrides, isQuotation: true });
              setStep(3);
            }}>
              Enviar Cotação <MessageSquare size={18} />
            </button>
            <button className="btn-primary" disabled={isSavingData} onClick={async () => {
              setFinancialOverrides({ ...financialOverrides, isQuotation: false });
              if (handleSaveData) await handleSaveData();
              setStep(3);
            }}>
              {isSavingData ? 'Salvando...' : 'Fechar Reserva '} <MessageSquare size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingDetails;
