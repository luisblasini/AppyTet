import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const backupCollection = async (collectionName) => {
    console.log(`Backing up ${collectionName}...`);
    try {
        const q = query(collection(db, collectionName));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert timestamps if they exist
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
            updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
        }));

        const backupDir = path.join(__dirname, '../src/data/backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const filePath = path.join(backupDir, `${collectionName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✓ Saved ${data.length} documents to ${filePath}`);
    } catch (error) {
        console.error(`Error backing up ${collectionName}:`, error);
    }
};

async function run() {
    await backupCollection('confirmations');
    await backupCollection('contacts');
    process.exit(0);
}

run();
