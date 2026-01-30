import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { GeminiMasterSystemPrompt } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";
import { extractJson } from "@/lib/gemini";
import { auth } from "@clerk/nextjs/server";
import { saveScanResult } from "@/lib/firestore";

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Image region mapping for clear labeling
const REGION_LABELS: Record<string, string> = {
    'physique': 'TORSO/CHEST IMAGE - Use this to analyze chest and core regions',
    'left-arm': 'LEFT ARM IMAGE - Use this to analyze the left arm (bicep, tricep, forearm)',
    'right-arm': 'RIGHT ARM IMAGE - Use this to analyze the right arm (bicep, tricep, forearm)',
    'left-leg': 'LEFT LEG IMAGE - Use this to analyze the left leg (quad, hamstring, calf)',
    'right-leg': 'RIGHT LEG IMAGE - Use this to analyze the right leg (quad, hamstring, calf)',
};

export async function POST(request: NextRequest) {
    console.log("\n========================================");
    console.log("[SCAN API] 📸 New scan request received");
    console.log("========================================");

    try {
        const formData = await request.formData();

        // Debug: Log all form data keys to see what was actually received
        const allKeys = Array.from(formData.keys());
        console.log("[SCAN API] FormData keys received:", allKeys);

        // Collect all images from the form data
        const imageParts: Part[] = [];
        const imageDescriptions: string[] = [];

        // Check for multi-image format (image-physique, image-left-arm, etc.)
        for (const [regionId, label] of Object.entries(REGION_LABELS)) {
            const imageFile = formData.get(`image-${regionId}`) as File | null;
            if (imageFile) {
                console.log(`[SCAN API] ✅ Found image for region: ${regionId} (${(imageFile.size / 1024).toFixed(1)}KB)`);
                const imageBuffer = await imageFile.arrayBuffer();
                const base64 = Buffer.from(imageBuffer).toString('base64');

                // Add text label before each image
                imageParts.push({ text: `\n[${label}]\n` });
                imageParts.push({
                    inlineData: {
                        data: base64,
                        mimeType: imageFile.type || 'image/jpeg'
                    }
                });
                imageDescriptions.push(regionId);
            }
        }

        // Fallback: check for single 'image' field (backward compatibility)
        if (imageParts.length === 0) {
            const singleImage = formData.get('image') as File | null;
            if (singleImage) {
                console.log(`[SCAN API] Using single image fallback (${(singleImage.size / 1024).toFixed(1)}KB)`);
                const imageBuffer = await singleImage.arrayBuffer();
                const base64 = Buffer.from(imageBuffer).toString('base64');
                imageParts.push({ text: '\n[FULL BODY IMAGE - Analyze all visible regions]\n' });
                imageParts.push({
                    inlineData: {
                        data: base64,
                        mimeType: singleImage.type || 'image/jpeg'
                    }
                });
                imageDescriptions.push('full-body');
            }
        }

        if (imageParts.length === 0) {
            console.log("[SCAN API] ❌ No images found in request");
            return NextResponse.json({ error: 'No images provided' }, { status: 400 });
        }

        console.log(`[SCAN API] 📤 Sending ${imageDescriptions.length} images to Gemini: [${imageDescriptions.join(', ')}]`);

        const model = genAi.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: GeminiMasterSystemPrompt
        });

        // Build the analysis prompt
        const analysisPrompt = `You are receiving ${imageDescriptions.length} labeled image(s) for physique analysis.

CRITICAL INSTRUCTIONS:
1. Each image is labeled with which body region it shows (e.g., "LEFT ARM IMAGE", "TORSO/CHEST IMAGE")
2. Use ONLY the corresponding image to analyze each body region
3. For the "arms" field in Details, use the LEFT ARM IMAGE for "left" and RIGHT ARM IMAGE for "right"
4. For the "legs" field in Details, use the LEFT LEG IMAGE for "left" and RIGHT LEG IMAGE for "right"
5. For "chest" and "core" in Details, use the TORSO/CHEST IMAGE
6. If a specific image is not provided, state "Image not provided for this region" in the Details
7. Provide accurate, region-specific analysis based on what you can ACTUALLY SEE in each image
8. Do NOT copy the same analysis text across different body parts

Analyze these images with precision. Provide density scores, hotspots with coordinates, exercise recommendations, and detailed analysis for each body region. Respond with valid JSON only.`;

        console.log("[SCAN API] ⏳ Waiting for Gemini response...");
        const startTime = Date.now();

        const result = await model.generateContent([
            { text: analysisPrompt },
            ...imageParts
        ]);

        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[SCAN API] ✅ Gemini responded in ${elapsedTime}s`);

        const text = result.response.text?.() || '';
        console.log("[SCAN API] Gemini raw response preview:", text.substring(0, 200) + "...");

        if (!text) {
            console.log("[SCAN API] ❌ Empty response from Gemini");
            return NextResponse.json({ error: 'No response from Gemini' }, { status: 500 });
        }

        const jsonString = extractJson(text);
        console.log("[SCAN API] Extracted JSON length:", jsonString.length, "chars");

        try {
            const parsedData = JSON.parse(jsonString);
            console.log("[SCAN API] ✅ JSON parsed successfully");
            console.log("[SCAN API] Analysis status:", parsedData.status);

            if (parsedData.analysis) {
                console.log("[SCAN API] Density scores:", {
                    chest: parsedData.analysis.chest_density,
                    arms: parsedData.analysis.arms_density,
                    legs: parsedData.analysis.legs_density,
                    core: parsedData.analysis.core_density,
                    primary_weakness: parsedData.analysis.primary_weakness
                });
            }

            // Save to Firestore if user is authenticated
            console.log("\n[FIRESTORE] 🔥 Attempting to save scan result...");
            try {
                const { userId } = await auth();
                console.log("[FIRESTORE] User ID from auth():", userId || "NOT AUTHENTICATED");

                if (userId && parsedData.status === 'success' && parsedData.analysis) {
                    console.log("[FIRESTORE] ⏳ Saving to Firestore...");
                    const saveStartTime = Date.now();
                    const scanId = await saveScanResult(userId, parsedData);
                    const saveElapsedTime = Date.now() - saveStartTime;
                    console.log(`[FIRESTORE] ✅ Scan saved successfully!`);
                    console.log(`[FIRESTORE] Scan ID: ${scanId}`);
                    console.log(`[FIRESTORE] Save time: ${saveElapsedTime}ms`);
                    // Add scanId to response for reference
                    parsedData.scanId = scanId;
                } else {
                    console.log("[FIRESTORE] ⚠️ Skipping save - conditions not met:");
                    console.log("  - userId exists:", !!userId);
                    console.log("  - status is success:", parsedData.status === 'success');
                    console.log("  - analysis exists:", !!parsedData.analysis);
                }
            } catch (firestoreError) {
                console.error("[FIRESTORE] ❌ Save failed (non-fatal):", firestoreError);
                if (firestoreError instanceof Error) {
                    console.error("[FIRESTORE] Error message:", firestoreError.message);
                    console.error("[FIRESTORE] Error stack:", firestoreError.stack);
                }
            }

            console.log("\n[SCAN API] 📤 Sending response to client");
            console.log("========================================\n");
            return NextResponse.json(parsedData);
        } catch (parseError) {
            console.error('[SCAN API] ❌ JSON parse error:', parseError);
            console.error('[SCAN API] Raw JSON that failed:', jsonString.substring(0, 500));
            return NextResponse.json({
                error: 'Failed to parse analysis response',
                rawResponse: jsonString.substring(0, 500)
            }, { status: 500 });
        }
    } catch (error) {
        console.error('[SCAN API] ❌ Fatal error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            error: 'Image analysis failed',
            details: errorMessage
        }, { status: 500 });
    }
}

