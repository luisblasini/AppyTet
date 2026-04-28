import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const supabase = createClient(supabaseUrl, supabaseKey);

async function testBooking() {
    console.log("🚀 Iniciando prueba de reserva en STAGING...");

    try {
        // 1. Test Firebase (Confirmations)
        console.log("- Probando Firebase Staging...");
        const testData = {
            name: "TEST USER STAGING",
            pax: 2,
            hotel: "HOTEL TEST",
            tours: [{ id: "PROD-001", name: "City Tour Test", date: "2026-05-01" }],
            source: "STAGING_VALIDATION",
            createdAt: new Date()
        };
        const docRef = await addDoc(collection(db, "confirmations"), {
            ...testData,
            createdAt: serverTimestamp()
        });
        console.log(`✓ Firebase: Reserva guardada con ID: ${docRef.id}`);

        // 2. Test Supabase (Products)
        console.log("- Probando Supabase Staging...");
        const { data, error } = await supabase
            .from('products')
            .select('id, name')
            .limit(1);
        
        if (error) throw error;
        console.log(`✓ Supabase: Conexión exitosa. Primer producto encontrado: ${data[0].name}`);

        console.log("\n✅ PRUEBA EXITOSA: El entorno de Staging (v5) está 100% operativo.");
    } catch (error) {
        console.error("\n❌ ERROR EN LA PRUEBA:", error.message);
    }
    process.exit(0);
}

testBooking();
