import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const SortableTourRow = ({ tour, bookingData, setBookingData, onRemove, totals }) => {
  const idValue = tour.uuid || tour.id_unique || tour.id;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ 
    id: String(idValue) 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 150 : 'auto',
    position: 'relative'
  };

  // Find the calculated version of this tour (with pax-applied prices) from totals
  const tourIndex = (bookingData.tours || []).findIndex(t => (t.uuid || t.id) === idValue);
  const calculatedTour = totals?.calculatedTours?.[tourIndex];

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="tour-grid card"
      {...attributes}
    >
      {/* Drag Handle */}
      <div {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <GripVertical size={20} color="#cbd5e1" />
      </div>

      {/* Service Name & City */}
      <div className="tour-name-cell">
        <input
          className="input-field-minimal bold"
          value={tour.Passeio || ''}
          placeholder="Nome do passeio"
          onChange={(e) => {
            const n = [...bookingData.tours];
            const idx = n.findIndex(t => (t.uuid || t.id) === idValue);
            if (idx > -1) { n[idx].Passeio = e.target.value; setBookingData({ ...bookingData, tours: n }); }
          }}
        />
        <div className="text-xs text-secondary">{tour.Ciudad || 'Sem cidade'}</div>
      </div>

      {/* Date & Optional Time Field */}
      <div className="tour-date-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '120px' }}>
        <input
          type="date"
          className="input-field-minimal"
          style={{ padding: '6px 2px', width: '100%' }}
          value={tour.date || ''}
          onChange={(e) => {
            const n = [...bookingData.tours];
            const idx = n.findIndex(t => (t.uuid || t.id) === idValue);
            if (idx > -1) { n[idx].date = e.target.value; setBookingData({ ...bookingData, tours: n }); }
          }}
        />
        {tour.hasVariableTime && (
          <input
            type="time"
            className="input-field-minimal"
            style={{ width: '100%', padding: '4px 2px', textAlign: 'center', background: '#fffbeb', border: '1px solid #fcd34d', fontSize: '0.8rem' }}
            value={tour.Hora || ''}
            onChange={(e) => {
              const n = [...bookingData.tours];
              const idx = n.findIndex(t => (t.uuid || t.id) === idValue);
              if (idx > -1) { n[idx].Hora = e.target.value; setBookingData({ ...bookingData, tours: n }); }
            }}
          />
        )}
      </div>



      {/* Pax overriding */}
      <div className="tour-pax-cell">
        <input
          className="input-field-minimal"
          type="number"
          value={tour.paxOverride !== undefined ? tour.paxOverride : ''}
          placeholder={String(totals?.paxCount || '')}
          onChange={(e) => {
            const n = [...bookingData.tours];
            const idx = n.findIndex(t => (t.uuid || t.id) === idValue);
            if (idx > -1) { n[idx].paxOverride = e.target.value; setBookingData({ ...bookingData, tours: n }); }
          }}
        />
      </div>

      {/* Venda COP — shows calculated (pax * price), click to edit base price */}
      <div className="tour-price-cell" onClick={(e) => { const el = e.currentTarget.querySelector('input'); if (el) { el.style.display = 'block'; el.focus(); } }}>
        <div className="price-display">{formatCurrency(calculatedTour?.calculatedSale ?? tour['Valor de venda (COP)'], 'COP')}</div>
        <input
          type="number"
          className="price-edit-input"
          style={{ display: 'none' }}
          value={tour['Valor de venda (COP)'] || 0}
          onBlur={(e) => { e.target.style.display = 'none'; }}
          onChange={(e) => {
            const n = [...bookingData.tours];
            const idx = n.findIndex(t => (t.uuid || t.id) === idValue);
            if (idx > -1) { n[idx]['Valor de venda (COP)'] = parseFloat(e.target.value) || 0; setBookingData({ ...bookingData, tours: n }); }
          }}
        />
      </div>

      {/* Entrada COP — shows calculated, click to edit */}
      <div className="tour-price-cell" onClick={(e) => { const el = e.currentTarget.querySelector('input'); if (el) { el.style.display = 'block'; el.focus(); } }}>
        <div className="price-display">{formatCurrency(calculatedTour?.calculatedEntry ?? tour['ENTRADA'], 'COP')}</div>
        <input
          type="number"
          className="price-edit-input"
          style={{ display: 'none' }}
          value={tour['ENTRADA'] || 0}
          onBlur={(e) => { e.target.style.display = 'none'; }}
          onChange={(e) => {
            const n = [...bookingData.tours];
            const idx = n.findIndex(t => (t.uuid || t.id) === idValue);
            if (idx > -1) { n[idx]['ENTRADA'] = parseFloat(e.target.value) || 0; setBookingData({ ...bookingData, tours: n }); }
          }}
        />
      </div>

      {/* Custo COP — shows calculated cost, click to edit */}
      <div className="tour-price-cell" onClick={(e) => { const el = e.currentTarget.querySelector('input'); if (el) { el.style.display = 'block'; el.focus(); } }}>
        <div className="price-display">{formatCurrency(calculatedTour?.calculatedCost ?? tour['Preço custo (COP)'], 'COP')}</div>
        <input
          type="number"
          className="price-edit-input"
          style={{ display: 'none' }}
          value={tour['Preço custo (COP)'] || 0}
          onBlur={(e) => { e.target.style.display = 'none'; }}
          onChange={(e) => {
            const n = [...bookingData.tours];
            const idx = n.findIndex(t => (t.uuid || t.id) === idValue);
            if (idx > -1) { n[idx]['Preço custo (COP)'] = parseFloat(e.target.value) || 0; setBookingData({ ...bookingData, tours: n }); }
          }}
        />
      </div>

      {/* Actions & Checkbox */}
      <div className="tour-actions-cell" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
        <button className="btn-icon-subtle danger" onClick={() => onRemove(tour.uuid || tour.id)} title="Remover Passeio">
          <Trash2 size={16} />
        </button>
        <label style={{ fontSize: '0.6rem', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', textAlign: 'center' }}>
          <input
            type="checkbox"
            checked={tour.saldoEmEntrada || false}
            onChange={(e) => {
              const n = [...bookingData.tours];
              const idx = n.findIndex(t => (t.uuid || t.id) === idValue);
              if (idx > -1) { n[idx].saldoEmEntrada = e.target.checked; setBookingData({ ...bookingData, tours: n }); }
            }}
          />
          Saldo na<br/>Entrada
        </label>
      </div>
    </div>
  );
};

export default SortableTourRow;
