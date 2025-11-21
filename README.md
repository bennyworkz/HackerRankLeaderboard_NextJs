# HackerRank Leaderboard Scraper

A modern, full-stack Next.js application to scrape HackerRank contest leaderboards and export them as Excel files.

![HackerRank Scraper](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)

## ✨ Features

- 🎨 **Premium UI** - Beautiful glassmorphism design with smooth animations
- 📊 **Real-time Progress** - Live progress tracking during scraping
- 📥 **Excel Export** - Download leaderboard data as formatted Excel files
- ⚡ **Fast & Efficient** - Optimized scraping with retry logic
- 🚀 **Easy Deployment** - Deploy to Vercel with one click
- 📱 **Responsive** - Works perfectly on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd hackerrank-scraper
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📖 How to Use

1. **Get Contest Slug**: Find the contest slug from the HackerRank contest URL
   - Example: `hackerrank.com/contests/YOUR-CONTEST-SLUG/leaderboard`

2. **Get Authentication Credentials**:
   - Open the contest leaderboard in your browser
   - Press `F12` to open DevTools
   - Go to the **Network** tab
   - Refresh the page (`F5`)
   - Find the "leaderboard" request
   - Copy the `cookie` and `x-csrf-token` from Request Headers

3. **Start Scraping**:
   - Paste the contest slug, cookie, and CSRF token
   - Click "Start Scraping"
   - Wait for the progress to complete
   - Download your Excel file!

## 🌐 Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy"

### Method 2: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to deploy

### Method 3: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Excel Generation**: SheetJS (xlsx)
- **Deployment**: Vercel

## 📁 Project Structure

```
hackerrank-scraper/
├── app/
│   ├── api/
│   │   └── scrape/
│   │       └── route.ts       # API endpoint for scraping
│   ├── globals.css            # Global styles and design system
│   ├── layout.tsx             # Root layout with metadata
│   └── page.tsx               # Main page component
├── public/                    # Static assets
├── package.json               # Dependencies
└── README.md                  # This file
```

## 🎨 Design Features

- **Dark Theme**: Modern dark color scheme with vibrant accents
- **Glassmorphism**: Frosted glass effect for cards
- **Smooth Animations**: Fade-in, shimmer, and pulse effects
- **Gradient Text**: Eye-catching gradient headings
- **Custom Scrollbar**: Styled scrollbars matching the theme
- **Responsive Typography**: Fluid font sizes using clamp()

## 🔒 Privacy & Security

- All scraping happens server-side
- Credentials are never stored
- No data is logged or saved
- HTTPS encryption on Vercel

## ⚠️ Important Notes

- You must be logged into HackerRank to get valid credentials
- Credentials expire after some time - you may need to refresh them
- Respect HackerRank's rate limits and terms of service
- This tool is for educational purposes only

## 🐛 Troubleshooting

### "Access denied" error
- Your cookie or CSRF token may have expired
- Get fresh credentials from the browser

### "Failed to fetch first page"
- Check if the contest slug is correct
- Ensure you have access to the contest
- Verify your credentials are up-to-date

### Slow scraping
- Large leaderboards take time to scrape
- The app includes delays to avoid rate limiting
- Be patient and let it complete

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 💡 Future Enhancements

- [ ] Support for multiple contests at once
- [ ] CSV export option
- [ ] Historical data tracking
- [ ] Advanced filtering and sorting
- [ ] Dark/Light theme toggle
- [ ] Save credentials securely (encrypted)

## 📧 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Made with ❤️ using Next.js
