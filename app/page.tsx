"use client";

import { useEffect, useState } from "react";

type Form = {
  id: string;
  name: string;
  formUrl: string;
  trackedLink: string;
  clicks: number;
  submissions: number;
  conversion: string;
};

const MetricCard = ({
  title,
  value,
  color = 'blue'
}: {
  title: string;
  value: string | number;
  color?: 'blue' | 'green' | 'purple';
}) => {
  const colors = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-teal-600', 
    purple: 'from-purple-500 to-violet-600'
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 group hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
      <p className="text-sm font-medium text-gray-600 mb-2 opacity-90">{title}</p>
      <p className="text-4xl font-black bg-gradient-to-r from-gray-900 to-black bg-clip-text text-transparent mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <div className={`w-full h-2 bg-gradient-to-r ${colors[color as keyof typeof colors]} rounded-full shadow-lg group-hover:scale-[1.02] transition-transform duration-300`} />
    </div>
  );
};

const URLModal = ({ 
  isOpen, 
  onClose, 
  url, 
  title, 
  type 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  url: string; 
  title: string;
  type: 'form' | 'tracked';
}) => {
  const [copied, setCopied] = useState(false);
  const [localOpen, setLocalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalOpen(true);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setLocalOpen(false);
    setTimeout(onClose, 100);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* fixed cursor */}
      <div 
  className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity duration-150 cursor-default"
  style={{ cursor: 'default !important' }}
  onClick={handleClose}
/>



      
      {/*Modal*/}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={`w-full max-w-2xl p-10 bg-white rounded-3xl shadow-2xl border border-slate-100 transform transition-all duration-100 ease-out ${
            localOpen 
              ? 'scale-100 opacity-100 translate-y-0' 
              : 'scale-95 opacity-0 translate-y-2'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* modal content*/}
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className={`w-1.5 h-10 rounded-full ${type === 'form' ? 'bg-gradient-to-b from-blue-500 to-blue-600' : 'bg-gradient-to-b from-teal-500 to-emerald-600'}`}></div>
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{title}</span>
            </h3>
            <button
              onClick={handleClose}
              className="p-2.5 hover:bg-slate-100/80 rounded-2xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-5">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/60 rounded-2xl p-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                URL
              </p>
              <p className="font-mono text-sm text-slate-700 break-all leading-relaxed select-all">
                {url}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl focus:ring-4 focus:ring-teal-200 transition-all duration-200 flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy URL
                  </>
                )}
              </button>

              {type === 'form' && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl focus:ring-4 focus:ring-blue-200 transition-all duration-200 flex items-center gap-2.5 transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open Form
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};



export default function Home() {
  const [formName, setFormName] = useState("");
  const [formLink, setFormLink] = useState("");
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    type: 'form' | 'tracked';
  }>({
    isOpen: false,
    url: '',
    title: '',
    type: 'form'
  });

  useEffect(() => {
    loadForms();
      const interval = setInterval(loadForms, 30000); // Refresh every 30s
      return () => clearInterval(interval);
  }, []);

  const loadForms = async (): Promise<void> => {
    try {
      const res = await fetch("/api/forms");
      if (!res.ok) return;

      const data = (await res.json()) as Omit<Form, "conversion">[];

      const withConversion: Form[] = data.map((f) => ({
        ...f,
        conversion:
          f.clicks > 0
            ? `${Math.round((f.submissions / f.clicks) * 100)}%`
            : "0%",
      }));

      setForms(withConversion);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (): Promise<void> => {
    if (!formName || !formLink) return;

    setGenerating(true);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, formUrl: formLink }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Failed to create form: ${error.error || "Unknown error"}`);
        return;
      }

      const created = (await res.json()) as Omit<Form, "conversion">;

      setForms((prev) => [
        {
          ...created,
          conversion:
            created.clicks > 0
              ? `${Math.round((created.submissions / created.clicks) * 100)}%`
              : "0%",
        },
        ...prev,
      ]);

      setFormName("");
      setFormLink("");
      alert("Form created successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to create form");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this form?")) return;

    try {
      const res = await fetch(`/api/forms?slug=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Failed to delete form");
        return;
      }

      setForms((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete form");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
  
    setUploading(true);
    const formData = new FormData();
    for (const file of files) formData.append("files", file);
  
    try {
      const res = await fetch("/api/upload-submissions", {
        method: "POST",
        body: formData,
      });
  
      const result = await res.json();
  
      if (!res.ok) {
        alert(`Failed to upload: ${result.error || "Unknown error"}`);
        return;
      }
  
      alert(
        `Upload complete!\n` +
        result.results
          .map((r: any) =>
            r.error
              ? `❌ ${r.file}: ${r.error}`
              : `✅ ${r.file}: "${r.matched}" set to ${r.totalSubmissions}`
          )
          .join("\n")
      );
  
      await loadForms();
    } catch (err) {
      console.error(err);
      alert("Failed to upload files");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

const openModal = (url: string, title: string, type: 'form' | 'tracked') => {
  setModalState({ isOpen: true, url, title, type });
};

const closeModal = () => {
  setModalState({ isOpen: false, url: '', title: '', type: 'form' });
};



  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 px-4 py-12 relative overflow-hidden">
      {/* Subtle geometric pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23047857' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <URLModal 
        isOpen={modalState.isOpen}
        onClose={closeModal}
        url={modalState.url}
        title={modalState.title}
        type={modalState.type}
      />

      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex flex-col items-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-600/10 blur-3xl rounded-full"></div>
              <h1 className="relative text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-teal-800 via-teal-600 to-emerald-700 bg-clip-text text-transparent tracking-tight">
                Survey Tracker
              </h1>
            </div>
            <div className="h-1 w-24 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-full"></div>
          </div>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-medium px-4">
            Track clicks & conversions with one dashboard
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 text-center group hover:shadow-xl hover:border-teal-300/40 transition-all duration-300">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Total Clicks</p>
            <p className="text-4xl font-bold text-slate-900 mb-2">
              {forms.reduce((a, f) => a + f.clicks, 0).toLocaleString()}
            </p>
            <div className="h-1 w-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full mx-auto" />
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 text-center group hover:shadow-xl hover:border-emerald-300/40 transition-all duration-300">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Total Submissions</p>
            <p className="text-4xl font-bold text-slate-900 mb-2">
              {forms.reduce((a, f) => a + f.submissions, 0)}
            </p>
            <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full mx-auto" />
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 text-center group hover:shadow-xl hover:border-blue-300/40 transition-all duration-300">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Avg Conversion</p>
            <p className="text-4xl font-bold text-slate-900 mb-2">
              {forms.length > 0 
                ? Math.round(forms.reduce((a, f) => a + parseFloat(f.conversion || '0'), 0) / forms.length) + '%'
                : '0%'
              }
            </p>
            <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mx-auto" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Form */}
          <section className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/60 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
              <div className="w-2 h-8 bg-gradient-to-b from-teal-600 to-emerald-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-slate-900">
                New Form
              </h2>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Form Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all duration-300 text-slate-900 placeholder-slate-400 hover:border-slate-300"
                  placeholder="STEMM Winter Feedback"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  disabled={generating}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Microsoft Forms URL
                </label>
                <input
                  type="url"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all duration-300 text-slate-900 placeholder-slate-400 font-mono text-sm hover:border-slate-300"
                  placeholder="https://forms.office.com/r/..."
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  disabled={generating}
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !formName || !formLink}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold text-base shadow-lg hover:shadow-xl hover:from-teal-700 hover:to-emerald-700 focus:ring-4 focus:ring-teal-200 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Tracked Link
                  </span>
                )}
              </button>

              <div className="pt-6 border-t border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Bulk Upload Excel/CSV
                </label>
                <input
                  type="file"
                  name="files"
                  multiple
                  accept=".xlsx,.csv"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-teal-600 file:to-emerald-600 file:text-white hover:file:from-teal-700 hover:file:to-emerald-700 file:shadow-md hover:file:shadow-lg file:transition-all file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />

                {uploading && (
                  <p className="text-sm text-teal-600 mt-3 font-medium flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Processing uploads...
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Forms Table */}
          <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
              <div className="w-2 h-8 bg-gradient-to-b from-teal-600 to-emerald-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-slate-900">
                Analytics Dashboard
              </h2>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                <p className="text-base text-slate-600 font-medium">Loading forms...</p>
              </div>
            ) : forms.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-xl text-slate-700 font-semibold mb-2">No forms yet</p>
                <p className="text-slate-500">Create your first tracked form to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                      <th className="px-4 py-4 text-left font-bold text-slate-600 uppercase tracking-wider text-xs border-r border-slate-200/60">Form name</th>
                      <th className="px-4 py-4 text-left font-bold text-slate-600 uppercase tracking-wider text-xs border-r border-slate-200/60">Form URL</th>
                      <th className="px-4 py-4 text-left font-bold text-slate-600 uppercase tracking-wider text-xs border-r border-slate-200/60">Tracked link</th>
                      <th className="px-4 py-4 text-center font-bold text-slate-600 uppercase tracking-wider text-xs border-r border-slate-200/60">Total clicks</th>
                      <th className="px-4 py-4 text-center font-bold text-slate-600 uppercase tracking-wider text-xs border-r border-slate-200/60">Total submissions</th>
                      <th className="px-4 py-4 text-center font-bold text-slate-600 uppercase tracking-wider text-xs border-r border-slate-200/60">Conversion %</th>
                      <th className="px-4 py-4 text-center font-bold text-slate-600 uppercase tracking-wider text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                   {forms.map((form, index) => (
  <tr
    key={form.id}
    className={`hover:bg-slate-50/70 transition-all duration-200 ${index !== forms.length - 1 ? 'border-b border-slate-100' : ''}`}
  >
    <td className="px-4 py-5 font-semibold text-slate-900 text-sm border-r border-slate-200/60">
      {form.name}
    </td>
    
    <td className="px-4 py-5 border-r border-slate-200/60">
      <button
        onClick={() => openModal(form.formUrl, `${form.name} - Form URL`, 'form')}
        className="inline-flex items-center gap-2.5 text-sm font-semibold px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-blue-50 to-indigo-50/80 backdrop-blur-xl border border-blue-200/60 hover:from-blue-100/80 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-300/80 text-blue-700 hover:text-blue-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] group relative overflow-hidden"
      >
        <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full group-hover:scale-110 transition-transform duration-200"></div>
        View URL
      </button>
    </td>
    
    <td className="px-4 py-5 border-r border-slate-200/60">
      <button
        onClick={() => openModal(form.trackedLink, `${form.name} - Tracked Link`, 'tracked')}
        className="inline-flex items-center gap-2.5 text-sm font-semibold px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-teal-50 to-emerald-50/80 backdrop-blur-xl border border-emerald-200/60 hover:from-emerald-100/80 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-300/80 text-emerald-700 hover:text-emerald-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] group relative overflow-hidden"
      >
        <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full group-hover:scale-110 transition-transform duration-200"></div>
        View Link
      </button>
    </td>
    
    <td className="px-4 py-5 text-center border-r border-slate-200/60">
      <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-50/80 to-teal-100/60 backdrop-blur-xl rounded-2xl border border-teal-200/60 shadow-sm text-teal-700 font-bold text-sm hover:shadow-md hover:shadow-teal-500/10 hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
        <div className="w-2 h-2 bg-teal-500 rounded-full group-hover:scale-110 transition-transform"></div>
        {form.clicks.toLocaleString()}
      </div>
    </td>
    
    <td className="px-4 py-5 text-center border-r border-slate-200/60">
      <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-50/80 to-emerald-100/60 backdrop-blur-xl rounded-2xl border border-emerald-200/60 shadow-sm text-emerald-700 font-bold text-sm hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
        <div className="w-2 h-2 bg-emerald-500 rounded-full group-hover:scale-110 transition-transform"></div>
        {form.submissions.toLocaleString()}
      </div>
    </td>
    
    <td className="px-4 py-5 text-center border-r border-slate-200/60">
      <div className={`inline-flex items-center gap-2 px-4 py-2.5 backdrop-blur-xl rounded-2xl border shadow-sm font-bold text-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden ${
        parseFloat(form.conversion) > 20
          ? 'bg-gradient-to-r from-emerald-50/80 to-emerald-100/60 border-emerald-200/60 text-emerald-700 hover:shadow-emerald-500/10 hover:border-emerald-300/80'
          : parseFloat(form.conversion) > 10
          ? 'bg-gradient-to-r from-amber-50/80 to-amber-100/60 border-amber-200/60 text-amber-700 hover:shadow-amber-500/10 hover:border-amber-300/80'
          : 'bg-gradient-to-r from-rose-50/80 to-rose-100/60 border-rose-200/60 text-rose-700 hover:shadow-rose-500/10 hover:border-rose-300/80'
      }`}>
        <div className={`w-2 h-2 rounded-full group-hover:scale-110 transition-transform ${
          parseFloat(form.conversion) > 20 ? 'bg-emerald-500' 
          : parseFloat(form.conversion) > 10 ? 'bg-amber-500' 
          : 'bg-rose-500'
        }`}></div>
        {form.conversion}
      </div>
    </td>
    
    <td className="px-4 py-5 text-center">
      <button
        onClick={() => handleDelete(form.id)}
        className="p-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg focus:ring-4 focus:ring-rose-200 transform hover:scale-95 active:scale-90 transition-all duration-200"
        title="Delete form"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </td>
  </tr>
))}

                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
