const https = require('https');
const fs = require('fs');
const path = require('path');

let apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    try {
        const envPath = path.join(__dirname, '../.env.local');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/GEMINI_API_KEY=(.*)/);
            if (match && match[1]) {
                apiKey = match[1].trim();
            }
        }
    } catch (e) {
        console.error('Error reading .env.local:', e);
    }
}

if (!apiKey) {
    console.error('GEMINI_API_KEY could not be found');
    process.exit(1);
}

const MODEL = "imagen-4.0-fast-generate-001";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predict?key=${apiKey}`;

const payload = {
    instances: [
        {
            prompt: "A fitness illustration of a person doing pushups.",
        }
    ],
    parameters: {
        sampleCount: 1,
        // aspectRatio: "1:1", // Testing without first to see basic connectivity
    }
};

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};

const req = https.request(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log('Body:', data);
    });
});

req.on('error', (e) => {
    console.error('Request error:', e);
});

req.write(JSON.stringify(payload));
req.end();
