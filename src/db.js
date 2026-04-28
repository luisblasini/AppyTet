/**
 * DB DEPRECATED (AppyTET v5 Tabula Rasa)
 * 
 * Este archivo ha sido desactivado intencionalmente para forzar
 * la migración exclusiva a Supabase. Toda la lógica de persistencia
 * (reservas, contactos, productos) ahora vive en src/supabase.js
 */

export const saveConfirmation = async () => { throw new Error("Firebase DB Deprecated. Use Supabase."); };
export const deleteConfirmation = async () => { throw new Error("Firebase DB Deprecated. Use Supabase."); };
export const getConfirmations = async () => [];
export const saveContact = async () => { throw new Error("Firebase DB Deprecated. Use Supabase."); };
export const getContacts = async () => [];
export const deleteContact = async () => { throw new Error("Firebase DB Deprecated. Use Supabase."); };
export const getProducts = async () => [];
export const saveProduct = async () => { throw new Error("Firebase DB Deprecated. Use Supabase."); };
export const updateProduct = async () => { throw new Error("Firebase DB Deprecated. Use Supabase."); };
export const deleteProduct = async () => { throw new Error("Firebase DB Deprecated. Use Supabase."); };
export const cleanDuplicateProducts = async () => { throw new Error("Firebase DB Deprecated. Use Supabase."); };
export const cleanDuplicateContacts = async () => { throw new Error("Firebase DB Deprecated. Use Supabase."); };
