"use client";

import React from "react";

const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-6 animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] leading-tight">
            Master Your{" "}
            <span className="text-[var(--accent-primary)]">Pitch</span>
            <br />
            With AI Feedback
          </h1>

          <p className="text-lg text-[var(--text-secondary)] max-w-lg mx-auto">
            Transform your presentation skills with real-time AI analysis. Get
            actionable insights on pacing, clarity, and delivery to captivate
            your audience every time.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <a
              href="#analyze"
              className="px-8 py-4 rounded-lg bg-[var(--accent-primary)] text-[var(--bg-primary)] font-semibold hover:bg-[var(--accent-primary-hover)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
            >
              Start Analyzing
            </a>
            <a
              href="/learn-more"
              className="px-8 py-4 rounded-lg border border-[var(--border-secondary)] text-[var(--text-primary)] font-semibold hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] hover:bg-[var(--accent-blue-subtle)] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export { HeroSection };
