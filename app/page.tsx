"use client";

import { useState, useRef, useEffect } from "react";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";

interface ProgressData {
  current: number;
  total: number;
  percentage: number;
}

interface DownloadFile {
  fileName: string;
  totalEntries: number;
}

export default function Home() {
  const [contestSlug, setContestSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [downloadFile, setDownloadFile] = useState<DownloadFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Format time taken
  const formatTimeTaken = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Generate Excel from IndexedDB
  const generateExcel = async (slug: string) => {
    try {
      console.log("Generating Excel from IndexedDB...");
      
      // Fetch all data from IndexedDB
      const entries = await db.leaderboard
        .where("contestSlug")
        .equals(slug)
        .sortBy("rank");

      if (entries.length === 0) {
        throw new Error("No data found in database");
      }

      console.log(`Found ${entries.length} entries in IndexedDB`);

      // Format data for Excel
      const formattedData = entries.map((entry) => ({
        Rank: entry.rank || "N/A",
        User: entry.hacker || "N/A",
        "Solved Count": entry.solved_challenges || 0,
        "Time Taken": entry.time_taken
          ? formatTimeTaken(entry.time_taken)
          : "N/A",
        Score: entry.score || 0,
      }));

      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leaderboard");

      // Generate and download
      const excelBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}_leaderboard.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("Excel file downloaded successfully!");
      return true;
    } catch (err) {
      console.error("Excel generation error:", err);
      setError(
        `Failed to generate Excel: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      return false;
    }
  };

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
      // Clear previous data for this contest
      console.log("Clearing previous data from IndexedDB...");
      await db.leaderboard.where("contestSlug").equals(contestSlug).delete();

      const response = await fetch("/api/scrape-json", {
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
            const data = JSON.parse(line);

            if (data.type === "progress") {
              setProgress({
                current: data.current,
                total: data.total,
                percentage: data.percentage,
              });

              // Store data in IndexedDB
              if (data.data && Array.isArray(data.data)) {
                const entries = data.data.map((item: any) => ({
                  contestSlug,
                  rank: item.rank,
                  hacker: item.hacker,
                  solved_challenges: item.solved_challenges,
                  time_taken: item.time_taken,
                  score: item.score,
                  scrapedAt: new Date(),
                }));

                await db.leaderboard.bulkAdd(entries);
                console.log(`Stored ${entries.length} entries in IndexedDB`);
              }
            } else if (data.type === "complete") {
              console.log("Scraping complete! Generating Excel...");

              // Generate Excel from IndexedDB
              const success = await generateExcel(contestSlug);

              if (success) {
                setDownloadFile({
                  fileName: `${contestSlug}_leaderboard.xlsx`,
                  totalEntries: data.totalEntries,
                });
              }

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

  // Manual download function - regenerate from IndexedDB
  const handleManualDownload = async () => {
    if (contestSlug) {
      await generateExcel(contestSlug);
    }
  };

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
