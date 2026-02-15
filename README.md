# STEMM Survey Counter

📊 **Production analytics dashboard** for STEM Muslims Society (Imperial College London) - processes Microsoft Forms Excel exports, tracks real-time clicks vs submissions, calculates conversion rates.

## 👥 The Team
**STEM Muslims Society @ Imperial College London**  
- [@haadaulia](https://github.com/haadaulia) **(Lead Developer)**  
- [@Muhammed-Nawfal](https://github.com/Muhammed-Nawfal) **(Collaborator)**

## 🚀 Features
- ✅ **Excel Upload** - Parses Microsoft Forms exports (auto-skips headers/empty rows)  
- ✅ **Live Click Tracking** - Real-time link clicks per form  
- ✅ **Bulk Submission Processing** - Excel → Supabase (atomic updates)  
- ✅ **Conversion Analytics** - `submissions ÷ clicks × 100%`  
- ✅ **Multi-Form Support** - Smart form detection & targeting  

## 🛠 Tech Stack
Frontend: Next.js 16 (App Router) + TypeScript + Turbopack
Backend: Supabase PostgreSQL + Admin RPC + Edge Functions
Excel: XLSX.js parsing engine
Deployment: Vercel (Serverless)

text

## 📈 Live Metrics Example
| Form           | Clicks | Submissions | Conversion |
|----------------|--------|-------------|------------|
| Event RSVP     | 247    | 23          | **9.3%**   |
| Feedback Form  | 156    | 41          | **26.3%**  |

## 🎯 Live Demo
**[Deployed on Vercel](https://survey-click-counter.vercel.app/)**  
**📱 Fully responsive • 🌍 Live worldwide • ⚡ Serverless scaling**

## 🚀 Quick Start
Make a Supabase account, create a project and run these 3 separate sql queries
```bash
SELECT slug, name, submissions FROM forms;

#and then

-- Function to increment clicks and return form URL
CREATE OR REPLACE FUNCTION increment_clicks_and_get_url(p_slug TEXT)
RETURNS TEXT AS $$
DECLARE
  v_form_url TEXT;
BEGIN
  UPDATE forms 
  SET clicks = clicks + 1 
  WHERE slug = p_slug
  RETURNING form_url INTO v_form_url;
  
  RETURN v_form_url;
END;
$$ LANGUAGE plpgsql;

-- Function to increment submissions
CREATE OR REPLACE FUNCTION increment_submissions(p_slug TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE forms 
  SET submissions = submissions + 1 
  WHERE slug = p_slug;
END;
$$ LANGUAGE plpgsql;


# and then

CREATE TABLE forms (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  form_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  submissions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);


# then clone from github and do:
cp .env.example .env.local  # Add Supabase credentials
npm install
npm run dev

💼 Production Challenges Solved
TypeScript strict mode - Next.js 16 App Router compatibility

Excel parsing edge cases - Malformed rows, empty cells, headers

Race condition prevention - Atomic Supabase updates

Vercel deployment - Env vars, Turbopack, serverless optimization

✨ Recent Updates
text
v2.0 - Production-ready dashboard
├── Excel parser v2 (handles ALL Microsoft Forms exports)
├── Smart form detection (filename matching)  
├── Conversion rate analytics
├── Bulk upload feedback
└── Error boundaries everywhere
Built for STEM Muslims Society @ Imperial College London
