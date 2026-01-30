import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { exerciseName, target, description } = body;

        if (!exerciseName) {
            return NextResponse.json(
                { error: "Exercise name is required" },
                { status: 400 }
            );
        }

        // Construct a detailed prompt for the exercise
        // Pollinations works best with descriptive prompts
        const prompt = `Teach me how to do a perfect ${exerciseName} through an image, ${target || "muscle"} focus, professional gym photography style, high quality, 4k, cinematic lighting, photorealistic, anatomical accuracy`;

        const encodedPrompt = encodeURIComponent(prompt);
        // Using Flux model for better realism, seed for some consistency (or random)
        const randomSeed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${randomSeed}&model=flux`;

        console.log("Fetching image from Pollinations:", imageUrl);

        const response = await fetch(imageUrl);

        if (!response.ok) {
            console.error("Pollinations API error:", response.status);
            return NextResponse.json(
                { error: `Pollinations API error: ${response.status}` },
                { status: response.status }
            );
        }

        const imageBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(imageBuffer).toString('base64');
        const mimeType = response.headers.get("content-type") || "image/jpeg";

        return NextResponse.json({
            success: true,
            image: `data:${mimeType};base64,${base64}`
        });

    } catch (error) {
        console.error("Image generation error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to generate image",
            },
            { status: 500 }
        );
    }
}
