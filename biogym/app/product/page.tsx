import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Features & Capabilities | BioGym.fit',
    description: 'Explore the AI-powered features of BioGym.fit. From anatomical heatmap visualization to personalized training protocols.',
}

export default function ProductPage() {
    return (
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-4">Product</h1>
                <p className="text-gray-400">Coming soon...</p>
            </div>
        </div>
    );
}
