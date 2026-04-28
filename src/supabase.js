import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

import productsMirror from './data/final_master_catalog.json';

const IS_STAGING = false; // ⚠️ FALSE: Producción Real (Supabase) | TRUE: Staging (Mock/JSON Local)

/**
 * Load all products from Supabase (or Local Mirror in Staging).
 * Returns them in the same shape the app uses (Firestore/JSON format).
 */
export const getProductsFromSupabase = async () => {
  let productsData = [];

  if (IS_STAGING) {
    console.warn('🚀 [Staging Mode] Usando base de datos espejo (JSON Local)');
    productsData = productsMirror;
  } else {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id');

    if (error) {
      console.error('[Supabase] Error loading products:', error.message);
      return [];
    }
    productsData = data;
  }

  // Map data back to the format the app expects
  // Soporta has_variable_time (Supabase e historial local)
  return productsData.map(p => ({
    ID: p.id,
    id: p.id,
    Passeio: p.name,
    Ciudad: p.city,
    Descricao: p.description,
    Valor_venda_COP: Number(p.price_sale),
    Preco_custo_COP: Number(p.price_cost),
    ENTRADA: Number(p.price_entry),
    Local: p.meet_point,
    Hora: p.time,
    Taxas_valor: Number(p.fees_value),
    Taxas_info: p.fees_info,
    Comentarios: p.comments,
    hasVariableTime: Boolean(p.has_variable_time),
    voucher_obs: p.voucher_obs || '',
    status: p.status,
  }));
};

// Helper: map app format → Supabase columns
const toSupabaseProduct = (p) => ({
  name: p.Passeio || '',
  city: p.Ciudad || 'Cartagena',
  description: p.Descricao || '',
  price_sale: Number(p.Valor_venda_COP) || 0,
  price_cost: Number(p.Preco_custo_COP) || 0,
  price_entry: Number(p.ENTRADA) || 0,
  meet_point: p.Local || '',
  time: p.Hora || '',
  fees_value: Number(p.Taxas_valor) || 0,
  fees_info: p.Taxas_info || '',
  comments: p.Comentarios || '',
  has_variable_time: Boolean(p.hasVariableTime),
});

/**
 * Update an existing product in Supabase.
 */
export const updateProductSupabase = async (id, data) => {
  if (IS_STAGING) {
    console.warn(`🚀 [Staging Mode] Mock Update Product ID: ${id}`);
    return;
  }
  const { error } = await supabase
    .from('products')
    .update(toSupabaseProduct(data))
    .eq('id', id);
  if (error) {
    console.error('[Supabase] Error updating product:', error.message);
    throw new Error(error.message);
  }
};

/**
 * Save a new product to Supabase.
 * Returns the new numeric ID.
 */
export const saveProductSupabase = async (data) => {
  if (IS_STAGING) {
    console.warn(`🚀 [Staging Mode] Mock Save Product: ${data.name}`);
    return `PROD-LOCAL-${Math.floor(Math.random() * 1000)}`;
  }
  const { data: inserted, error } = await supabase
    .from('products')
    .insert(toSupabaseProduct(data))
    .select('id')
    .single();
  if (error) {
    console.error('[Supabase] Error inserting product:', error.message);
    throw new Error(error.message);
  }
  return inserted.id;
};

/**
 * Delete a product from Supabase.
 */
export const deleteProductSupabase = async (id) => {
  if (IS_STAGING) {
    console.warn(`🚀 [Staging Mode] Mock Delete Product ID: ${id}`);
    return;
  }
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('[Supabase] Error deleting product:', error.message);
    throw new Error(error.message);
  }
};


/**
 * Save or Update a Contact in Supabase.
 * Returns the numeric ID of the contact.
 */
export const upsertContactSupabase = async (contact) => {
  if (IS_STAGING) {
    console.warn('🚀 [Staging Mode] Mock Upsert Contact:', contact.name);
    return Date.now(); // Mock ID
  }

  const { data, error } = await supabase
    .from('contacts')
    .upsert({
      name: contact.name,
      phone: contact.phone,
      cpf: contact.cpf,
      email: contact.email,
      passport: contact.passport
    }, { onConflict: 'cpf' }) // Evita duplicados por CPF
    .select('id')
    .single();

  if (error) {
    console.error('[Supabase] Error upserting contact:', error.message);
    throw new Error(error.message);
  }
  return data.id;
};

/**
 * Save a complete booking with its items.
 */
export const saveBookingSupabase = async (bookingData) => {
  if (IS_STAGING) {
    console.warn('🚀 [Staging Mode] Mock Save Booking:', bookingData);
    return;
  }

  try {
    // 1. Ensure the contact is saved/updated
    const contactId = await upsertContactSupabase(bookingData.contact);

    const bookingPayload = {
      contact_id: contactId,
      total_amount: bookingData.totals.totalCOP || 0,
      total_entry: bookingData.totals.entradaCOP || 0,
      total_balance: bookingData.totals.saldoCOP || 0,
      total_brl: bookingData.totals.totalBRL || 0,
      entry_brl: bookingData.totals.entradaBRL || 0,
      currency: bookingData.currency || 'COP',
      agent_name: bookingData.agent || 'Admin',
      status: bookingData.status || 'confirmed',
      payment_method: bookingData.paymentMethod || 'entrada_saldo',
      notes: bookingData.notes || '',
      metadata: { 
        hotel: bookingData.hotel, 
        arrival_date: bookingData.arrival,
        departure_date: bookingData.departure,
        pax: bookingData.pax,
        pax_children: bookingData.paxChildren,
        companions: bookingData.companions,
        discount_value: bookingData.discountValue,
        discount_type: bookingData.discountType,
        voucher_observations: bookingData.voucherObservations,
        geni_link: bookingData.geniLink,
        instagram: bookingData.instagram,
        source: bookingData.source,
        next_destination: bookingData.nextDestination,
        emergency: bookingData.emergency,
        motivo_viagem: bookingData.motivoViagem
      }
    };

    let bookingId;

    if (bookingData.id) {
      // 2a. Update existing booking
      bookingId = bookingData.id;
      const { error: uError } = await supabase
        .from('bookings')
        .update(bookingPayload)
        .eq('id', bookingId);
      
      if (uError) throw new Error(uError.message);

      // Delete old items to refresh them
      const { error: dError } = await supabase
        .from('booking_items')
        .delete()
        .eq('booking_id', bookingId);
      
      if (dError) throw new Error(dError.message);
    } else {
      // 2b. Create new booking
      const { data: booking, error: bError } = await supabase
        .from('bookings')
        .insert(bookingPayload)
        .select('id')
        .single();

      if (bError) throw new Error(bError.message);
      bookingId = booking.id;
    }

    // 3. Create items (tours)
    const items = (bookingData.tours || []).map(tour => ({
      booking_id: bookingId,
      product_id: tour.ID || tour.id || null, 
      tour_name: tour.Passeio || '',
      tour_date: tour.date,
      tour_time: tour.Hora || tour.time || '',
      pax_adult: parseInt(tour.paxOverride) || parseInt(bookingData.pax) || 0,
      pax_chd: parseInt(bookingData.paxChildren) || 0,
      price_sale: tour['Valor de venda (COP)'] || tour.price_sale || 0,
      price_entry: tour['ENTRADA'] || tour.price_entry || 0,
      hotel: bookingData.hotel || '',
      observations: tour.voucher_obs || ''
    }));

    if (items.length > 0) {
      const { error: iError } = await supabase
        .from('booking_items')
        .insert(items);

      if (iError) throw new Error(iError.message);
    }

    console.log(`✅ Booking ${bookingData.id ? 'updated' : 'saved'} successfully to Supabase`);
    return bookingId;
  } catch (err) {
    console.error('[Supabase] Detailed Save Error:', err);
    throw err;
  }
};

/**
 * Get all contacts for the search/autocomplete.
 */
export const getContactsFromSupabase = async () => {
  if (IS_STAGING) return [];
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('[Supabase] Error fetching contacts:', error.message);
    return [];
  }
  return data;
};

/**
 * Get all bookings with their items and contacts (History).
 */
export const getConfirmationsFromSupabase = async (limit = 50) => {
  if (IS_STAGING) return [];
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      contacts (*),
      booking_items (*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) {
    console.error('[Supabase] Error fetching confirmations:', error.message);
    return [];
  }
  
  // Transform to match the full UI format so loadFromHistory restores all fields
  return data.map(b => ({
    id: b.id,
    date: new Date(b.created_at).toISOString(),
    name: b.contacts?.name || 'Sem nome',
    phone: b.contacts?.phone || '',
    cpf: b.contacts?.cpf || '',
    email: b.contacts?.email || '',
    passport: b.contacts?.passport || '',
    address: b.contacts?.address || '',
    cep: b.contacts?.cep || '',
    dob: b.contacts?.dob || '',
    instagram: b.contacts?.instagram || '',
    city: b.contacts?.city || '',
    // Metadata fields
    hotel: b.metadata?.hotel || '',
    arrival: b.metadata?.arrival_date || '',
    departure: b.metadata?.departure_date || '',
    pax: b.metadata?.pax || '',
    paxChildren: b.metadata?.pax_children || '',
    companions: b.metadata?.companions || '',
    discountValue: b.metadata?.discount_value || 0,
    discountType: b.metadata?.discount_type || 'PERCENT',
    voucherObservations: b.metadata?.voucher_observations || '',
    geniLink: b.metadata?.geni_link || '',
    source: b.metadata?.source || '',
    nextDestination: b.metadata?.next_destination || '',
    emergency: b.metadata?.emergency || '',
    motivoViagem: b.metadata?.motivo_viagem || '',
    paymentMethod: b.payment_method || 'entrada_saldo',
    notes: b.notes || '',
    tours: b.booking_items?.map(item => ({
      id: item.product_id,
      Passeio: item.tour_name || '',
      date: item.tour_date,
      Hora: item.tour_time,
      time: item.tour_time,
      pax_adult: item.pax_adult,
      pax_chd: item.pax_chd,
      'Valor de venda (COP)': item.price_sale || 0,
      'ENTRADA': item.price_entry || 0,
      hotel: item.hotel,
      pickup_time: item.pickup_time,
      observations: item.observations,
      voucher_obs: item.observations || ''
    })) || [],
    totals: {
      totalAmount: b.total_amount,
      totalEntry: b.total_entry,
      totalBalance: b.total_balance
    },
    status: b.status,
    agent: b.agent_name
  }));
};

/**
 * Delete a booking (and its items via CASCADE).
 */
export const deleteConfirmationSupabase = async (id) => {
  if (IS_STAGING) {
    console.warn(`🚀 [Staging Mode] Mock Delete Booking ID: ${id}`);
    return;
  }
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('[Supabase] Error deleting confirmation:', error.message);
    throw new Error(error.message);
  }
};
