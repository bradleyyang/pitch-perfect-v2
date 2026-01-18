"use client";

import { useState, useMemo, type ReactNode } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import type { PDFAnalysisResponse } from "@/app/services/api";

interface PDFAnalysisResultsProps {
  data: PDFAnalysisResponse;
  onReset: () => void;
}

const COLORS = {
  primary: "#3b82f6",
  secondary: "#60a5fa",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  cyan: "#06b6d4",
  chart: ["#3b82f6", "#10b981", "#f59e0b", "#60a5fa", "#06b6d4", "#ef4444"],
};

type TabType = "overview" | "slides" | "content" | "insights";

export function PDFAnalysisResults({ data, onReset }: PDFAnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [selectedSlide, setSelectedSlide] = useState<number | null>(null);

  const analysis = useMemo(() => {
    const pages = data.pages || [];
    const totalPages = data.total_pages || 0;

    // Calculate text statistics per slide
    const slideStats = pages.map((page) => {
      const text = page.text || "";
      const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
      const charCount = text.length;
      const lineCount = text.split("\n").filter((l) => l.trim().length > 0).length;
      const bulletPoints = (text.match(/^[\s]*[-•*]\s/gm) || []).length;
      const hasHeading = /^[A-Z][^.!?]*$/m.test(text);

      return {
        pageNumber: page.page_number,
        text,
        wordCount,
        charCount,
        lineCount,
        bulletPoints,
        hasHeading,
        contentDensity: wordCount > 0 ? Math.min(100, Math.round((wordCount / 50) * 100)) : 0,
      };
    });

    // Total statistics
    const totalWords = slideStats.reduce((sum, s) => sum + s.wordCount, 0);
    const totalChars = slideStats.reduce((sum, s) => sum + s.charCount, 0);
    const totalBullets = slideStats.reduce((sum, s) => sum + s.bulletPoints, 0);
    const avgWordsPerSlide = totalPages > 0 ? Math.round(totalWords / totalPages) : 0;

    // Word count distribution for bar chart
    const wordCountData = slideStats.map((s) => ({
      slide: `Slide ${s.pageNumber}`,
      words: s.wordCount,
    }));

    // Content density pie chart
    const densityCategories = {
      Light: slideStats.filter((s) => s.wordCount < 20).length,
      Moderate: slideStats.filter((s) => s.wordCount >= 20 && s.wordCount < 50).length,
      Dense: slideStats.filter((s) => s.wordCount >= 50 && s.wordCount < 100).length,
      "Very Dense": slideStats.filter((s) => s.wordCount >= 100).length,
    };

    const densityPieData = Object.entries(densityCategories)
      .filter(([, value]) => value > 0)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS.chart[index % COLORS.chart.length],
      }));

    // Calculate overall scores based on presentation best practices
    const structureScore = Math.min(100, Math.round(
      (totalBullets > 0 ? 30 : 0) +
      (avgWordsPerSlide >= 20 && avgWordsPerSlide <= 60 ? 40 : avgWordsPerSlide < 20 ? 20 : 10) +
      (totalPages >= 5 && totalPages <= 20 ? 30 : 15)
    ));

    const clarityScore = Math.min(100, Math.round(
      (avgWordsPerSlide <= 50 ? 50 : 25) +
      (slideStats.filter((s) => s.bulletPoints > 0).length / Math.max(1, totalPages)) * 50
    ));

    const contentScore = Math.min(100, Math.round(
      (totalWords >= 100 ? 40 : (totalWords / 100) * 40) +
      (totalPages >= 5 ? 30 : (totalPages / 5) * 30) +
      30
    ));

    const performanceData = [
      { metric: "Structure", value: structureScore, fullMark: 100 },
      { metric: "Clarity", value: clarityScore, fullMark: 100 },
      { metric: "Content", value: contentScore, fullMark: 100 },
      { metric: "Balance", value: Math.round(100 - (Math.abs(avgWordsPerSlide - 40) * 2)), fullMark: 100 },
      { metric: "Engagement", value: Math.round(70 + (totalBullets / Math.max(1, totalPages)) * 10), fullMark: 100 },
    ];

    const overallScore = Math.round(
      structureScore * 0.25 +
      clarityScore * 0.25 +
      contentScore * 0.25 +
      performanceData[3].value * 0.15 +
      performanceData[4].value * 0.1
    );

    return {
      pages,
      totalPages,
      slideStats,
      totalWords,
      totalChars,
      totalBullets,
      avgWordsPerSlide,
      wordCountData,
      densityPieData,
      performanceData,
      structureScore,
      clarityScore,
      contentScore,
      overallScore,
    };
  }, [data]);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const tabs: { id: TabType; label: string; icon: ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: "slides",
      label: "Slide Breakdown",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      id: "content",
      label: "Content Analysis",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "insights",
      label: "AI Insights",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header with Score */}
      <div className="bg-gradient-to-r from-[var(--accent-blue)]/20 to-[var(--accent-blue-light)]/20 rounded-2xl p-6 border border-[var(--accent-blue)]/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="var(--bg-tertiary)"
                  strokeWidth="8"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke={getScoreBgColor(analysis.overallScore)}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(analysis.overallScore / 100) * 251.2} 251.2`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                Slide Deck Quality Score
              </h3>
              <p className="text-[var(--text-secondary)]">
                {analysis.overallScore >= 80
                  ? "Excellent slide deck structure!"
                  : analysis.overallScore >= 60
                    ? "Good presentation with room for improvement"
                    : "Consider restructuring your slides"}
              </p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Analyze Another
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Total Slides</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {analysis.totalPages}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Total Words</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {analysis.totalWords}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Avg Words/Slide</p>
              <p className={`text-lg font-semibold ${
                analysis.avgWordsPerSlide >= 20 && analysis.avgWordsPerSlide <= 50 ? "text-green-400" : "text-yellow-400"
              }`}>
                {analysis.avgWordsPerSlide}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Bullet Points</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {analysis.totalBullets}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[var(--accent-blue)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Performance Radar */}
              <div>
                <h4 className="text-lg font-medium text-[var(--text-primary)] mb-4">Quality Metrics</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={analysis.performanceData}>
                      <PolarGrid stroke="var(--border-secondary)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "var(--text-tertiary)", fontSize: 10 }} />
                      <Radar
                        name="Score"
                        dataKey="value"
                        stroke={COLORS.secondary}
                        fill={COLORS.secondary}
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Content Density Pie */}
              <div>
                <h4 className="text-lg font-medium text-[var(--text-primary)] mb-4">Content Density Distribution</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analysis.densityPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={{ stroke: "var(--text-tertiary)" }}
                      >
                        {analysis.densityPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--bg-elevated)",
                          border: "1px solid var(--border-primary)",
                          borderRadius: "8px",
                          color: "var(--text-primary)",
                        }}
                        formatter={(value) => [`${value ?? 0} slides`, "Count"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div>
              <h4 className="text-lg font-medium text-[var(--text-primary)] mb-4">Score Breakdown</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--text-tertiary)]">Structure</span>
                    <span className={`text-lg font-bold ${getScoreColor(analysis.structureScore)}`}>
                      {analysis.structureScore}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--bg-primary)] rounded-full h-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${analysis.structureScore}%`,
                        backgroundColor: getScoreBgColor(analysis.structureScore),
                      }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--text-tertiary)]">Clarity</span>
                    <span className={`text-lg font-bold ${getScoreColor(analysis.clarityScore)}`}>
                      {analysis.clarityScore}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--bg-primary)] rounded-full h-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${analysis.clarityScore}%`,
                        backgroundColor: getScoreBgColor(analysis.clarityScore),
                      }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--text-tertiary)]">Content</span>
                    <span className={`text-lg font-bold ${getScoreColor(analysis.contentScore)}`}>
                      {analysis.contentScore}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--bg-primary)] rounded-full h-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${analysis.contentScore}%`,
                        backgroundColor: getScoreBgColor(analysis.contentScore),
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "slides" && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-[var(--text-primary)] mb-4">Words Per Slide</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysis.wordCountData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                    <XAxis dataKey="slide" tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} />
                    <YAxis tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--bg-elevated)",
                        border: "1px solid var(--border-primary)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                      }}
                    />
                    <Bar dataKey="words" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Slide Grid */}
            <div>
              <h4 className="text-lg font-medium text-[var(--text-primary)] mb-4">Slide Overview</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {analysis.slideStats.map((slide) => (
                  <button
                    key={slide.pageNumber}
                    onClick={() => setSelectedSlide(slide.pageNumber === selectedSlide ? null : slide.pageNumber)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedSlide === slide.pageNumber
                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                        : "border-[var(--border-primary)] bg-[var(--bg-tertiary)] hover:border-[var(--border-focus)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[var(--text-primary)]">Slide {slide.pageNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        slide.wordCount >= 20 && slide.wordCount <= 50
                          ? "bg-green-500/20 text-green-400"
                          : slide.wordCount < 20
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-orange-500/20 text-orange-400"
                      }`}>
                        {slide.wordCount} words
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] space-y-1">
                      <div className="flex justify-between">
                        <span>Lines:</span>
                        <span>{slide.lineCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bullets:</span>
                        <span>{slide.bulletPoints}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Slide Content */}
            {selectedSlide && (
              <div className="p-4 bg-[var(--accent-blue)]/10 rounded-lg border border-[var(--accent-blue)]/30">
                <h5 className="font-medium text-[var(--text-primary)] mb-3">
                  Slide {selectedSlide} Content
                </h5>
                <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-secondary)] text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {analysis.slideStats.find((s) => s.pageNumber === selectedSlide)?.text || "No content"}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "content" && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-[var(--text-primary)] mb-4">Full Content Preview</h4>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {analysis.pages.map((page) => {
                  const stats = analysis.slideStats.find((s) => s.pageNumber === page.page_number);
                  return (
                    <div
                      key={page.page_number}
                      className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-[var(--text-primary)]">
                          Slide {page.page_number}
                        </h5>
                        <div className="flex gap-2">
                          <span className="text-xs px-2 py-1 rounded bg-[var(--bg-secondary)] text-[var(--text-tertiary)]">
                            {stats?.wordCount || 0} words
                          </span>
                          {(stats?.bulletPoints || 0) > 0 && (
                            <span className="text-xs px-2 py-1 rounded bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]">
                              {stats?.bulletPoints} bullets
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                        {page.text || <span className="italic text-[var(--text-muted)]">No text content</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content Tips */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <h5 className="font-medium text-green-400 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Best Practices Observed
                </h5>
                <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                  {analysis.avgWordsPerSlide <= 50 && <li>Good text density per slide</li>}
                  {analysis.totalBullets > 0 && <li>Uses bullet points for clarity</li>}
                  {analysis.totalPages >= 5 && <li>Adequate number of slides</li>}
                  {analysis.slideStats.some((s) => s.wordCount >= 20 && s.wordCount <= 50) && (
                    <li>Some slides have optimal word count</li>
                  )}
                </ul>
              </div>

              <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                <h5 className="font-medium text-orange-400 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Suggestions
                </h5>
                <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                  {analysis.avgWordsPerSlide > 50 && <li>Consider reducing text per slide</li>}
                  {analysis.totalBullets === 0 && <li>Add bullet points for better structure</li>}
                  {analysis.totalPages < 5 && <li>Consider expanding your content</li>}
                  {analysis.slideStats.filter((s) => s.wordCount > 100).length > 0 && (
                    <li>{analysis.slideStats.filter((s) => s.wordCount > 100).length} slide(s) have too much text</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "insights" && (
          <div className="space-y-6">
            <div className="prose prose-invert max-w-none">
              <h4 className="text-lg font-medium text-[var(--text-primary)] mb-4">AI-Powered Analysis</h4>
              <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg whitespace-pre-wrap text-[var(--text-secondary)] leading-relaxed">
                {data.summary}
              </div>
            </div>

            {/* Delivery Tips */}
            <div className="p-4 bg-[var(--accent-blue)]/10 rounded-lg border border-[var(--accent-blue)]/30">
              <h5 className="font-medium text-[var(--accent-blue)] mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Presentation Tips
              </h5>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-[var(--text-secondary)]">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent-blue)]">1.</span>
                    Aim for 20-50 words per slide for optimal readability
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent-blue)]">2.</span>
                    Use bullet points to break up information
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent-blue)]">3.</span>
                    Keep one main idea per slide
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent-blue)]">4.</span>
                    Use visuals to complement text
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent-blue)]">5.</span>
                    Practice your delivery timing
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent-blue)]">6.</span>
                    Engage your audience with questions
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
