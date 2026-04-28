import fs from 'fs';
import path from 'path';

const catalogPath = path.resolve('./src/data/final_master_catalog.json');
let data = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// 1. Correcciones manuales directas
data = data.map(p => {
    if (p.name === 'Isla Palma') {
        p.price_entry = 130000;
    }
    if (p.name === 'Rosario de Mar Abanico') {
        p.fees_value = 37500;
    }
    return p;
});

// 2. Corrección masiva de Typos
const fixTypos = (text) => {
    if (typeof text !== 'string') return text;
    return text
        .replace(/aapresentar/g, 'apresentar')
        .replace(/darã/g, 'dará')
        .replace(/assistãncia/g, 'assistência')
        .replace(/embarquee/g, 'embarque')
        .replace(/Rosãrio/g, 'Rosário');
};

data = data.map(p => {
    p.meet_point = fixTypos(p.meet_point);
    p.fees_info = fixTypos(p.fees_info);
    p.comments = fixTypos(p.comments);
    p.voucher_obs = fixTypos(p.voucher_obs);
    return p;
});

// 3. Sincronización Estricta de CHDs
// Excluimos todos los que tienen "chd" en cualquier formato para tener una lista de "Padres"
const parents = data.filter(p => !(p.name || '').toLowerCase().includes('chd'));

data = data.map(p => {
    const isChild = (p.name || '').toLowerCase().includes('chd');
    if (isChild) {
        // Encontrar el nombre base antes de "Chd" o "CHD"
        // Ejemplo: "Bona Vida Islas Chd..." -> "Bona Vida Islas"
        const nameParts = p.name.split(/chd/i);
        const childBase = nameParts[0].trim();
        
        // Buscar un padre que comience con esa misma base (Ej: "Bona Vida Islas Adulto")
        const parent = parents.find(parent => (parent.name || '').startsWith(childBase));
        
        if (parent) {
            console.log(`Sincronizando: [${p.name}] <== [${parent.name}]`);
            // Sincronización Forzada de Logística y Tasas
            p.meet_point = parent.meet_point;
            p.time = parent.time;
            p.fees_value = parent.fees_value;
            p.fees_info = parent.fees_info;
            p.city = parent.city;
        }
    }
    return p;
});

fs.writeFileSync(catalogPath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ Catálogo purgado exitosamente. Typos corregidos y CHDs sincronizados.');
