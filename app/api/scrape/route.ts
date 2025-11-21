import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as XLSX from 'xlsx';

interface LeaderboardModel {
    rank: number;
    hacker: string;
    solved_challenges: number;
    time_taken: number;
    score: number;
}

interface LeaderboardResponse {
    total: number;
    models: LeaderboardModel[];
}

interface ScrapeRequestBody {
    contestSlug: string;
}

const CONFIG = {
    pageSize: 10,
    delayBetweenRequests: 2000,
    maxRetries: 3,
};

// Hardcoded headers
const HEADERS = {
    "accept": "application/json, text/javascript, */*; q=0.01",
    "accept-language": "en-US,en;q=0.9",
    "priority": "u=1, i",
    "sec-ch-ua": '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-csrf-token": "TpV0yYuMYrvXKZJ7C6z5llh3ThXWcbeEx464f98G01NVqHLuY/Px/lFgRqGvogbymVqSoK8OyyMRIPXr9L4Gcg==",
    "x-requested-with": "XMLHttpRequest",
    "user-agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
    "cookie": "optimizelySegments=%7B%221709580323%22%3A%22false%22%2C%221717251348%22%3A%22gc%22%2C%221719390155%22%3A%22direct%22%2C%222308790558%22%3A%22none%22%7D; optimizelyBuckets=%7B%7D; __utmz=74197771.1727433454.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); _biz_uid=097956dfb9ab4c0accff98de8a54eea3; _zitok=4bab5828f8dd6fd8227d1728619248; 01-nov-2024-ccc-jbrec-po-25-problem-practice_crp=*nil*; 06-nov-24-ccc-sasi-po-28-problem-solving_crp=*nil*; 08-nov-24-ccc-klu-gnt-po-26-phase-iii-cluster-03-test-04-kjhnllll_crp=*nil*; 09-nov-24-ccc-klu-gnt-po-26-phase-iii-cluster-03-test-05-khnllll_crp=*nil*; 26-nov-24-ccc-anurag-po-26-test-02-knhmllll_crp=*nil*; _ga=GA1.1.539016919.1727433454; _ga_BCP376TP8D=GS1.1.1741760130.2.1.1741760134.0.0.0; _mkto_trk=id:487-WAY-049&token:_mch-hackerrank.com-a0b4379def582d421b3154db62e1d8af; _ga_R0S46VQSNQ=GS1.1.1741797189.3.0.1741797189.60.0.0; _ce.s=v~dbe3513c1a32bb0eaa4ce35b9cdffa72fd02b5d9~lcw~1741797189592~vir~new~lva~1741760138587~vpv~1~v11.cs~411501~v11.s~6b7a7230-ff09-11ef-91ea-6b8bf03f5326~v11.sla~1741760605156~v11.send~1741797189473~gtrk.la~m8652oyh~lcw~1741797189593; apr-2025-ccc-lendi-phase-ii-cse-c-d-po-28-spring-problem-solving-1_crp=*nil*; sep-2025-ccc-aitam-po-2026-gamma-problem-solving-ii_crp=*nil*; __utmc=74197771; _biz_flagsA=%7B%22Version%22%3A1%2C%22ViewThrough%22%3A%221%22%2C%22XDomain%22%3A%221%22%7D; hrc_l_i=T; _hrank_session=bf4fe20c7a200de9f7ca01916d03c094; hackerrank_mixpanel_token=227a0281-7505-454c-a8c1-15bcf5f83f85; 31-oct-2025-ccc-sasi-po-2028-phase-iii-problem-solving-g2_crp=*nil*; optimizelyEndUserId=oeu1762430251033r0.7718967519157272; react_var=true__trm5; react_var2=true__trm5; web_browser_id=17f037b080988071614cab8240b2cd08; nov-2025-ccc-sasi-po-2029-phase-i-ruby-problem-solving_crp=*nil*; metrics_user_identifier=de3339-059682bc66c18d8fd6c10a9c97c48b238e351723; session_id=4v4owtzf-1763699344767; __utma=74197771.539016919.1727433454.1763523939.1763699347.34; user_type=hacker; referrer=https://www.hackerrank.com/dashboard?h_r=logo; _gcl_au=1.1.2002194079.1763699543; OptanonConsent=isGpcEnabled=0&datestamp=Fri+Nov+21+2025+10%3A02%3A22+GMT%2B0530+(India+Standard+Time)&version=202503.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&landingPath=https%3A%2F%2Fwww.hackerrank.com%2Fskills-verification&groups=C0002%3A1%2CC0004%3A1%2CC0001%3A1%2CC0003%3A1; _fcdscst=MTc2MzY5OTU0MzExMg==; _uetsid=12e886a0c69311f0b5100345b6f47733|ssf2tr|2|g17|0|2151; _fcdscv=eyJDdXN0b21lcklkIjoiOWUyMDZiMGQtMDAxNC00MmI5LThkMzktYzJiOTA5NGEyNzMxIiwiVmlzaXRvciI6eyJFbWFpbCI6bnVsbCwiRXh0ZXJuYWxWaXNpdG9ySWQiOiIxZDhjYWMyYy1iMGJjLTQyYWUtYWE5MC1hODBmMmU4MDI4MTUifSwiVmlzaXRzIjpbXSwiQWN0aXZpdGllcyI6W10sIkRpYWdub3N0aWNNZXNzYWdlIjpudWxsfQ==; _uetvid=66f31140878511efb7798b845d7f88e8|1jpf5xs|1763699554437|2|1|bat.bing.com/p/insights/c/y; _ga_X2HP4BPSD7=GS2.1.s1763699542$o4$g1$t1763699554$j48$l0$h0; _ga_0QME21KCCM=GS2.1.s1763699542$o4$g1$t1763699554$j48$l0$h0; __utmt=1; __utmb=74197771.6.10.1763699347; _biz_nA=145; _biz_pendingA=%5B%5D",
};

function formatTimeTaken(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

async function fetchLeaderboardPage(
    contestSlug: string,
    offset: number,
    limit: number,
    retryCount = 0
): Promise<LeaderboardResponse | null> {
    const baseUrl = `https://www.hackerrank.com/rest/contests/${contestSlug}/leaderboard`;
    const params = {
        offset,
        limit,
        _: Date.now(),
    };

    const headers = {
        ...HEADERS,
        "Referer": `https://www.hackerrank.com/contests/${contestSlug}/leaderboard`
    };

    try {
        const response = await axios.get<LeaderboardResponse>(baseUrl, {
            params,
            headers,
            timeout: 30000,
            validateStatus: (status) => status < 500,
        });

        if (response.status === 403 || response.status === 401) {
            throw new Error('Access denied - authentication may have expired');
        }

        if (response.status !== 200) {
            throw new Error(`Unexpected status code: ${response.status}`);
        }

        return response.data;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error fetching data (offset ${offset}, attempt ${retryCount + 1}):`, errorMessage);

        if (retryCount < CONFIG.maxRetries) {
            const backoffDelay = CONFIG.delayBetweenRequests * (retryCount + 1);
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
            return fetchLeaderboardPage(contestSlug, offset, limit, retryCount + 1);
        }

        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: ScrapeRequestBody = await request.json();
        const { contestSlug } = body;

        if (!contestSlug) {
            return NextResponse.json(
                { error: 'Missing required field: contestSlug' },
                { status: 400 }
            );
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const firstPage = await fetchLeaderboardPage(contestSlug, 0, CONFIG.pageSize);

                    if (!firstPage) {
                        controller.enqueue(
                            encoder.encode(
                                JSON.stringify({
                                    type: 'error',
                                    message: 'Failed to fetch first page',
                                }) + '\n'
                            )
                        );
                        controller.close();
                        return;
                    }

                    const total = firstPage.total;
                    let allData = [...firstPage.models];

                    controller.enqueue(
                        encoder.encode(
                            JSON.stringify({
                                type: 'progress',
                                current: allData.length,
                                total,
                                percentage: Math.round((allData.length / total) * 100),
                            }) + '\n'
                        )
                    );

                    const totalPages = Math.ceil(total / CONFIG.pageSize);

                    for (let page = 1; page < totalPages; page++) {
                        const offset = page * CONFIG.pageSize;
                        const data = await fetchLeaderboardPage(contestSlug, offset, CONFIG.pageSize);

                        if (data && data.models) {
                            allData = allData.concat(data.models);
                            controller.enqueue(
                                encoder.encode(
                                    JSON.stringify({
                                        type: 'progress',
                                        current: allData.length,
                                        total,
                                        percentage: Math.round((allData.length / total) * 100),
                                    }) + '\n'
                                )
                            );
                        }

                        const delay = CONFIG.delayBetweenRequests + Math.random() * 1000;
                        await new Promise((resolve) => setTimeout(resolve, delay));
                    }

                    console.log('Formatting data for Excel...');
                    const formattedData = allData
                        .sort((a, b) => a.rank - b.rank)
                        .map((model) => ({
                            Rank: model.rank || 'N/A',
                            User: model.hacker || 'N/A',
                            'Solved Count': model.solved_challenges || 0,
                            'Time Taken': model.time_taken ? formatTimeTaken(model.time_taken) : 'N/A',
                            Score: model.score || 0,
                        }));

                    console.log(`Creating Excel file with ${formattedData.length} entries...`);
                    const worksheet = XLSX.utils.json_to_sheet(formattedData);

                    // Set column widths for better readability
                    worksheet['!cols'] = [
                        { wch: 8 },  // Rank
                        { wch: 25 }, // User
                        { wch: 15 }, // Solved Count
                        { wch: 15 }, // Time Taken
                        { wch: 10 }, // Score
                    ];

                    // Add header styling
                    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
                    for (let col = range.s.c; col <= range.e.c; col++) {
                        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                        if (!worksheet[cellAddress]) continue;
                        worksheet[cellAddress].s = {
                            font: { bold: true },
                            fill: { fgColor: { rgb: "4472C4" } },
                            alignment: { horizontal: "center" }
                        };
                    }

                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leaderboard');

                    console.log('Generating Excel buffer...');
                    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                    const base64Excel = Buffer.from(excelBuffer).toString('base64');

                    console.log('Sending complete event...');
                    controller.enqueue(
                        encoder.encode(
                            JSON.stringify({
                                type: 'complete',
                                data: base64Excel,
                                fileName: `${contestSlug}_leaderboard.xlsx`,
                                totalEntries: formattedData.length,
                            }) + '\n'
                        )
                    );

                    console.log('Complete event sent successfully');
                    controller.close();
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                    controller.enqueue(
                        encoder.encode(
                            JSON.stringify({
                                type: 'error',
                                message: errorMessage,
                            }) + '\n'
                        )
                    );
                    controller.close();
                }
            },
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
