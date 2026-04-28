import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'data', 'final_master_catalog.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const products = JSON.parse(rawData);

const normalized = products.map(p => {
    // 1. Normalize ID (from PROD-XXX to XXX as number)
    let newId = p.id;
    if (typeof p.id === 'string' && p.id.startsWith('PROD-')) {
        const numPart = p.id.split('-')[1];
        newId = parseInt(numPart, 10);
    }

    // 2. Normalize Numeric Fields
    const toNum = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        return parseFloat(String(val).replace(/[^\d.-]/g, '')) || 0;
    };

    // 3. Standardize Flags
    const hasVarTime = p.has_variable_time !== undefined ? p.has_variable_time : (p.has_variable_tim !== undefined ? p.has_variable_tim : false);

    return {
        ...p,
        id: newId,
        price_sale: toNum(p.price_sale),
        price_cost: toNum(p.price_cost),
        price_entry: toNum(p.price_entry),
        fees_value: toNum(p.fees_value),
        has_variable_time: hasVarTime,
        // Remove legacy key if it exists
        has_variable_tim: undefined 
    };
});

// Clean up undefineds from the map output
const cleanNormalized = JSON.parse(JSON.stringify(normalized));

fs.writeFileSync(filePath, JSON.stringify(cleanNormalized, null, 2), 'utf8');
console.log(`✅ Normalized ${cleanNormalized.length} products in final_master_catalog.json`);
