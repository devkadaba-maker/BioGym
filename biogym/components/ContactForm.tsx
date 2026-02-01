"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function ContactForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || "Message sent successfully!");
                setFormData({ name: "", email: "", message: "" });
            } else {
                toast.error(data.error || "Failed to send message");
            }
        } catch (error) {
            console.error("Contact form error:", error);
            toast.error("Failed to send message. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="feature-card p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4FF00] transition-colors"
                        placeholder="Your name"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Email</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4FF00] transition-colors"
                        placeholder="your@email.com"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Message</label>
                    <textarea
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4FF00] transition-colors resize-none"
                        placeholder="How can we help?"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="btn-primary w-full justify-center disabled:opacity-50 disabled:pointer-events-none"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Sending...
                        </>
                    ) : (
                        <>
                            Send Message
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M5 10H15M15 10L10 5M15 10L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
