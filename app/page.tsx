"use client";

import { useState, useRef, useEffect } from "react";

interface ProgressData {
  current: number;
  total: number;
  percentage: number;
}

interface DownloadFile {
  fileName: string;
  data: string;
  totalEntries: number;
  downloadUrl?: string;
}

export default function Home() {
  const [contestSlug, setContestSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [downloadFile, setDownloadFile] = useState<DownloadFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debug: Log when downloadFile changes
  useEffect(() => {
    console.log("downloadFile state changed:", downloadFile);
  }, [downloadFile]);

  const handleScrape = async () => {
    if (!contestSlug) {
      setError("Please enter a contest slug");
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(null);
    setDownloadFile(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contestSlug,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to start scraping");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            console.log("Received line:", line);
            const data = JSON.parse(line);
            console.log("Parsed data:", data);

            if (data.type === "progress") {
              setProgress({
                current: data.current,
                total: data.total,
                percentage: data.percentage,
              });
            } else if (data.type === "complete") {
              console.log("Complete event received!");
              console.log("Data length:", data.data?.length || 0);
              console.log("File name:", data.fileName);
              console.log("Total entries:", data.totalEntries);

              // Trigger download immediately
              let downloadUrl = "";
              try {
                if (!data.data || data.data.length === 0) {
                  throw new Error("No data received from server");
                }

                // Decode base64 to binary string (browser-compatible)
                console.log("Decoding base64 data...");
                const binaryString = atob(data.data);
                console.log("Binary string length:", binaryString.length);
                
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                console.log("Bytes array created, length:", bytes.length);

                const blob = new Blob([bytes], {
                  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                });
                console.log("Blob created, size:", blob.size);
                
                downloadUrl = URL.createObjectURL(blob);
                console.log("Blob URL created:", downloadUrl);
                
                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = data.fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                console.log("Download triggered successfully");
              } catch (err) {
                console.error("Download error:", err);
                setError(`Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
              }

              // Set downloadFile state for UI update (keep URL for re-download)
              setDownloadFile({
                fileName: data.fileName,
                data: "", // Don't store the large base64 data
                totalEntries: data.totalEntries,
                downloadUrl: downloadUrl,
              });
              setIsLoading(false);
            } else if (data.type === "error") {
              setError(data.message);
              setIsLoading(false);
            }
          } catch (e) {
            console.error("Error parsing JSON:", e, "Line:", line);
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Scraping cancelled");
      } else {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
      setIsLoading(false);
    }
  };

  // Manual download function in case auto-download fails
  const handleManualDownload = () => {
    if (downloadFile?.downloadUrl) {
      const a = document.createElement("a");
      a.href = downloadFile.downloadUrl;
      a.download = downloadFile.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (downloadFile?.downloadUrl) {
        URL.revokeObjectURL(downloadFile.downloadUrl);
      }
    };
  }, [downloadFile?.downloadUrl]);

  return (
    <div className="container">
      <div className="card">
        <div className="logo">
          <img src="/image.png" alt="Logo" className="logo-image" />
          <div className="logo-text">HackerRank Scraper</div>
        </div>

        <div className="input-group">
          <label htmlFor="contestSlug">Contest Slug</label>
          <div className="input-wrapper">
            <span className="input-icon">🔗</span>
            <input
              id="contestSlug"
              type="text"
              placeholder="your-contest-slug"
              value={contestSlug}
              onChange={(e) => setContestSlug(e.target.value)}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading && contestSlug) {
                  handleScrape();
                }
              }}
            />
          </div>
        </div>

        <button
          className="primary-button"
          onClick={handleScrape}
          disabled={isLoading || !contestSlug}
        >
          {isLoading ? "Scraping..." : "Start Scraping"}
        </button>

        {error && (
          <div className="error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {isLoading && !progress && (
          <div className="loading">
            <div className="spinner"></div>
            <span>Initializing scraper...</span>
          </div>
        )}

        {progress && !downloadFile && (
          <div className="progress-section">
            <div className="progress-label">
              <span className="progress-text">Scraping leaderboard</span>
              <span className="progress-percentage">
                {progress.percentage}%
              </span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <div className="divider">
              <span className="divider-text">
                {progress.current} of {progress.total} entries
              </span>
            </div>
          </div>
        )}

        {downloadFile && (
          <div className="progress-section">
            <div className="progress-label">
              <span className="progress-text">✓ Download completed</span>
              <span className="progress-percentage">100%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: "100%" }}></div>
            </div>
            <div className="divider">
              <span className="divider-text">
                {downloadFile.totalEntries} entries • {downloadFile.fileName}
              </span>
            </div>
            <button
              className="primary-button"
              onClick={handleManualDownload}
              style={{ marginTop: "1rem" }}
            >
              📥 Download Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
