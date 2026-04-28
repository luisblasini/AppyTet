const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'products_unified.json');

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
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  
  // Filter out the products in the removal list
  const filteredData = data.filter(product => !idsToRemove.includes(product.id));
  
  console.log(`Original DB size: ${data.length}`);
  console.log(`New DB size: ${filteredData.length}`);
  console.log(`Removed ${data.length - filteredData.length} invalid items.`);
  
  fs.writeFileSync(dbPath, JSON.stringify(filteredData, null, 2), 'utf8');
  console.log("Database successfully cleaned.");
} catch (error) {
  console.error("Error processing DB:", error);
}
