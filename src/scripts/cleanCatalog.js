import fs from 'fs';
import path from 'path';

const filePath = 'C:/Users/User/OneDrive/Escritorio/PROJETOS/07_TET/AppyTET_v4/src/data/products_unified.json';

const cleanProducts = () => {
    const rawData = fs.readFileSync(filePath, 'utf8');
    let products = JSON.parse(rawData);

    console.log(`Original count: ${products.length}`);

    // 1. Filtrar duplicados órfãos ou sem dados
    // - Removemos "Rosario de Mar" (sem sufixo de plano) se o preço for 0 ou se já existirem versões com plano.
    // - Fazemos o mesmo para "Bora Bora" vs "BORA BORA CLUB".
    
    const productsToKeep = products.filter(p => {
        const name = p.Passeio.toLowerCase();
        
        // Regra Rosario de Mar: se for o nome genérico "rosario de mar" e tiver preço 0, remove.
        if (name === 'rosario de mar' && p.Valor_venda_COP === 0) return false;
        
        // Regra Bora Bora: idem.
        if (name === 'bora bora' && p.Valor_venda_COP === 0) return false;

        return true;
    });

    // 2. Padronização de Cidades
    const standardized = productsToKeep.map(p => ({
        ...p,
        Ciudad: p.Ciudad === 'Cartagena' ? 'Cartagena' : 
                p.Ciudad === 'Bogot\u00e1' || p.Ciudad === 'Bogota' ? 'Bogot\u00e1' : 
                p.Ciudad === 'San Andr\u00e9s' || p.Ciudad === 'San Andres' ? 'San Andr\u00e9s' : p.Ciudad
    }));

    fs.writeFileSync(filePath, JSON.stringify(standardized, null, 2), 'utf8');
    console.log(`Final count: ${standardized.length}`);
    console.log('Limpeza concluída com sucesso!');
};

cleanProducts();
