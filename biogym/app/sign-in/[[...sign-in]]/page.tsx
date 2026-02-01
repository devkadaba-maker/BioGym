import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center relative overflow-hidden">
            {/* Background gradient effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4FF00]/5 via-transparent to-[#D4FF00]/5" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4FF00]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#D4FF00]/5 rounded-full blur-3xl" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-8">
                    <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 12H24M8 20H24M12 8V24M20 8V24" stroke="#D4FF00" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    <span className="text-2xl font-bold text-white">BioGym.fit</span>
                </div>

                <SignIn
                    appearance={{
                        elements: {
                            rootBox: "mx-auto",
                            card: "bg-[#252525] border border-[#333] shadow-2xl shadow-black/50",
                            headerTitle: "text-white",
                            headerSubtitle: "text-gray-400",
                            socialButtonsBlockButton: "bg-[#1a1a1a] border-[#333] text-white hover:bg-[#2a2a2a] hover:border-[#444]",
                            socialButtonsBlockButtonText: "text-white font-medium",
                            dividerLine: "bg-[#333]",
                            dividerText: "text-gray-500",
                            formFieldLabel: "text-gray-300",
                            formFieldInput: "bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-500 focus:border-[#D4FF00] focus:ring-[#D4FF00]/20",
                            formButtonPrimary: "bg-[#D4FF00] hover:bg-[#c4ef00] text-black font-semibold",
                            footerActionLink: "text-[#D4FF00] hover:text-[#c4ef00]",
                            identityPreviewEditButton: "text-[#D4FF00] hover:text-[#c4ef00]",
                            formFieldAction: "text-[#D4FF00] hover:text-[#c4ef00]",
                            alertText: "text-gray-300",
                            formFieldInputShowPasswordButton: "text-gray-400 hover:text-white",
                            otpCodeFieldInput: "bg-[#1a1a1a] border-[#333] text-white",
                            formResendCodeLink: "text-[#D4FF00] hover:text-[#c4ef00]",
                        },
                        variables: {
                            colorPrimary: "#D4FF00",
                            colorBackground: "#252525",
                            colorText: "#ffffff",
                            colorTextSecondary: "#9ca3af",
                            colorInputBackground: "#1a1a1a",
                            colorInputText: "#ffffff",
                            borderRadius: "12px",
                        },
                    }}
                />

                {/* Footer text */}
                <p className="mt-8 text-gray-500 text-sm">
                    Your physique evolution starts here
                </p>
            </div>
        </div>
    );
}
