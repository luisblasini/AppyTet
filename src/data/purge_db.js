const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'products_unified.json');

// Lista exacta de 35 IDs basura identificados en la auditoría 
// (Se conservan intactos PROD-067, 068 y 069 de Fenix Decoração)
const idsToRemove = [
  "PROD-028", "PROD-057", "PROD-058", "PROD-063", "PROD-072", 
  "PROD-073", "PROD-074", "PROD-075", "PROD-076", "PROD-077", 
  "PROD-078", "PROD-079", "PROD-080", "PROD-081", "PROD-082", 
  "PROD-083", "PROD-084", "PROD-085", "PROD-086", "PROD-087", 
  "PROD-088", "PROD-089", "PROD-090", "PROD-091", "PROD-092", 
  "PROD-093", "PROD-094", "PROD-097", "PROD-098", "PROD-099", 
  "PROD-100", "PROD-101", "PROD-102", "PROD-103", "PROD-104"
];

try {
  console.log("Iniciando purga quirúrgica de products_unified.json...");
  
  // Leer la base de datos
  const rawData = fs.readFileSync(dbPath, 'utf8');
  const data = JSON.parse(rawData);
  const initialCount = data.length;
  
  // Filtrar los elementos
  const filteredData = data.filter(product => !idsToRemove.includes(product.id));
  const finalCount = filteredData.length;
  
  if (initialCount === finalCount) {
    console.log("⚠️ No se encontraron IDs basura para eliminar. La base de datos ya está limpia.");
  } else {
    // Sobrescribir de forma segura
    fs.writeFileSync(dbPath, JSON.stringify(filteredData, null, 2), 'utf8');
    console.log(`✅ ¡Purga Exitosa!`);
    console.log(`📉 Registros originales: ${initialCount}`);
    console.log(`🗑️ Registros eliminados: ${initialCount - finalCount}`);
    console.log(`📈 Registros oficiales restantes: ${finalCount}`);
  }
} catch (error) {
  console.error("❌ Error CRÍTICO procesando la BD:", error.message);
}
