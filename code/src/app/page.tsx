"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Navbar } from "@/app/components/Navbar";
import { HeroSection } from "@/app/components/HeroSection";
import { SpeechAnalysisResults } from "@/app/components/SpeechAnalysisResults";
import { PDFAnalysisResults } from "@/app/components/PDFAnalysisResults";
import { AudioRecorder } from "@/app/components/AudioRecorder";
import { KaraokePlayback } from "@/app/components/KaraokePlayback";
import { InteractiveBackground } from "@/app/components/InteractiveBackground";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeContext";
import {
  analyzeAudio,
  analyzePDF,
  type AudioAnalysisResponse,
  type PDFAnalysisResponse,
} from "@/app/services/api";

type FileType = "audio" | "video" | "pdf";

type FileWithPreview = {
  file: File;
  id: string;
  type: FileType;
};

type AnalysisType = "speech" | "slides" | "both";
type AudioMethod = "upload" | "record";
type WizardStep = "type" | "audio-method" | "audio-upload" | "audio-record" | "slides" | "context" | "analyzing" | "results";

export default function Home() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>("type");
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
  const [audioMethod, setAudioMethod] = useState<AudioMethod | null>(null);
  const [slideDirection, setSlideDirection] = useState<"forward" | "backward">("forward");

  // File state
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [audioResult, setAudioResult] = useState<AudioAnalysisResponse | null>(null);
  const [pdfResult, setPdfResult] = useState<PDFAnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const audioTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "video/mp4", "audio/webm", "video/webm"];
  const pdfTypes = ["application/pdf"];
  const audioExtensions = [".mp3", ".mp4", ".wav", ".webm"];
  const pdfExtensions = [".pdf"];

  const validateFile = (file: File): boolean => {
    const isAudioType = audioTypes.includes(file.type);
    const isAudioExtension = audioExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    const isPdfType = pdfTypes.includes(file.type);
    const isPdfExtension = pdfExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    return isAudioType || isAudioExtension || isPdfType || isPdfExtension;
  };

  const getFileType = (file: File): FileType => {
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      return "pdf";
    }
    if (file.type.startsWith("audio/") || file.name.toLowerCase().endsWith(".mp3") || file.name.toLowerCase().endsWith(".wav")) {
      return "audio";
    }
    return "video";
  };

  const handleFiles = useCallback(
    (fileList: FileList, targetType: "audio" | "pdf") => {
      const newFiles: FileWithPreview[] = [];

      Array.from(fileList).forEach((file) => {
        if (validateFile(file)) {
          const fileType = getFileType(file);

          if (targetType === "audio" && (fileType === "audio" || fileType === "video")) {
            newFiles.push({
              file,
              id: `${file.name}-${Date.now()}-${Math.random()}`,
              type: fileType,
            });
            const audioUrl = URL.createObjectURL(file);
            setRecordedAudioUrl(audioUrl);
          } else if (targetType === "pdf" && fileType === "pdf") {
            newFiles.push({
              file,
              id: `${file.name}-${Date.now()}-${Math.random()}`,
              type: fileType,
            });
          }
        }
      });

      if (newFiles.length > 0) {
        setFiles((prev) => {
          const filtered = prev.filter(f =>
            targetType === "audio" ? f.type === "pdf" : (f.type === "audio" || f.type === "video")
          );
          return [...filtered, ...newFiles];
        });
      }
    },
    [],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetType: "audio" | "pdf") => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files, targetType);
      }
    },
    [handleFiles],
  );

  const handleRecordingComplete = (file: File, audioUrl: string) => {
    setFiles((prev) => prev.filter((f) => f.type !== "audio" && f.type !== "video"));
    const newFile: FileWithPreview = {
      file,
      id: `recording-${Date.now()}`,
      type: "audio",
    };
    setFiles((prev) => [...prev, newFile]);
    setRecordedAudioUrl(audioUrl);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const audioVideoFile = files.find((f) => f.type === "audio" || f.type === "video");
  const pdfFile = files.find((f) => f.type === "pdf");

  // Navigation functions
  const goToStep = (step: WizardStep, direction: "forward" | "backward" = "forward") => {
    setSlideDirection(direction);
    setCurrentStep(step);
  };

  const getNextStep = (): WizardStep | null => {
    switch (currentStep) {
      case "type":
        if (analysisType === "speech" || analysisType === "both") return "audio-method";
        if (analysisType === "slides") return "slides";
        return null;
      case "audio-method":
        if (audioMethod === "upload") return "audio-upload";
        if (audioMethod === "record") return "audio-record";
        return null;
      case "audio-upload":
      case "audio-record":
        if (analysisType === "both") return "slides";
        return "context";
      case "slides":
        return "context";
      case "context":
        return "analyzing";
      default:
        return null;
    }
  };

  const getPrevStep = (): WizardStep | null => {
    switch (currentStep) {
      case "audio-method":
        return "type";
      case "audio-upload":
      case "audio-record":
        return "audio-method";
      case "slides":
        if (analysisType === "both") return audioMethod === "upload" ? "audio-upload" : "audio-record";
        return "type";
      case "context":
        if (analysisType === "slides") return "slides";
        if (analysisType === "both") return "slides";
        return audioMethod === "upload" ? "audio-upload" : "audio-record";
      default:
        return null;
    }
  };

  const handleNext = () => {
    const next = getNextStep();
    if (next) {
      if (next === "analyzing") {
        handleAnalyze();
      } else {
        goToStep(next, "forward");
      }
    }
  };

  const handleBack = () => {
    const prev = getPrevStep();
    if (prev) goToStep(prev, "backward");
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "type":
        return analysisType !== null;
      case "audio-method":
        return audioMethod !== null;
      case "audio-upload":
        return audioVideoFile !== undefined;
      case "audio-record":
        return audioVideoFile !== undefined;
      case "slides":
        return pdfFile !== undefined;
      case "context":
        return true;
      default:
        return false;
    }
  };

  const handleAnalyze = async () => {
    goToStep("analyzing", "forward");
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisProgress(0);
    setAudioResult(null);
    setPdfResult(null);

    try {
      const totalSteps = (audioVideoFile ? 1 : 0) + (pdfFile ? 1 : 0);
      let completedSteps = 0;

      if (audioVideoFile) {
        setCurrentAnalysisStep("Analyzing speech...");
        const progressInterval = setInterval(() => {
          setAnalysisProgress((prev) => {
            const target = ((completedSteps + 0.9) / totalSteps) * 100;
            if (prev >= target) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + Math.random() * 10;
          });
        }, 300);

        const result = await analyzeAudio(audioVideoFile.file);
        clearInterval(progressInterval);
        setAudioResult(result);
        completedSteps++;
        setAnalysisProgress((completedSteps / totalSteps) * 100);
      }

      if (pdfFile) {
        setCurrentAnalysisStep("Analyzing slide deck...");
        const progressInterval = setInterval(() => {
          setAnalysisProgress((prev) => {
            const target = ((completedSteps + 0.9) / totalSteps) * 100;
            if (prev >= target) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + Math.random() * 10;
          });
        }, 300);

        const result = await analyzePDF(pdfFile.file);
        clearInterval(progressInterval);
        setPdfResult(result);
        completedSteps++;
        setAnalysisProgress(100);
      }

      setAnalysisComplete(true);
      goToStep("results", "forward");
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysisError(error instanceof Error ? error.message : "Failed to analyze. Please try again.");
      goToStep("context", "backward");
    } finally {
      setIsAnalyzing(false);
      setCurrentAnalysisStep("");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setTitle("");
    setDescription("");
    setAnalysisComplete(false);
    setAudioResult(null);
    setPdfResult(null);
    setAnalysisError(null);
    setAnalysisProgress(0);
    setRecordedAudioUrl(null);
    setAnalysisType(null);
    setAudioMethod(null);
    goToStep("type", "backward");
  };

  // Step progress indicator
  const getStepNumber = (): number => {
    const steps: WizardStep[] = ["type"];
    if (analysisType === "speech" || analysisType === "both") {
      steps.push("audio-method");
      steps.push(audioMethod === "upload" ? "audio-upload" : "audio-record");
    }
    if (analysisType === "slides" || analysisType === "both") {
      steps.push("slides");
    }
    steps.push("context");

    const idx = steps.indexOf(currentStep);
    return idx >= 0 ? idx + 1 : 1;
  };

  const getTotalSteps = (): number => {
    let count = 2; // type + context
    if (analysisType === "speech" || analysisType === "both") count += 2; // audio-method + audio step
    if (analysisType === "slides" || analysisType === "both") count += 1;
    return count;
  };

  // Animation classes
  const getSlideClass = () => {
    return slideDirection === "forward"
      ? "animate-slide-in-right"
      : "animate-slide-in-left";
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 relative overflow-hidden">
      {/* Interactive Background */}
      <InteractiveBackground />

      {/* Content Layer */}
      <div className="relative z-10">
        <Navbar
          brandName="Pitch Perfect"
          navItems={[
            { label: "Home", onClick: () => router.push("/") },
            { label: "Learn More", onClick: () => router.push("/learn-more") },
            { label: "Analyze", onClick: () => document.getElementById("analyze")?.scrollIntoView({ behavior: "smooth" }) },
          ]}
          onThemeToggle={toggleTheme}
          isDarkMode={isDark}
        />

        <HeroSection />

        <main id="analyze" className="max-w-2xl mx-auto px-6 py-12">
          {/* Wizard Container */}
          {currentStep !== "results" && currentStep !== "analyzing" && (
            <div className="wizard-container">
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--text-primary)]/60">
                    Step {getStepNumber()} of {getTotalSteps()}
                  </span>
                  <span className="text-sm text-[var(--text-primary)]/40">
                    {currentStep === "type" && "Choose Analysis Type"}
                    {currentStep === "audio-method" && "Select Method"}
                    {(currentStep === "audio-upload" || currentStep === "audio-record") && "Add Audio"}
                    {currentStep === "slides" && "Add Slides"}
                    {currentStep === "context" && "Add Context"}
                  </span>
                </div>
                <div className="h-1 bg-[var(--text-primary)]/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--accent-blue-muted)] to-[var(--accent-blue)] transition-all duration-500 ease-out"
                    style={{ width: `${(getStepNumber() / getTotalSteps()) * 100}%` }}
                  />
                </div>
              </div>

              {/* Step Content */}
              <div className={`step-content ${getSlideClass()}`} key={currentStep}>
                {/* Step: Choose Analysis Type */}
                {currentStep === "type" && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                        What would you like to analyze?
                      </h2>
                      <p className="text-[var(--text-primary)]/60">
                        Select the type of content you want feedback on
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <button
                        onClick={() => setAnalysisType("speech")}
                        className={`wizard-card group ${analysisType === "speech" ? "wizard-card-selected" : ""}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                            analysisType === "speech" ? "bg-[var(--text-primary)]/20" : "bg-[var(--text-primary)]/5 group-hover:bg-[var(--text-primary)]/10"
                          }`}>
                            <svg className="w-7 h-7 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Speech Only</h3>
                            <p className="text-sm text-[var(--text-primary)]/50">Analyze your speaking pace, clarity, and filler words</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            analysisType === "speech" ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]" : "border-[var(--text-primary)]/30"
                          }`}>
                            {analysisType === "speech" && (
                              <svg className="w-4 h-4 text-[var(--bg-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setAnalysisType("slides")}
                        className={`wizard-card group ${analysisType === "slides" ? "wizard-card-selected" : ""}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                            analysisType === "slides" ? "bg-[var(--text-primary)]/20" : "bg-[var(--text-primary)]/5 group-hover:bg-[var(--text-primary)]/10"
                          }`}>
                            <svg className="w-7 h-7 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Slides Only</h3>
                            <p className="text-sm text-[var(--text-primary)]/50">Get feedback on slide structure and content density</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            analysisType === "slides" ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]" : "border-[var(--text-primary)]/30"
                          }`}>
                            {analysisType === "slides" && (
                              <svg className="w-4 h-4 text-[var(--bg-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setAnalysisType("both")}
                        className={`wizard-card group ${analysisType === "both" ? "wizard-card-selected" : ""}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                            analysisType === "both" ? "bg-[var(--text-primary)]/20" : "bg-[var(--text-primary)]/5 group-hover:bg-[var(--text-primary)]/10"
                          }`}>
                            <svg className="w-7 h-7 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                            </svg>
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Full Presentation</h3>
                            <p className="text-sm text-[var(--text-primary)]/50">Complete analysis of both speech and slides</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            analysisType === "both" ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]" : "border-[var(--text-primary)]/30"
                          }`}>
                            {analysisType === "both" && (
                              <svg className="w-4 h-4 text-[var(--bg-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step: Choose Audio Method */}
                {currentStep === "audio-method" && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                        How would you like to add your speech?
                      </h2>
                      <p className="text-[var(--text-primary)]/60">
                        Upload a recording or record live
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setAudioMethod("upload")}
                        className={`wizard-card-vertical group ${audioMethod === "upload" ? "wizard-card-selected" : ""}`}
                      >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                          audioMethod === "upload" ? "bg-[var(--text-primary)]/20" : "bg-[var(--text-primary)]/5 group-hover:bg-[var(--text-primary)]/10"
                        }`}>
                          <svg className="w-8 h-8 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Upload File</h3>
                        <p className="text-sm text-[var(--text-primary)]/50">MP3, WAV, or MP4</p>
                        <div className={`mt-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mx-auto ${
                          audioMethod === "upload" ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]" : "border-[var(--text-primary)]/30"
                        }`}>
                          {audioMethod === "upload" && (
                            <svg className="w-4 h-4 text-[var(--bg-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>

                      <button
                        onClick={() => setAudioMethod("record")}
                        className={`wizard-card-vertical group ${audioMethod === "record" ? "wizard-card-selected" : ""}`}
                      >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                          audioMethod === "record" ? "bg-[var(--text-primary)]/20" : "bg-[var(--text-primary)]/5 group-hover:bg-[var(--text-primary)]/10"
                        }`}>
                          <svg className="w-8 h-8 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Record Live</h3>
                        <p className="text-sm text-[var(--text-primary)]/50">Use your microphone</p>
                        <div className={`mt-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mx-auto ${
                          audioMethod === "record" ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]" : "border-[var(--text-primary)]/30"
                        }`}>
                          {audioMethod === "record" && (
                            <svg className="w-4 h-4 text-[var(--bg-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step: Upload Audio */}
                {currentStep === "audio-upload" && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                        Upload your recording
                      </h2>
                      <p className="text-[var(--text-primary)]/60">
                        Drag and drop or click to browse
                      </p>
                    </div>

                    {!audioVideoFile ? (
                      <div
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = ".mp3,.mp4,.wav,.webm,audio/mpeg,audio/wav,video/mp4,audio/webm,video/webm";
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files) handleFiles(files, "audio");
                          };
                          input.click();
                        }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, "audio")}
                        className={`wizard-dropzone ${isDragging ? "wizard-dropzone-active" : ""}`}
                      >
                        <div className="w-20 h-20 rounded-full bg-[var(--text-primary)]/5 flex items-center justify-center mx-auto mb-6">
                          <svg className="w-10 h-10 text-[var(--text-primary)]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        </div>
                        <p className="text-[var(--text-primary)] font-medium mb-2">Drop your audio file here</p>
                        <p className="text-sm text-[var(--text-primary)]/40">or click to browse</p>
                        <p className="text-xs text-[var(--text-primary)]/30 mt-4">Supports MP3, WAV, MP4, WebM</p>
                      </div>
                    ) : (
                      <div className="wizard-file-preview">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-[var(--text-primary)]/10 flex items-center justify-center">
                            <svg className="w-7 h-7 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[var(--text-primary)] font-medium truncate">{audioVideoFile.file.name}</p>
                            <p className="text-sm text-[var(--text-primary)]/50">{formatFileSize(audioVideoFile.file.size)}</p>
                          </div>
                          <button
                            onClick={() => {
                              setFiles(prev => prev.filter(f => f.id !== audioVideoFile.id));
                              setRecordedAudioUrl(null);
                            }}
                            className="p-2 rounded-lg text-[var(--text-primary)]/40 hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/10 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step: Record Audio */}
                {currentStep === "audio-record" && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                        Record your speech
                      </h2>
                      <p className="text-[var(--text-primary)]/60">
                        Click the button below to start recording
                      </p>
                    </div>

                    {!audioVideoFile ? (
                      <div className="wizard-recorder">
                        <AudioRecorder onRecordingComplete={handleRecordingComplete} disabled={isAnalyzing} />
                      </div>
                    ) : (
                      <div className="wizard-file-preview">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-[var(--text-primary)]/10 flex items-center justify-center">
                            <svg className="w-7 h-7 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[var(--text-primary)] font-medium">Recording captured</p>
                            <p className="text-sm text-[var(--text-primary)]/50">{formatFileSize(audioVideoFile.file.size)}</p>
                          </div>
                          <button
                            onClick={() => {
                              setFiles(prev => prev.filter(f => f.id !== audioVideoFile.id));
                              setRecordedAudioUrl(null);
                            }}
                            className="p-2 rounded-lg text-[var(--text-primary)]/40 hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/10 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step: Upload Slides */}
                {currentStep === "slides" && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                        Upload your slides
                      </h2>
                      <p className="text-[var(--text-primary)]/60">
                        Add your presentation PDF for analysis
                      </p>
                    </div>

                    {!pdfFile ? (
                      <div
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = ".pdf,application/pdf";
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files) handleFiles(files, "pdf");
                          };
                          input.click();
                        }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, "pdf")}
                        className={`wizard-dropzone ${isDragging ? "wizard-dropzone-active" : ""}`}
                      >
                        <div className="w-20 h-20 rounded-full bg-[var(--text-primary)]/5 flex items-center justify-center mx-auto mb-6">
                          <svg className="w-10 h-10 text-[var(--text-primary)]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-[var(--text-primary)] font-medium mb-2">Drop your PDF here</p>
                        <p className="text-sm text-[var(--text-primary)]/40">or click to browse</p>
                      </div>
                    ) : (
                      <div className="wizard-file-preview">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-[var(--text-primary)]/10 flex items-center justify-center">
                            <svg className="w-7 h-7 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[var(--text-primary)] font-medium truncate">{pdfFile.file.name}</p>
                            <p className="text-sm text-[var(--text-primary)]/50">{formatFileSize(pdfFile.file.size)}</p>
                          </div>
                          <button
                            onClick={() => setFiles(prev => prev.filter(f => f.id !== pdfFile.id))}
                            className="p-2 rounded-lg text-[var(--text-primary)]/40 hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/10 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step: Add Context */}
                {currentStep === "context" && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                        Add some context
                      </h2>
                      <p className="text-[var(--text-primary)]/60">
                        Help us provide more relevant feedback (optional)
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-[var(--text-primary)]/60 mb-2">
                          Presentation Title
                        </label>
                        <input
                          id="title"
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g., Q4 Sales Pitch"
                          className="wizard-input"
                        />
                      </div>
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-[var(--text-primary)]/60 mb-2">
                          What would you like feedback on?
                        </label>
                        <textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="e.g., I want to improve my pacing..."
                          rows={4}
                          className="wizard-input resize-none"
                        />
                      </div>
                    </div>

                    {/* Error State */}
                    {analysisError && (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <p className="text-red-400 text-sm flex-1">{analysisError}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--text-primary)]/10">
                <button
                  onClick={handleBack}
                  disabled={currentStep === "type"}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    currentStep === "type"
                      ? "text-[var(--text-primary)]/20 cursor-not-allowed"
                      : "text-[var(--text-primary)]/60 hover:text-[var(--accent-blue)] hover:bg-[var(--accent-blue-subtle)]"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    canProceed()
                      ? "bg-[var(--accent-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent-primary-hover)] hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                      : "bg-[var(--text-primary)]/10 text-[var(--text-primary)]/30 cursor-not-allowed"
                  }`}
                >
                  {currentStep === "context" ? "Analyze" : "Continue"}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Analyzing State */}
          {currentStep === "analyzing" && (
            <div className="wizard-container animate-fade-in">
              <div className="text-center py-12">
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-[var(--accent-blue)]/20" />
                  <div
                    className="absolute inset-0 rounded-full border-4 border-[var(--accent-blue)] border-t-transparent animate-spin"
                    style={{ animationDuration: "1s" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-[var(--accent-blue)]">{Math.round(analysisProgress)}%</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Analyzing your presentation</h2>
                <p className="text-[var(--text-primary)]/60">{currentAnalysisStep || "Preparing analysis..."}</p>

                <div className="mt-8 max-w-xs mx-auto">
                  <div className="h-1 bg-[var(--accent-blue)]/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--accent-blue-muted)] to-[var(--accent-blue)] transition-all duration-300 ease-out"
                      style={{ width: `${Math.min(analysisProgress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {currentStep === "results" && (audioResult || pdfResult) && (
            <section className="space-y-8 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--text-primary)]">Analysis Results</h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    {audioResult && pdfResult ? "Speech and slide deck analysis complete" : audioResult ? "Speech analysis complete" : "Slide deck analysis complete"}
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-[var(--text-primary)]/10 text-[var(--text-primary)] hover:bg-[var(--accent-blue-subtle)] hover:text-[var(--accent-blue)] transition-all duration-200 active:scale-[0.98] text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  New Analysis
                </button>
              </div>

              {audioResult && (
                <div>
                  {pdfResult && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-[var(--text-primary)]/10 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-[var(--text-primary)]">Speech Analysis</h4>
                    </div>
                  )}

                  {recordedAudioUrl && audioResult.word_analysis.length > 0 && (
                    <div className="mb-6">
                      <KaraokePlayback
                        audioUrl={recordedAudioUrl}
                        wordAnalysis={audioResult.word_analysis}
                        transcription={audioResult.transcription}
                        timestamps={audioResult.timestamps}
                      />
                    </div>
                  )}

                  <SpeechAnalysisResults data={audioResult} onReset={handleReset} />
                </div>
              )}

              {pdfResult && (
                <div>
                  {audioResult && (
                    <div className="flex items-center gap-2 mb-4 mt-8">
                      <div className="w-6 h-6 rounded-full bg-[var(--text-primary)]/10 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-[var(--text-primary)]">Slide Deck Analysis</h4>
                    </div>
                  )}
                  <PDFAnalysisResults data={pdfResult} onReset={handleReset} />
                </div>
              )}
            </section>
          )}
        </main>

        <footer className="border-t border-[var(--text-primary)]/10 mt-auto relative z-10">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <p className="text-center text-sm text-[var(--text-primary)]/30">
              Pitch Perfect - AI-powered presentation coaching
            </p>
          </div>
        </footer>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.mp4,.wav,.pdf,audio/mpeg,audio/wav,video/mp4,application/pdf"
        multiple
        onChange={(e) => {
          if (e.target.files) {
            // Determine target type based on current step
            const targetType = currentStep === "slides" ? "pdf" : "audio";
            handleFiles(e.target.files, targetType);
          }
        }}
        className="hidden"
      />
    </div>
  );
}
