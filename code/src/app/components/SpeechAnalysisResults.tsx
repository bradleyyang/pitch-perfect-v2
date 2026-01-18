"use client";

import { useState, useMemo, type ReactNode } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
} from "recharts";
import type { AudioAnalysisResponse, WordAnalysis } from "@/app/services/api";
import { calculateSpeedDistribution, calculateAverageSPM } from "@/app/services/api";

interface SpeechAnalysisResultsProps {
  data: AudioAnalysisResponse;
  onReset: () => void;
}

const FILLER_WORDS = new Set(["um", "uh", "like", "so", "actually", "you know"]);

const COLORS = {
  primary: "#3b82f6",
  secondary: "#60a5fa",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  cyan: "#06b6d4",
  chart: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#60a5fa", "#06b6d4"],
  speed: {
    "Too Slow": "#ef4444",
    "Ideal": "#10b981",
    "Fast": "#f59e0b",
    "Too Fast": "#ef4444",
  },
};

type TabType = "overview" | "transcript" | "timeline" | "loudness" | "insights";

export function SpeechAnalysisResults({ data, onReset }: SpeechAnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [selectedWord, setSelectedWord] = useState<WordAnalysis | null>(null);

  const analysis = useMemo(() => {
    const words = data.word_analysis || [];
    const transcript = data.transcription || "";
    const timestamps = data.timestamps || [];
    const loudnessData = data.loudness || [];

    // Calculate statistics
    const totalWords = words.length;
    const fillerWords = words.filter((w) => FILLER_WORDS.has(w.word.toLowerCase()));
    const fillerCount = fillerWords.length;
    const fillerPercentage = totalWords > 0 ? (fillerCount / totalWords) * 100 : 0;

    // Speed distribution
    const speedDistribution = calculateSpeedDistribution(words);
    const avgSPM = calculateAverageSPM(words);

    // Calculate duration from timestamps
    const duration = timestamps.length > 0 ? timestamps[timestamps.length - 1][0] : 0;

    // Words per minute (based on actual word count and duration)
    const wpm = duration > 0 ? (totalWords / duration) * 60 : 0;

    // Ideal percentage
    const idealCount = speedDistribution["Ideal"];
    const idealPercentage = totalWords > 0 ? (idealCount / totalWords) * 100 : 0;

    // Speed distribution for pie chart
    const speedPieData = [
      { name: "Too Slow", value: speedDistribution["Too Slow"], color: COLORS.speed["Too Slow"] },
      { name: "Ideal", value: speedDistribution["Ideal"], color: COLORS.speed["Ideal"] },
      { name: "Fast", value: speedDistribution["Fast"], color: COLORS.speed["Fast"] },
      { name: "Too Fast", value: speedDistribution["Too Fast"], color: COLORS.speed["Too Fast"] },
    ].filter((item) => item.value > 0);

    // SPM over time data (from timestamps)
    const spmTimelineData = timestamps.map(([time, spm], index) => ({
      time: time.toFixed(1),
      spm: Math.round(spm),
      index,
    }));

    // Sample SPM data if too many points (for performance)
    const sampledSpmData = spmTimelineData.length > 100
      ? spmTimelineData.filter((_, i) => i % Math.ceil(spmTimelineData.length / 100) === 0)
      : spmTimelineData;

    // Loudness over time data
    const loudnessTimelineData = loudnessData.map(([time, db]) => ({
      time: time.toFixed(1),
      db: Math.round(db * 10) / 10,
    }));

    // Sample loudness data if too many points
    const sampledLoudnessData = loudnessTimelineData.length > 200
      ? loudnessTimelineData.filter((_, i) => i % Math.ceil(loudnessTimelineData.length / 200) === 0)
      : loudnessTimelineData;

    // Average loudness
    const avgLoudness = loudnessData.length > 0
      ? loudnessData.reduce((sum, [, db]) => sum + db, 0) / loudnessData.length
      : 0;

    // Loudness variance (for consistency metric)
    const loudnessVariance = loudnessData.length > 0
      ? Math.sqrt(
          loudnessData.reduce((sum, [, db]) => sum + Math.pow(db - avgLoudness, 2), 0) /
            loudnessData.length
        )
      : 0;

    // Word frequency for bar chart
    const wordFrequency: Record<string, number> = {};
    words.forEach((w) => {
      const word = w.word.toLowerCase().replace(/[^a-z]/g, "");
      if (word.length > 3 && !FILLER_WORDS.has(word)) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    });
    const topWords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word, count]) => ({ word, count }));

    // Radar chart data for overall performance
    const performanceData = [
      { metric: "Pace", value: Math.min(100, Math.round(idealPercentage)), fullMark: 100 },
      { metric: "Fluency", value: Math.round(Math.max(0, 100 - fillerPercentage * 10)), fullMark: 100 },
      { metric: "Consistency", value: Math.round(Math.max(0, 100 - loudnessVariance * 5)), fullMark: 100 },
      { metric: "Volume", value: Math.round(Math.max(0, Math.min(100, 100 + avgLoudness * 2))), fullMark: 100 },
      { metric: "Content", value: Math.min(100, Math.round((totalWords / 100) * 50 + 50)), fullMark: 100 },
    ];

    return {
      words,
      transcript,
      timestamps,
      loudnessData,
      totalWords,
      fillerCount,
      fillerPercentage,
      speedDistribution,
      avgSPM,
      duration,
      wpm,
      idealPercentage,
      speedPieData,
      sampledSpmData,
      sampledLoudnessData,
      avgLoudness,
      loudnessVariance,
      topWords,
      performanceData,
      fillerWords,
    };
  }, [data]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getSpeedColorClass = (speed: string): string => {
    switch (speed) {
      case "Too Slow":
        return "bg-red-500/20 text-red-400";
      case "Ideal":
        return "bg-green-500/20 text-green-400";
      case "Fast":
        return "bg-yellow-500/20 text-yellow-400";
      case "Too Fast":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  // Overall score calculation
  const overallScore = Math.round(
    analysis.idealPercentage * 0.35 +
    Math.max(0, 100 - analysis.fillerPercentage * 10) * 0.25 +
    Math.max(0, 100 - analysis.loudnessVariance * 5) * 0.2 +
    Math.min(100, (analysis.totalWords / 100) * 50 + 50) * 0.2
  );

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
      id: "transcript",
      label: "Transcript",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "timeline",
      label: "Pace Timeline",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      id: "loudness",
      label: "Volume Analysis",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
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
                  stroke={overallScore >= 80 ? "#10b981" : overallScore >= 60 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(overallScore / 100) * 251.2} 251.2`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                  {overallScore}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                Overall Performance Score
              </h3>
              <p className="text-[var(--text-secondary)]">
                {overallScore >= 80
                  ? "Excellent presentation delivery!"
                  : overallScore >= 60
                    ? "Good performance with room for improvement"
                    : "Keep practicing to improve your delivery"}
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Duration</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {formatDuration(analysis.duration)}
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
              <p className="text-xs text-[var(--text-tertiary)]">Words</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Avg SPM</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {Math.round(analysis.avgSPM)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Ideal Pace</p>
              <p className="text-lg font-semibold text-green-400">
                {Math.round(analysis.idealPercentage)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Fillers</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {analysis.fillerCount}
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
                <h4 className="text-lg font-medium text-[var(--text-primary)] mb-4">Performance Metrics</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={analysis.performanceData}>
                      <PolarGrid stroke="var(--border-secondary)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "var(--text-tertiary)", fontSize: 10 }} />
                      <Radar
                        name="Score"
                        dataKey="value"
                        stroke={COLORS.primary}
                        fill={COLORS.primary}
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Speed Distribution Pie */}
              <div>
                <h4 className="text-lg font-medium text-[var(--text-primary)] mb-4">Pace Distribution</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analysis.speedPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={{ stroke: "var(--text-tertiary)" }}
                      >
                        {analysis.speedPieData.map((entry, index) => (
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
                        formatter={(value) => [`${value ?? 0} words`, "Count"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Speed Distribution Bar */}
            <div>
              <h4 className="text-lg font-medium text-[var(--text-primary)] mb-4">Speed Breakdown</h4>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(analysis.speedDistribution).map(([speed, count]) => (
                  <div
                    key={speed}
                    className={`p-4 rounded-lg border ${
                      speed === "Ideal"
                        ? "border-green-500/30 bg-green-500/10"
                        : speed === "Fast"
                          ? "border-yellow-500/30 bg-yellow-500/10"
                          : "border-red-500/30 bg-red-500/10"
                    }`}
                  >
                    <p className="text-sm text-[var(--text-tertiary)]">{speed}</p>
                    <p className={`text-2xl font-bold ${
                      speed === "Ideal" ? "text-green-400" : speed === "Fast" ? "text-yellow-400" : "text-red-400"
                    }`}>
                      {count}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {analysis.totalWords > 0 ? Math.round((count / analysis.totalWords) * 100) : 0}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Used Words */}
            {analysis.topWords.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-[var(--text-primary)] mb-4">Most Used Words</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.topWords} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                      <XAxis type="number" tick={{ fill: "var(--text-tertiary)", fontSize: 12 }} />
                      <YAxis dataKey="word" type="category" width={80} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--bg-elevated)",
                          border: "1px solid var(--border-primary)",
                          borderRadius: "8px",
                          color: "var(--text-primary)",
                        }}
                      />
                      <Bar dataKey="count" fill={COLORS.secondary} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Filler Word Breakdown */}
            {analysis.fillerCount > 0 && (
              <div>
                <h4 className="text-lg font-medium text-[var(--text-primary)] mb-4">Filler Word Analysis</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(analysis.fillerWords.map((w) => w.word.toLowerCase()))).map((word) => {
                    const count = analysis.fillerWords.filter((w) => w.word.toLowerCase() === word).length;
                    return (
                      <span
                        key={word}
                        className="px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-400 text-sm font-medium"
                      >
                        &quot;{word}&quot; x{count}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "transcript" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-[var(--text-primary)]">Full Transcript</h4>
              <div className="flex items-center gap-4 text-sm text-[var(--text-tertiary)]">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-orange-500/30"></span> Filler
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-500/30"></span> Ideal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-yellow-500/30"></span> Fast
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-500/30"></span> Too Slow/Fast
                </span>
              </div>
            </div>

            <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg max-h-96 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {analysis.words.map((word, index) => {
                  const isFiller = FILLER_WORDS.has(word.word.toLowerCase());
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedWord(word)}
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        isFiller
                          ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                          : selectedWord === word
                            ? "bg-[var(--accent-blue)]/30 text-[var(--accent-blue)]"
                            : `${getSpeedColorClass(word.speed)} hover:opacity-80`
                      }`}
                    >
                      {word.word}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedWord && (
              <div className="p-4 bg-[var(--accent-blue)]/10 rounded-lg border border-[var(--accent-blue)]/30">
                <h5 className="font-medium text-[var(--text-primary)] mb-2">Word Details</h5>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-[var(--text-tertiary)]">Word:</span>
                    <span className="ml-2 text-[var(--text-primary)] font-medium">{selectedWord.word}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)]">Speed:</span>
                    <span className={`ml-2 font-medium ${
                      selectedWord.speed === "Ideal" ? "text-green-400" :
                      selectedWord.speed === "Fast" ? "text-yellow-400" : "text-red-400"
                    }`}>
                      {selectedWord.speed}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)]">SPM:</span>
                    <span className="ml-2 text-[var(--text-primary)]">
                      {Math.round(selectedWord.syllables_per_minute)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Plain transcript */}
            <div className="mt-6">
              <h5 className="font-medium text-[var(--text-primary)] mb-2">Plain Text</h5>
              <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-secondary)] leading-relaxed">
                {analysis.transcript}
              </div>
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-[var(--text-primary)] mb-2">Speaking Pace Over Time</h4>
              <p className="text-sm text-[var(--text-tertiary)] mb-4">
                Syllables per minute (SPM) throughout your presentation. Ideal range: 130-300 SPM
              </p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analysis.sampledSpmData}>
                    <defs>
                      <linearGradient id="spmGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                      label={{ value: "Time (s)", position: "insideBottom", offset: -5, fill: "var(--text-tertiary)" }}
                    />
                    <YAxis
                      tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                      label={{ value: "SPM", angle: -90, position: "insideLeft", fill: "var(--text-tertiary)" }}
                      domain={[0, "auto"]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--bg-elevated)",
                        border: "1px solid var(--border-primary)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                      }}
                      formatter={(value) => [`${value ?? 0} SPM`, "Pace"]}
                      labelFormatter={(label) => `Time: ${label}s`}
                    />
                    {/* Reference lines for ideal range */}
                    <Area
                      type="monotone"
                      dataKey="spm"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      fill="url(#spmGradient)"
                      name="SPM"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-red-500"></span>
                  Too Slow (&lt;130)
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-green-500"></span>
                  Ideal (130-300)
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-yellow-500"></span>
                  Fast (300-400)
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-red-500"></span>
                  Too Fast (&gt;400)
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "loudness" && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-[var(--text-primary)] mb-2">Volume Over Time</h4>
              <p className="text-sm text-[var(--text-tertiary)] mb-4">
                Audio loudness in decibels (dB) relative to peak. Consistent volume indicates steady delivery.
              </p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analysis.sampledLoudnessData}>
                    <defs>
                      <linearGradient id="loudnessGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                      label={{ value: "Time (s)", position: "insideBottom", offset: -5, fill: "var(--text-tertiary)" }}
                    />
                    <YAxis
                      tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                      label={{ value: "dB", angle: -90, position: "insideLeft", fill: "var(--text-tertiary)" }}
                      domain={["auto", 0]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--bg-elevated)",
                        border: "1px solid var(--border-primary)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                      }}
                      formatter={(value) => [`${value ?? 0} dB`, "Volume"]}
                      labelFormatter={(label) => `Time: ${label}s`}
                    />
                    <Area
                      type="monotone"
                      dataKey="db"
                      stroke={COLORS.secondary}
                      strokeWidth={2}
                      fill="url(#loudnessGradient)"
                      name="Loudness"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Volume Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                <p className="text-sm text-[var(--text-tertiary)]">Average Volume</p>
                <p className="text-xl font-semibold text-[var(--text-primary)]">
                  {Math.round(analysis.avgLoudness)} dB
                </p>
              </div>
              <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                <p className="text-sm text-[var(--text-tertiary)]">Volume Variance</p>
                <p className={`text-xl font-semibold ${
                  analysis.loudnessVariance < 5 ? "text-green-400" :
                  analysis.loudnessVariance < 10 ? "text-yellow-400" : "text-red-400"
                }`}>
                  {Math.round(analysis.loudnessVariance * 10) / 10}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {analysis.loudnessVariance < 5 ? "Very consistent" :
                   analysis.loudnessVariance < 10 ? "Somewhat varied" : "Highly varied"}
                </p>
              </div>
              <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                <p className="text-sm text-[var(--text-tertiary)]">Consistency Score</p>
                <p className={`text-xl font-semibold ${getScoreColor(Math.max(0, 100 - analysis.loudnessVariance * 5))}`}>
                  {Math.round(Math.max(0, 100 - analysis.loudnessVariance * 5))}%
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "insights" && (
          <div className="space-y-6">
            <div className="prose prose-invert max-w-none">
              <h4 className="text-lg font-medium text-[var(--text-primary)] mb-4">AI-Powered Feedback</h4>
              <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg whitespace-pre-wrap text-[var(--text-secondary)] leading-relaxed">
                {data.summary}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <h5 className="font-medium text-green-400 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Strengths
                </h5>
                <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                  {analysis.idealPercentage > 60 && <li>Good overall speaking pace</li>}
                  {analysis.fillerPercentage < 3 && <li>Minimal use of filler words</li>}
                  {analysis.loudnessVariance < 5 && <li>Consistent volume throughout</li>}
                  {analysis.totalWords > 100 && <li>Substantial content delivered</li>}
                  {analysis.avgSPM >= 130 && analysis.avgSPM <= 300 && <li>Ideal speaking rhythm</li>}
                </ul>
              </div>

              <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                <h5 className="font-medium text-orange-400 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Areas for Improvement
                </h5>
                <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                  {analysis.fillerPercentage >= 3 && <li>Reduce filler words ({analysis.fillerCount} detected)</li>}
                  {analysis.avgSPM < 130 && <li>Consider speaking slightly faster</li>}
                  {analysis.avgSPM > 400 && <li>Slow down for better comprehension</li>}
                  {analysis.loudnessVariance >= 10 && <li>Work on maintaining consistent volume</li>}
                  {analysis.idealPercentage < 50 && <li>Aim for more consistent pacing</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
