import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Pricing | BioGym.fit',
    description: 'Choose the perfect plan for your physique transformation journey. Simple pricing with a 7-day free trial.',
}

export default function PricingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
