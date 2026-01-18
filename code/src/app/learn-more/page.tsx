"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/app/components/Navbar";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LearnMore() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      title: "Speech Analysis",
      description: "Upload your audio or video recording and get detailed insights on your speaking pace, filler words, and volume consistency.",
      bullets: [
        "Syllables per minute tracking",
        "Filler word detection (um, uh, like, etc.)",
        "Volume consistency analysis",
        "Interactive transcript with word-level feedback"
      ]
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: "Slide Deck Analysis",
      description: "Upload your presentation PDF and receive feedback on content structure, text density, and overall slide quality.",
      bullets: [
        "Word count per slide analysis",
        "Content density scoring",
        "Bullet point usage tracking",
        "Structure and clarity metrics"
      ]
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "AI-Powered Insights",
      description: "Get actionable feedback and suggestions powered by advanced AI to help you improve your presentation skills.",
      bullets: [
        "Personalized improvement suggestions",
        "Strengths and weaknesses breakdown",
        "Best practices recommendations",
        "Performance scoring with benchmarks"
      ]
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Upload Your Files",
      description: "Upload your audio/video recording of your speech, your slide deck PDF, or both for comprehensive analysis."
    },
    {
      number: "2",
      title: "Add Context",
      description: "Optionally add your presentation title and specific areas you'd like feedback on."
    },
    {
      number: "3",
      title: "Get Analysis",
      description: "Our AI processes your files and delivers detailed, actionable insights within moments."
    },
    {
      number: "4",
      title: "Improve & Repeat",
      description: "Apply the feedback, practice your presentation, and analyze again to track your progress."
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-24 transition-colors duration-300">
      {/* Navbar */}
      <Navbar
        brandName="Pitch Perfect"
        navItems={[
          { label: "Home", onClick: () => router.push("/") },
          { label: "Learn More", onClick: () => router.push("/learn-more") },
          { label: "Analyze", onClick: () => router.push("/#analyze") },
        ]}
        onThemeToggle={() => setIsDark(!isDark)}
        isDarkMode={isDark}
      />

      {/* Hero Section */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 mb-6">
            <svg className="w-4 h-4 text-[var(--accent-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-[var(--accent-blue)] font-medium">How It Works</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
            Master Your Presentations with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-blue-lighter)]">
              AI Coaching
            </span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Pitch Perfect analyzes your speech recordings and slide decks to provide
            personalized feedback that helps you become a more confident and effective presenter.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-blue)]/50 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-[var(--accent-blue)]/10 flex items-center justify-center text-[var(--accent-blue)] mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                {feature.title}
              </h3>
              <p className="text-[var(--text-secondary)] mb-4">
                {feature.description}
              </p>
              <ul className="space-y-2">
                {feature.bullets.map((bullet, bulletIndex) => (
                  <li key={bulletIndex} className="flex items-start gap-2 text-sm text-[var(--text-tertiary)]">
                    <svg className="w-4 h-4 mt-0.5 text-[var(--accent-blue)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* How It Works Steps */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] text-center mb-12">
            Simple 4-Step Process
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative animate-fade-in" style={{ animationDelay: `${index * 0.15}s` }}>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5 bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-blue-light)]" />
                )}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-blue-light)] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg shadow-[var(--accent-blue)]/30">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center p-10 rounded-2xl bg-gradient-to-r from-[var(--accent-blue)]/10 to-[var(--accent-blue-light)]/10 border border-[var(--accent-blue)]/20">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4">
            Ready to Perfect Your Pitch?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
            Start analyzing your presentations today and discover how AI-powered coaching
            can transform your public speaking skills.
          </p>
          <Link
            href="/#analyze"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-[var(--accent-blue)] text-white font-semibold hover:bg-[var(--accent-blue-hover)] transition-all duration-200 shadow-lg shadow-[var(--accent-blue)]/25 hover:shadow-xl hover:shadow-[var(--accent-blue)]/30 hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start Analyzing
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-primary)] mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <p className="text-center text-sm text-[var(--text-muted)]">
            Pitch Perfect - AI-powered presentation coaching
          </p>
        </div>
      </footer>
    </div>
  );
}
