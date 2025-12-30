"use client";

import { useState, useRef } from "react";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";
import Image from "next/image";

interface ScrapedLeaderboardItem {
  rank: number;
  hacker: string;
  solved_challenges: number;
  time_taken: number | null;
  score: number;
}

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

  const formatTimeTaken = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const generateExcel = async (slug: string) => {
    try {
      const entries = await db.leaderboard
        .where("contestSlug")
        .equals(slug)
        .sortBy("rank");

      if (entries.length === 0) throw new Error("No data found in database");

      const formattedData = entries.map((entry) => ({
        Rank: entry.rank || "N/A",
        User: entry.hacker || "N/A",
        "Solved Count": entry.solved_challenges || 0,
        "Time Taken": entry.time_taken
          ? formatTimeTaken(entry.time_taken)
          : "N/A",
        Score: entry.score || 0,
      }));

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

      return true;
    } catch (err) {
      setError(
        `Failed to generate Excel: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
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
      await db.leaderboard.where("contestSlug").equals(contestSlug).delete();

      const response = await fetch("/api/scrape-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestSlug }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Failed to start scraping");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);

            if (data.type === "progress") {
              setProgress({
                current: data.current,
                total: data.total,
                percentage: data.percentage,
              });

              if (data.data && Array.isArray(data.data)) {
                const entries = data.data.map(
                  (item: ScrapedLeaderboardItem) => ({
                    contestSlug,
                    rank: item.rank,
                    hacker: item.hacker,
                    solved_challenges: item.solved_challenges,
                    time_taken: item.time_taken,
                    score: item.score,
                    scrapedAt: new Date(),
                  })
                );

                await db.leaderboard.bulkAdd(entries);
              }
            } else if (data.type === "complete") {
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
          } catch {}
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError")
        setError("Scraping cancelled");
      else setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  const handleManualDownload = async () => {
    if (contestSlug) await generateExcel(contestSlug);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-5">
      <div className="w-95 bg-white rounded-lg shadow border border-gray-200 p-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Image
            src="/image.png"
            alt="Logo"
            width={40}
            height={40}
            className="rounded object-contain"
          />

          <div className="text-lg font-semibold text-gray-900">
            HackerRank Scraper
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="contestSlug"
            className="block text-xs font-medium text-gray-500 mb-2"
          >
            Contest Slug
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              🔗
            </span>
            <input
              id="contestSlug"
              type="text"
              placeholder="your-contest-slug"
              value={contestSlug}
              onChange={(e) => setContestSlug(e.target.value)}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading && contestSlug)
                  handleScrape();
              }}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-400 focus:bg-white"
            />
          </div>
        </div>

        <button
          onClick={handleScrape}
          disabled={isLoading || !contestSlug}
          className="w-full py-2 px-4 mb-3 text-sm font-semibold bg-green-400 hover:bg-green-500 text-gray-900 rounded disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
        >
          {isLoading ? "Scraping..." : "Start Scraping"}
        </button>

        {error && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-red-100 border border-red-300 text-red-700 text-xs rounded">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {isLoading && !progress && (
          <div className="flex items-center justify-center gap-2 mt-4 p-3 bg-gray-50 rounded text-xs text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-green-400 rounded-full animate-spin"></div>
            <span>Initializing scraper...</span>
          </div>
        )}

        {progress && !downloadFile && (
          <div className="mt-5 pt-5 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2 text-xs text-gray-500 font-medium">
              <span>Scraping leaderboard</span>
              <span className="text-green-400 font-semibold">
                {progress.percentage}%
              </span>
            </div>
            <div className="w-full h-1 bg-gray-200 rounded overflow-hidden mb-2">
              <div
                className="h-full bg-green-400 rounded transition-all"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <div className="text-center text-[11px] text-gray-400 font-medium">
              {progress.current} of {progress.total} entries
            </div>
          </div>
        )}

        {downloadFile && (
          <div className="mt-5 pt-5 border-t border-gray-200 text-center">
            <div className="flex justify-between items-center mb-2 text-xs text-gray-500 font-medium">
              <span>✓ Download completed</span>
              <span className="text-green-400 font-semibold">100%</span>
            </div>
            <div className="w-full h-1 bg-gray-200 rounded overflow-hidden mb-2">
              <div
                className="h-full bg-green-400 rounded transition-all"
                style={{ width: "100%" }}
              ></div>
            </div>
            <div className="text-[11px] text-gray-400 mb-3">
              {downloadFile.totalEntries} entries • {downloadFile.fileName}
            </div>
            <button
              onClick={handleManualDownload}
              className="w-full py-2 px-4 mt-2 bg-green-400 hover:bg-green-500 text-gray-900 text-sm font-semibold rounded transition transform active:scale-95"
            >
              📥 Download Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
