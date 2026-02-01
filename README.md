# STEMM Survey Counter

📊 **Analytics dashboard for STEM Muslims Society (Imperial College)** - processes Excel survey exports, tracks clicks vs submissions, and calculates conversion rates.

## 🙌 The Team

**STEM Muslims Society @ Imperial College London**  
- [@haadaulia](https://github.com/haadaulia) (Lead Developer)  
- [@Muhammed-Nawfal](https://github.com/Muhammed-Nawfal) (Collaborator)  
- Built for society events & surveys

## 🚀 Features

- **Excel Upload** - Parses Google Forms exports (auto-skips headers/empty rows)  
- **Click Tracking** - Real-time link clicks per form  
- **Submission Counting** - Bulk Excel increments via Supabase RPC  
- **Conversion Rate** - `submissions ÷ clicks × 100%`  
- **Latest Form Auto-Select** - Targets most recent form

## 🛠 Tech Stack

Frontend: Next.js (App Router) + TypeScript
Backend: Supabase PostgreSQL + Admin RPC
Excel: XLSX.js parsing
Deployment: Vercel-ready

text

## 📈 Sample Metrics

| Form          | Clicks | Submissions | Conversion |
|---------------|--------|-------------|------------|
| Event RSVP    | 247    | 23          | 9.3%       |
| Feedback Form | 156    | 41          | 26.3%      |

## 🎯 Quick Setup

```bash
cp .env.example .env.local
# Add your Supabase URL + Anon Key
npm install
npm run dev
📝 Usage
Export Google Form → Excel

Upload file → Auto-processes submissions

View live clicks → submissions → conversion rate

✨ Recent Updates
Major frontend overhaul - Sleek analytics dashboard

Excel parser v2 - Handles malformed rows

Click → submission rate tracking

Production-ready error handling

Built for STEM Muslims Society @ Imperial College