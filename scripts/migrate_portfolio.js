import { initializeApp } from "firebase/app";
import { getFirestore, collection, setDoc, doc } from "firebase/firestore";
import fs from 'fs';
import path from 'path';

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

const csvPath = './src/data/products_master.csv';
const csvData = fs.readFileSync(csvPath, 'utf8');

const lines = csvData.split('\n');
const headers = lines[0].split(',');

const products = [];

for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    // Very basic CSV parser (doesn't handle commas in quotes well, but let's see)
    // Actually products_master.csv HAS commas in quotes (e.g. Local field)
    // I will use a regex to split by comma NOT inside quotes
    const cols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    // Wait, that regex might be complex. Let's use a more robust one or just split manually carefully.

    // More robust simple CSV split for quoted strings
    const row = [];
    let current = '';
    let inQuotes = false;
    for (let char of lines[i]) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
            row.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    row.push(current.trim());

    if (row.length < headers.length) continue;

    const p = {};
    headers.forEach((h, index) => {
        let val = row[index] || '';
        // Convert numbers
        if (['Valor_venda_COP', 'Preco_custo_COP', 'ENTRADA', 'Taxas_valor'].includes(h.trim())) {
            val = parseFloat(val) || 0;
        }
        p[h.trim()] = val;
    });
    products.push(p);
}

async function seed() {
    console.log(`Starting migration of ${products.length} products...`);

    // Supplement with extracted PDF prices for Cartagena products that were in 0
    const pdfPrices = {
        "Sunset Sibarita Master": 250000,
        "Sunset Catamarã Bonavida": 230000,
        "Experiência Culinária": 420000,
        "Aula De Salsa": 190000,
        "Degustação De Cervejas": 300000,
        "Degustação De Rum Colombiano": 390000,
        "Tour No Mercadão + Aula De Culinária": 500000,
        "Degustação De Café Colombiano": 250000,
        "Top 3 Islas": 500000,
        "Pao Pao": 450000,
        "Bora Bora Beach Club": 450000,
        "Bora Bora Vip": 540000,
        "Corona Island": 850000,
        "Pa'ue": 520000,
        "Rosário De Mar": 450000,
        "Coralina Island Vip": 600000,
        "Isla Bela": 490000
    };

    products.forEach(p => {
        const nameKey = Object.keys(pdfPrices).find(k => p.Passeio.toLowerCase() === k.toLowerCase());
        if (nameKey && (p.Valor_venda_COP === 0 || !p.Valor_venda_COP)) {
            p.Valor_venda_COP = pdfPrices[nameKey];
        }
    });

    const colRef = collection(db, "products");

    // Upload CSV products (with PDF price updates)
    for (const p of products) {
        if (!p.ID) continue;
        const id = p.ID;
        await setDoc(doc(colRef, id), {
            ...p,
            updatedAt: new Date()
        });
        console.log(`Uploaded CSV Product: ${p.Passeio} (${id})`);
    }

    // Identify and upload PDF products that were NOT in the CSV
    const existingPasseios = products.map(p => p.Passeio.toLowerCase());
    for (const [name, price] of Object.entries(pdfPrices)) {
        if (!existingPasseios.includes(name.toLowerCase())) {
            const id = `PDF-${name.toUpperCase().replace(/\s+/g, '_')}`;
            await setDoc(doc(colRef, id), {
                ID: id,
                Passeio: name,
                Ciudad: "Cartagena",
                Valor_venda_COP: price,
                Preco_custo_COP: 0,
                ENTRADA: 0,
                updatedAt: new Date()
            });
            console.log(`Uploaded New PDF Product: ${name} (${id})`);
        }
    }

    console.log("Migration complete!");
    process.exit(0);
}

seed().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
