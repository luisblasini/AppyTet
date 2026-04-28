/**
 * Smart Import Script: Imports products from import_products.json into Firestore.
 * 
 * Rules:
 * - If a product already exists (by normalized name), update ONLY text fields.
 * - If the imported price is 0, DO NOT overwrite the existing price.
 * - If a product is new, add it with all fields.
 * - All names are normalized to Title Case for deduplication.
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { readFileSync } from "fs";

const firebaseConfig = {
    apiKey: "AIzaSyBzP1MgLa7epdrVk__sgyT1E0D5BEdJRPM",
    authDomain: "appytet.firebaseapp.com",
    projectId: "appytet-34f3f",
    storageBucket: "appytet.firebasestorage.app",
    messagingSenderId: "208304292723",
    appId: "1:208304292723:web:488ffdf21505d49edb7b06",
    measurementId: "G-N0CLVMEZER"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function toTitleCase(str) {
    if (!str) return 'Sem Nome';
    return str.toLowerCase().split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

async function main() {
    console.log("--- Smart Product Import ---");

    // 1. Read import JSON
    const jsonPath = "../AppyTET/data_source/import_products.json";
    const importedProducts = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    console.log(`Loaded ${importedProducts.length} products from JSON.`);

    // 2. Read current Firestore products
    const q = query(collection(db, "products"), orderBy("Passeio", "asc"));
    const snapshot = await getDocs(q);
    const existingProducts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`Found ${existingProducts.length} existing products in Firestore.`);

    // 3. Build a lookup map by normalized name
    const existingMap = new Map();
    existingProducts.forEach(p => {
        const key = toTitleCase(p.Passeio);
        existingMap.set(key, p);
    });

    let updatedCount = 0;
    let addedCount = 0;
    let skippedCount = 0;

    for (const item of importedProducts) {
        const normalizedName = toTitleCase(item.Passeio);

        // Skip header rows or empty names
        if (!normalizedName || normalizedName === 'Sem Nome' || normalizedName === '-' || normalizedName === '0') {
            skippedCount++;
            continue;
        }

        const existing = existingMap.get(normalizedName);

        if (existing) {
            // UPDATE: Only text fields, preserve prices if import has 0
            const updates = {
                Passeio: normalizedName,
                updatedAt: serverTimestamp()
            };

            // Only update text fields if they have content in import
            if (item.Local) updates.Local = item.Local;
            if (item.Hora) updates.Hora = item.Hora;
            if (item.Taxas_info) updates.Taxas_info = item.Taxas_info;
            if (item.Comentarios) updates.Comentarios = item.Comentarios;
            if (item.Taxas_valor) updates.Taxas_valor = item.Taxas_valor;

            // Only update prices if import value > 0
            if (item.Valor_venda_COP > 0) updates.Valor_venda_COP = item.Valor_venda_COP;
            if (item.ENTRADA > 0) updates.ENTRADA = item.ENTRADA;
            if (item.Preco_custo_COP > 0) updates.Preco_custo_COP = item.Preco_custo_COP;

            try {
                await updateDoc(doc(db, "products", existing.id), updates);
                updatedCount++;
            } catch (err) {
                console.error(`Error updating ${normalizedName}: ${err.message}`);
            }
        } else {
            // ADD: New product
            const newProduct = {
                Passeio: normalizedName,
                Valor_venda_COP: item.Valor_venda_COP || 0,
                ENTRADA: item.ENTRADA || 0,
                Preco_custo_COP: item.Preco_custo_COP || 0,
                Local: item.Local || '',
                Hora: item.Hora || '',
                Taxas_info: item.Taxas_info || '',
                Taxas_valor: item.Taxas_valor || 0,
                Comentarios: item.Comentarios || '',
                updatedAt: serverTimestamp()
            };

            try {
                await addDoc(collection(db, "products"), newProduct);
                addedCount++;
                console.log(`  + Added: ${normalizedName}`);
            } catch (err) {
                console.error(`Error adding ${normalizedName}: ${err.message}`);
            }
        }
    }

    console.log(`\n--- Import Complete ---`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Added:   ${addedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Total:   ${updatedCount + addedCount + skippedCount}`);

    process.exit(0);
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
