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

## 📈 Live Metrics Example
| Form           | Clicks | Submissions | Conversion |
|----------------|--------|-------------|------------|
| Event RSVP     | 247    | 23          | **9.3%**   |
| Feedback Form  | 156    | 41          | **26.3%**  |

## 🎯 Live Demo
**[Deployed on Vercel](https://survey-click-counter.vercel.app/)**  
**📱 Fully responsive • 🌍 Live worldwide • ⚡ Serverless scaling**

## 🚀 Quick Start

1. **Create Supabase project**: [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project** (wait ~2min)

2. **Get API Keys**: Settings → **API** → Copy these 3:
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

text

3. **Run SQL** (Dashboard → **SQL Editor**, in order):

```sql
-- 1. CREATE TABLE FIRST
CREATE TABLE forms (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  form_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  submissions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. ENABLE RLS (security)
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- 3. Click tracking function
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

-- 4.
SELECT slug, name, submissions FROM forms; 

bash
git clone https://github.com/haadaulia/survey-click-counter.git
cd survey-click-counter
cp .env.example .env.local
# Paste your 3 keys into .env.local
npm install
npm run dev
Open localhost:3000 → Live clicks work instantly!

💼 Production Challenges Solved
TypeScript strict mode - Next.js 16 App Router compatibility

Excel parsing edge cases - Malformed rows, empty cells, headers

Race condition prevention - Atomic Supabase updates

Vercel deployment - Env vars, Turbopack, serverless optimization

✨ Recent Updates
v2.0 - Production-ready dashboard

Excel parser v2 (handles ALL Microsoft Forms exports)

Smart form detection (filename matching)

Conversion rate analytics

Bulk upload feedback

Error boundaries everywhere

Built for STEM Muslims Society @ Imperial College London ✨
