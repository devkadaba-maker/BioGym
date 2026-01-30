const https = require('https');
const fs = require('fs');

const prompt = "fitness illustration of push up, chest focus, professional gym photography style";
const encodedPrompt = encodeURIComponent(prompt);
const randomSeed = 12345;
const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${randomSeed}&model=flux`;

console.log("Fetching:", imageUrl);

https.get(imageUrl, (res) => {
    console.log("Status:", res.statusCode);
    console.log("Headers:", res.headers);

    if (res.statusCode !== 200) {
        console.error("Failed to fetch");
        return;
    }

    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log("Buffer size:", buffer.length);
        const base64 = buffer.toString('base64');
        console.log("Base64 start:", base64.substring(0, 50));

        // Save to file to verify it's a real image
        fs.writeFileSync('test-image.jpg', buffer);
        console.log("Saved test-image.jpg");
    });
}).on('error', (e) => {
    console.error("Error:", e);
});
