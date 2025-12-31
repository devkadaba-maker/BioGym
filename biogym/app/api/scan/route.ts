import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeminiMasterSystemPrompt } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";
import { extractJson } from "@/lib/gemini";

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);


export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData(); // Fixed: await request.formData()
        const imageFile = formData.get('image') as File;

        if (!imageFile) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        const imageBuffer = await imageFile.arrayBuffer();
        const base64 = Buffer.from(imageBuffer).toString('base64');

        const model = genAi.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: GeminiMasterSystemPrompt
        });

        const result = await model.generateContent([
            { text: "Analyze this image with precision. Respond with valid JSON only." }, // Better prompt for JSON
            { inlineData: { data: base64, mimeType: imageFile.type } }
        ]);

        // Safe text extraction - handles multi-part responses [web:45]
        const text = result.response.text?.() || '';
        if (!text) {
            return NextResponse.json({ error: 'No response from Gemini' }, { status: 500 });
        }

        const parsedData = extractJson(text);
        return NextResponse.json(parsedData);
    } catch (error) {
        console.error('Gemini API error:', error);
        return NextResponse.json({ error: 'Image analysis failed' }, { status: 500 });
    }
}
