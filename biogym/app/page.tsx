import Link from "next/link";
import Image from "next/image";
import CTAButtons from "@/components/CTAButtons";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#1a1a1a] relative">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-athlete.png"
            alt="Athlete"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] via-[#1a1a1a]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-[#1a1a1a]/50" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 w-full">
          <div className="max-w-2xl">
            {/* Rating Badge */}
            <div className="badge animate-slide-up mb-8">
              <span className="stars">★★★★½</span>
              <span>4.5 AppStore Rating</span>
              <span>→</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              <span className="animate-slide-up inline-block">
                Smarter{" "}
                <span className="icon-pill mx-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M6 12H18M12 6V18" stroke="#D4FF00" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="gradient-text italic font-light">training</span>
              </span>
              <br />
              <span className="animate-slide-up-delay-1 inline-block">
                Rapid{" "}
                <span className="icon-pill mx-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M3 12L7 8L11 14L17 6L21 10" stroke="#D4FF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="gradient-text italic font-light">gains</span>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-gray-400 mb-10 animate-slide-up-delay-2 max-w-lg">
              Your body is almost there. We take you to the next level with AI anatomical analysis that uses{" "}
              <span className="underline-accent text-white">Muscle tissue</span>,{" "}
              <span className="underline-accent text-white">Fat tissue</span>, and{" "}
              <span className="underline-accent text-white">Machine Learning</span>{" "}
              to tailor workouts that take you beyond limits.
            </p>

            {/* CTA Button */}
            <CTAButtons variant="hero" />
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-float">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* What is BioGym Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] via-[#0f0f0f] to-[#1a1a1a]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="badge inline-flex mb-6">
              <span className="text-[#D4FF00]">AI-POWERED</span>
              <span>Physical Composition SaaS</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              The Future of <span className="gradient-text italic">Body Analysis</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              BioGym.ai is a professional AI-driven Physical Composition SaaS designed to help you
              visualize and track your physique evolution using advanced computer vision.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[
              { value: "98%", label: "Analysis Accuracy" },
              { value: "<2s", label: "Scan Time" },
              { value: "10+", label: "Muscle Groups" },
              { value: "100%", label: "Privacy Protected" },
            ].map((stat, i) => (
              <div key={i} className="feature-card text-center p-8">
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-gray-400 text-sm uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Core <span className="gradient-text italic">Capabilities</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powered by a custom Vision Engine, our AI performs non-invasive anatomical scans
              to deliver precise, actionable insights.
            </p>
          </div>


          {/* Feature 1: Vision-Based Physique Mapping */}
          <div className="feature-grid mb-20">
            <div className="feature-card p-8 md:p-12">
              <div className="feature-icon mb-6">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" stroke="#D4FF00" strokeWidth="2" />
                  <circle cx="24" cy="24" r="8" fill="#D4FF00" fillOpacity="0.2" stroke="#D4FF00" strokeWidth="2" />
                  <path d="M24 4V12M24 36V44M4 24H12M36 24H44" stroke="#D4FF00" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Vision-Based Physique Mapping</h3>
              <p className="text-gray-400 mb-8 text-lg">
                Upload a photo and our AI performs a complete non-invasive anatomical scan,
                mapping your muscle groups with surgical precision.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a]">
                  <div className="text-[#D4FF00] font-bold mb-2">Muscle Density</div>
                  <p className="text-gray-400 text-sm">Estimates tissue density for Chest, Arms, and Core on a 1-10 scale</p>
                </div>
                <div className="p-6 bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a]">
                  <div className="text-[#D4FF00] font-bold mb-2">Anatomical Hotspots</div>
                  <p className="text-gray-400 text-sm">Maps coordinates for Pectorals, Biceps, Abdominals with detailed feedback</p>
                </div>
                <div className="p-6 bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a]">
                  <div className="text-[#D4FF00] font-bold mb-2">Privacy Mask</div>
                  <p className="text-gray-400 text-sm">Auto-detects facial regions and applies high-fidelity blur protection</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Intelligent Training Protocols */}
          <div className="feature-grid mb-20">
            <div className="feature-card p-8 md:p-12">
              <div className="feature-icon mb-6">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M8 36L16 28L24 32L32 20L40 24" stroke="#D4FF00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M32 20H40V28" stroke="#D4FF00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="6" y="8" width="36" height="32" rx="4" stroke="#D4FF00" strokeWidth="2" strokeOpacity="0.3" />
                </svg>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Intelligent Training Protocols</h3>
              <p className="text-gray-400 mb-8 text-lg">
                The app doesn&apos;t just show data—it provides actionable insights based on your
                density scores and identified weak points.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#D4FF00]/10 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="#D4FF00">
                        <path d="M10 2L12.5 7H17.5L13.5 11L15 17L10 14L5 17L6.5 11L2.5 7H7.5L10 2Z" />
                      </svg>
                    </div>
                    <div className="text-white font-bold">Targeted Exercises</div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Specific movements like Weighted Dips and Hanging Leg Raises designed to
                    improve your identified weak points.
                  </p>
                </div>
                <div className="p-6 bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#D4FF00]/10 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="#D4FF00">
                        <rect x="2" y="4" width="16" height="12" rx="2" />
                      </svg>
                    </div>
                    <div className="text-white font-bold">Named Protocols</div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Custom-labeled routines like &quot;Definition &amp; Strength Maintenance&quot;
                    tailored to your current physical state.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4FF00]/5 via-transparent to-[#D4FF00]/5" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Built for <span className="gradient-text italic">Reliability</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Enterprise-grade technical architecture ensures your data is processed
              accurately and securely, every time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="feature-card p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#D4FF00]/10 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4FF00" strokeWidth="2">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                    <path d="M2 17L12 22L22 17" />
                    <path d="M2 12L12 17L22 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Hotspot Maps</h3>
              </div>
              <p className="text-gray-400">
                Using coordinates between 0.0 and 1.0 our AI analysis maps land perfectly
                on your body whether you&apos;re viewing on a phone or desktop, giving you unprecedented veiw of what our technology has picked up.
              </p>
            </div>

            <div className="feature-card p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#D4FF00]/10 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4FF00" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Secure API Handling</h3>
              </div>
              <p className="text-gray-400">
                Backend translates raw images into Base64 strings and uses strict JSON
                parsing to ensure the interface never crashes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How It <span className="gradient-text italic">Works</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload",
                description: "Take a photo or upload an existing image. Our privacy mask automatically protects your identity.",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#D4FF00" strokeWidth="2">
                    <rect x="4" y="4" width="24" height="24" rx="4" />
                    <path d="M4 22L12 14L18 20L28 10" />
                    <circle cx="22" cy="10" r="3" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Analyze",
                description: "Our Gemini-powered Vision Engine performs a complete anatomical scan in under 2 seconds.",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#D4FF00" strokeWidth="2">
                    <circle cx="16" cy="16" r="12" />
                    <path d="M16 8V16L22 22" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Transform",
                description: "Receive personalized training protocols and track your physique evolution over time.",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#D4FF00" strokeWidth="2">
                    <path d="M4 24L12 16L18 22L28 8" />
                    <path d="M20 8H28V16" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <div key={i} className="feature-card p-8 text-center relative overflow-hidden group">
                <div className="absolute top-4 right-4 text-6xl font-bold text-[#D4FF00]/10 group-hover:text-[#D4FF00]/20 transition-colors">
                  {item.step}
                </div>
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#D4FF00]/10 flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4FF00]/10 via-[#D4FF00]/5 to-[#D4FF00]/10" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Ready to <span className="gradient-text italic">Transform</span>?
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of athletes using AI to unlock their full potential.
            Start your physique evolution journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CTAButtons variant="section" />
            <Link href="/dashboard" className="btn-secondary text-lg px-10 py-4">
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 border-t border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Get in <span className="gradient-text italic">Touch</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Have questions about BioGym.ai? We&apos;d love to hear from you.
                Send us a message and we&apos;ll respond as soon as possible.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#D4FF00]/10 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4FF00" strokeWidth="2">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" />
                      <path d="M22 6L12 13L2 6" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Email</div>
                    <div className="text-white">hello@biogym.ai</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#D4FF00]/10 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4FF00" strokeWidth="2">
                      <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Location</div>
                    <div className="text-white">Sydney, Australia</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="feature-card p-8">
              <form className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4FF00] transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4FF00] transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4FF00] transition-colors resize-none"
                    placeholder="How can we help?"
                  />
                </div>
                <button type="submit" className="btn-primary w-full justify-center">
                  Send Message
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 10H15M15 10L10 5M15 10L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 text-white">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 12H24M8 20H24M12 8V24M20 8V24" stroke="#D4FF00" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className="text-xl font-bold">BioGym</span>
            </Link>

            {/* App Store Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link href="/sign-in" className="app-store-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                </svg>
                <div className="text-left">
                  <div className="text-[10px] text-gray-400">Download on the</div>
                  <div className="text-sm font-semibold">App Store</div>
                </div>
              </Link>
              <Link href="/sign-in" className="app-store-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M3.609 1.814L13.792 12L3.61 22.186C3.258 21.722 3.042 21.129 3.042 20.5V3.5C3.042 2.871 3.258 2.278 3.609 1.814ZM14.852 13.06L17.897 10.014L5.028 2.603L14.852 13.06ZM14.852 10.94L5.028 21.397L17.897 13.986L14.852 10.94ZM19.689 10.986L21.356 11.964C21.721 12.186 21.958 12.574 21.958 13C21.958 13.426 21.721 13.814 21.356 14.036L19.689 15.014L16.31 12L19.689 10.986Z" />
                </svg>
                <div className="text-left">
                  <div className="text-[10px] text-gray-400">GET IT ON</div>
                  <div className="text-sm font-semibold">Google Play</div>
                </div>
              </Link>
            </div>

            {/* Copyright */}
            <div className="text-gray-400 text-sm">
              © 2024 BioGym.ai. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
