import fetch from 'node-fetch';

const apiKey = 'AIzaSyAh6k_wZO0URet4L1SdX1l2dkDwr629WGM';
const model = 'gemini-1.5-flash';

async function test() {
    console.log(`Testing Gemini API with key: ${apiKey.substring(0, 8)}...`);
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Hello, are you working?' }] }]
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error(`Error ${response.status}:`, JSON.stringify(data, null, 2));
        } else {
            console.log('Success!', data.candidates?.[0]?.content?.parts?.[0]?.text);
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

test();
