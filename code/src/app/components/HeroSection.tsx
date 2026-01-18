"use client";

import React from "react";

const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text Content */}
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-blue)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-blue)]"></span>
              </span>
              <span className="text-sm text-[var(--accent-blue)] font-medium">
                AI-Powered Coaching
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] leading-tight">
              Master Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-blue-lighter)]">
                Pitch
              </span>
              <br />
              With AI Feedback
            </h1>

            <p className="text-lg text-[var(--text-secondary)] max-w-lg">
              Transform your presentation skills with real-time AI analysis. Get
              actionable insights on pacing, clarity, and delivery to captivate
              your audience every time.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href="#analyze"
                className="px-8 py-4 rounded-lg bg-[var(--accent-blue)] text-white font-semibold hover:bg-[var(--accent-blue-hover)] transition-all duration-200 shadow-lg shadow-[var(--accent-blue)]/25 hover:shadow-xl hover:shadow-[var(--accent-blue)]/30 hover:-translate-y-0.5"
              >
                Start Analyzing
              </a>
              <a
                href="/learn-more"
                className="px-8 py-4 rounded-lg border border-[var(--border-secondary)] text-[var(--text-primary)] font-semibold hover:bg-[var(--bg-secondary)] transition-all duration-200"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Right Side - Animation */}
          <div className="relative h-[500px] hidden lg:block">
            {/* Animated Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-blue)]/5 to-[var(--accent-blue-light)]/5 rounded-3xl blur-3xl"></div>

            {/* Central Presentation Screen */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-48 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] shadow-2xl animate-float">
              <div className="absolute top-0 left-0 right-0 h-8 bg-[var(--bg-tertiary)] rounded-t-xl flex items-center px-3 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="p-4 pt-10 space-y-3">
                <div className="h-3 bg-[var(--accent-blue)]/30 rounded w-3/4 animate-pulse"></div>
                <div className="h-2 bg-[var(--border-secondary)] rounded w-full"></div>
                <div className="h-2 bg-[var(--border-secondary)] rounded w-5/6"></div>
                <div className="h-2 bg-[var(--border-secondary)] rounded w-4/6"></div>
                <div className="flex gap-2 pt-2">
                  <div className="h-8 w-16 bg-[var(--accent-blue)]/20 rounded"></div>
                  <div className="h-8 w-20 bg-[var(--accent-blue-light)]/20 rounded"></div>
                </div>
              </div>
            </div>

            {/* Floating Microphone */}
            <div className="absolute top-16 left-8 w-16 h-16 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] shadow-lg flex items-center justify-center animate-float-delay-1">
              <svg
                className="w-8 h-8 text-[var(--accent-blue)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>

            {/* Audio Waveform */}
            <div className="absolute top-24 right-12 flex items-end gap-1 h-12">
              {[40, 70, 50, 90, 60, 80, 45, 75, 55].map((height, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-[var(--accent-blue)] to-[var(--accent-blue-lighter)] rounded-full animate-wave"
                  style={{
                    height: `${height}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                ></div>
              ))}
            </div>

            {/* AI Feedback Bubble */}
            <div className="absolute bottom-32 left-4 max-w-[200px] bg-[var(--bg-secondary)] rounded-2xl rounded-bl-none border border-[var(--border-primary)] shadow-lg p-4 animate-float-delay-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-blue-light)] flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[var(--accent-blue)]">
                  AI Coach
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Great pacing! Try adding a brief pause before your key points.
              </p>
            </div>

            {/* Progress Ring */}
            <div className="absolute bottom-20 right-8 w-20 h-20 animate-float-delay-3">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[var(--border-secondary)]"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[var(--accent-blue)] animate-progress"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray="85, 100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  85%
                </span>
              </div>
            </div>

            {/* Floating Chart */}
            <div className="absolute top-32 right-4 w-24 h-20 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] shadow-lg p-3 animate-float-delay-4">
              <div className="flex items-end justify-between h-full gap-1">
                {[30, 50, 40, 70, 60, 80].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-[var(--accent-blue)] to-[var(--accent-blue)]/50 rounded-t animate-grow"
                    style={{
                      height: `${height}%`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Sparkle Effects */}
            <div className="absolute top-10 right-32 w-2 h-2 bg-[var(--accent-blue)] rounded-full animate-sparkle"></div>
            <div
              className="absolute bottom-40 left-32 w-1.5 h-1.5 bg-[var(--accent-blue-light)] rounded-full animate-sparkle"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div
              className="absolute top-40 left-20 w-1 h-1 bg-[var(--accent-blue)] rounded-full animate-sparkle"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translate(-50%, -50%) translateY(0px);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-10px);
          }
        }
        @keyframes float-simple {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @keyframes wave {
          0%,
          100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(0.5);
          }
        }
        @keyframes progress {
          0% {
            stroke-dasharray: 0, 100;
          }
          100% {
            stroke-dasharray: 85, 100;
          }
        }
        @keyframes grow {
          0% {
            transform: scaleY(0);
            transform-origin: bottom;
          }
          100% {
            transform: scaleY(1);
            transform-origin: bottom;
          }
        }
        @keyframes sparkle {
          0%,
          100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delay-1 {
          animation: float-simple 3s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        .animate-float-delay-2 {
          animation: float-simple 3.5s ease-in-out infinite;
          animation-delay: 1s;
        }
        .animate-float-delay-3 {
          animation: float-simple 4s ease-in-out infinite;
          animation-delay: 1.5s;
        }
        .animate-float-delay-4 {
          animation: float-simple 3.2s ease-in-out infinite;
          animation-delay: 0.8s;
        }
        .animate-wave {
          animation: wave 1s ease-in-out infinite;
        }
        .animate-progress {
          animation: progress 2s ease-out forwards;
        }
        .animate-grow {
          animation: grow 1s ease-out forwards;
        }
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export { HeroSection };
