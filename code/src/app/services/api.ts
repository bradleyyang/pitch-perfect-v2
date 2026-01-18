const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============ Audio Analysis Types ============

export interface WordAnalysis {
  word: string;
  speed: "Too Slow" | "Ideal" | "Fast" | "Too Fast";
  syllables_per_minute: number;
}

export interface InsightItem {
  score: number;
  insight: string;
  action: string;
}

export interface FillerWordsInsight extends InsightItem {
  count: number;
}

export interface Insights {
  overall_verdict: string;
  clarity: InsightItem;
  pacing: InsightItem;
  filler_words: FillerWordsInsight;
  structure: InsightItem;
  engagement: InsightItem;
}

export interface AudioAnalysisResponse {
  transcription: string;
  word_analysis: WordAnalysis[];
  timestamps: [number, number][]; // [end_time, spm]
  loudness: [number, number][]; // [time, db]
  insights: Insights;
  verdict_audio: string; // base64 encoded audio
}

export interface ImprovedPitchResponse {
  improved_text: string;
  improved_audio: string; // base64 encoded audio
}

// ============ PDF Analysis Types ============

export interface PDFPage {
  page_number: number;
  text: string;
}

export interface PDFAnalysisResponse {
  total_pages: number;
  pages: PDFPage[];
  summary: string;
}

// ============ API Functions ============

export async function analyzeAudio(file: File): Promise<AudioAnalysisResponse> {
  const formData = new FormData();
  // Explicitly append the file with filename to ensure proper multipart encoding
  formData.append("file", file, file.name);

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    // Don't set Content-Type header - browser will set it automatically with boundary
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Analysis failed" }));
    const errorMessage = error.detail || error.error || "Failed to analyze audio";
    console.error("Audio analysis error:", {
      status: response.status,
      statusText: response.statusText,
      error: errorMessage,
      fileType: file.type,
      fileName: file.name,
      fileSize: file.size,
    });
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function analyzePDF(file: File): Promise<PDFAnalysisResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/analyze-pdf`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "PDF analysis failed" }));
    throw new Error(error.detail || "Failed to analyze PDF");
  }

  return response.json();
}

export async function generateImprovedPitch(
  file: File,
  transcript: string,
  insights: Insights
): Promise<ImprovedPitchResponse> {
  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("transcript", transcript);
  formData.append("insights_json", JSON.stringify(insights));

  const response = await fetch(`${API_BASE_URL}/generate-improved-pitch`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to generate improved pitch" }));
    throw new Error(error.detail || "Failed to generate improved pitch");
  }

  return response.json();
}

export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/`);

  if (!response.ok) {
    throw new Error("API health check failed");
  }

  return response.json();
}

// ============ Helper Types for Components ============

export interface SpeedDistribution {
  "Too Slow": number;
  "Ideal": number;
  "Fast": number;
  "Too Fast": number;
}

export function calculateSpeedDistribution(wordAnalysis: WordAnalysis[]): SpeedDistribution {
  const distribution: SpeedDistribution = {
    "Too Slow": 0,
    "Ideal": 0,
    "Fast": 0,
    "Too Fast": 0,
  };

  wordAnalysis.forEach((word) => {
    distribution[word.speed]++;
  });

  return distribution;
}

export function calculateAverageSPM(wordAnalysis: WordAnalysis[]): number {
  if (wordAnalysis.length === 0) return 0;
  const total = wordAnalysis.reduce((sum, word) => sum + word.syllables_per_minute, 0);
  return total / wordAnalysis.length;
}
