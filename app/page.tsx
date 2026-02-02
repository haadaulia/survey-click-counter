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


export default function Home() {
  const [formName, setFormName] = useState("");
  const [formLink, setFormLink] = useState("");
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const handleIncrementSubmissions = async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/forms/${id}/increment-submissions`, {
        method: "POST",
      });

      if (!res.ok) {
        alert("Failed to increment submissions");
        return;
      }

      setForms((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                submissions: f.submissions + 1,
                conversion:
                  f.clicks > 0
                    ? `${Math.round(((f.submissions + 1) / f.clicks) * 100)}%`
                    : "0%",
              }
            : f
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to increment submissions");
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


  const handleCopyLink = async (link: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(link);
      alert("Link copied to clipboard!");
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-8 sm:py-12">
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
        
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-xl px-6 py-4 sm:py-3 rounded-3xl shadow-2xl border border-white/60 mb-6">
            <div className="w-3 h-3 bg-green-400 rounded-full ring-2 ring-green-200/60 animate-pulse"></div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-gray-900 via-black to-gray-900 bg-clip-text text-transparent leading-tight">
              Survey Tracker
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto font-medium px-4">
            Track clicks & conversions with one dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
  <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 text-center group hover:shadow-3xl hover:-translate-y-2 transition-all duration-500">
    <p className="text-sm font-medium text-gray-600 mb-3">Total Clicks</p>
    <p className="text-4xl font-black text-gray-900 mb-4">
      {forms.reduce((a, f) => a + f.clicks, 0).toLocaleString()}
    </p>
    <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto w-24" />
  </div>
  
  <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 text-center group hover:shadow-3xl hover:-translate-y-2 transition-all duration-500">
    <p className="text-sm font-medium text-gray-600 mb-3">Total Submissions</p>
    <p className="text-4xl font-black text-gray-900 mb-4">
      {forms.reduce((a, f) => a + f.submissions, 0)}
    </p>
    <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mx-auto w-24" />
  </div>
  
  <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 text-center group hover:shadow-3xl hover:-translate-y-2 transition-all duration-500">
    <p className="text-sm font-medium text-gray-600 mb-3">Avg Conversion</p>
    <p className="text-4xl font-black text-gray-900 mb-4">
      {forms.length > 0 
        ? Math.round(forms.reduce((a, f) => a + parseFloat(f.conversion || '0'), 0) / forms.length) + '%'
        : '0%'
      }
    </p>
    <div className="h-2 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full mx-auto w-24" />
  </div>
</div>

       

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Create Form */}
         <section className="lg:col-span-1 group bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl p-6 sm:p-5 lg:p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 lg:hover:-translate-y-3">



            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100/80">
              <div className="w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-emerald-200/80"></div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                New Form
              </h2>
            </div>

            <div className="space-y-5 sm:space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  📝 Form Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3.5 sm:text-base rounded-2xl border-2 border-gray-200/80 bg-white/70 backdrop-blur-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/60 transition-all duration-300 text-lg placeholder-gray-400 shadow-sm hover:shadow-md hover:border-gray-300 text-gray-900"
                  placeholder="STEMM Winter Feedback"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  disabled={generating}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  🔗 Microsoft Forms URL
                </label>
                <input
                  type="url"
                  className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200/80 bg-white/70 backdrop-blur-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/60 transition-all duration-300 text-lg placeholder-gray-400 shadow-sm hover:shadow-md hover:border-gray-300 text-gray-900 font-mono resize-none"
                  placeholder="https://forms.office.com/r/..."
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  disabled={generating}
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !formName || !formLink}
                className="w-full py-4 sm:py-5 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg shadow-2xl hover:shadow-3xl hover:from-emerald-600 hover:to-teal-700 focus:ring-4 focus:ring-emerald-200/60 transform hover:-translate-y-1 hover:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.97]"
              >
                {generating ? (
                  <>
                    <svg className="w-5 h-5 animate-spin mx-auto mb-1" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Creating...
                  </>
                ) : (
                  "🚀 Generate Tracked Link"
                )}
              </button>

              <div className="pt-6 border-t border-gray-100/80">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  📊 Bulk Upload Excel/CSV
                </label>
                <input
                  type="file"
                  name="files"
                  multiple
                  accept=".xlsx,.csv"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-lg file:font-bold file:bg-gradient-to-r file:from-emerald-500 file:to-teal-600 file:text-white hover:file:from-emerald-600 hover:file:to-teal-700 file:shadow-xl hover:file:shadow-2xl file:transition-all file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />

                {uploading && (
                  <p className="text-sm text-emerald-600 mt-2 font-medium flex items-center gap-2 animate-pulse">
                    ⬆️ Processing...
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Forms Table */}
          
          <section className="lg:col-span-2 group bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl p-4 sm:p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 lg:hover:-translate-y-3">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100/80">
              <div className="w-3 h-3 bg-blue-400 rounded-full ring-2 ring-blue-200/80"></div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </h2>
            </div>

            {loading ? (
              <div className="flex flex-col sm:flex-row items-center justify-center py-16 sm:py-12 gap-4">
                <div className="w-12 h-12 border-4 border-emerald-200/60 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-lg text-gray-600 font-medium text-center">Loading forms...</p>
              </div>
            ) : forms.length === 0 ? (
              <div className="text-center py-20 sm:py-16">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <svg className="w-12 h-12 sm:w-14 sm:h-14 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-xl sm:text-2xl text-gray-600 font-semibold mb-2">No forms yet</p>
                <p className="text-gray-500 text-sm sm:text-base">Create your first tracked form on the left</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200/60 shadow-inner bg-white/50">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-white/70 to-gray-50/70 backdrop-blur-sm border-b-2 border-gray-200/80">
                      <th className="px-3 sm:px-4 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs border-r border-gray-200/60 whitespace-nowrap">Form Name</th>
                      <th className="px-3 sm:px-4 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs border-r border-gray-200/60 hidden sm:table-cell whitespace-nowrap">Form URL</th>
                      <th className="px-3 sm:px-4 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs border-r border-gray-200/60 whitespace-nowrap">Tracked Link</th>
                      <th className="px-3 sm:px-4 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs border-r border-gray-200/60 hidden sm:table-cell whitespace-nowrap" >Total Clicks</th>
                      <th className="px-3 sm:px-4 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs border-r border-gray-200/60 whitespace-nowrap">Total Submissions</th>
                      <th className="px-3 sm:px-4 py-4 text-left font-bold text-gray-700 uppercase tracking-wider text-xs whitespace-nowrap">Conversion %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/80">
                    {forms.map((form) => (
                      <tr
                        key={form.id}
                        className="hover:bg-white/90 transition-all duration-200 border-b border-gray-100/60 group/form-row"
                      >
                        <td className="px-3 sm:px-4 py-4 sm:py-5 font-semibold text-gray-900 max-w-[180px] sm:max-w-[200px] truncate cursor-pointer hover:text-emerald-600">
                          {form.name}
                        </td>
                        <td className="px-3 sm:px-4 py-4 sm:py-5 align-top w-[35%] sm:w-[40%] hidden sm:table-cell max-w-[400px]">
                          <a
                            href={form.formUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 font-mono text-xs bg-emerald-100/70 px-2.5 py-1.5 rounded-xl hover:bg-emerald-100/90 shadow-sm transition-all duration-200 mb-1.5 inline-block hover:-translate-y-0.5"
                          >
                            View →
                          </a>
                          <div className="text-xs font-mono text-gray-600 break-all leading-tight">
                            {form.formUrl}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-4 sm:py-5">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="flex-1 text-xs font-mono text-gray-500 max-w-[120px] sm:max-w-[140px] truncate bg-gray-100/80 px-2.5 py-1.5 rounded-xl shadow-sm">
                              {form.trackedLink.slice(-20)}
                            </span>
                            <button
                              onClick={() => handleCopyLink(form.trackedLink)}
                              className="min-h-[38px] sm:min-h-[44px] px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-200/60 transform hover:-translate-y-0.5 hover:scale-[0.98] transition-all duration-200 flex items-center justify-center"
                              title="Copy full link"
                            >
                              📋
                            </button>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-4 sm:py-5 text-right hidden sm:table-cell">
                          <span className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-sm font-bold rounded-xl shadow-sm">
                            {form.clicks.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-4 sm:py-5">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="font-mono text-base sm:text-lg font-bold text-gray-900 min-w-[2rem] text-right">
                              {form.submissions}
                            </span>
                            <button
                              onClick={() => handleIncrementSubmissions(form.id)}
                              className="min-h-[38px] sm:min-h-[44px] w-11 sm:w-12 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-green-700 focus:ring-4 focus:ring-emerald-200/60 transform hover:scale-90 active:scale-85 transition-all duration-200 flex items-center justify-center"
                              title="Add submission from Forms Excel"
                            >
                              ➕
                            </button>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-4 sm:py-5 w-[100px] sm:w-[120px]">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span
                              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm whitespace-nowrap transition-all duration-200 ${
                                parseFloat(form.conversion) > 20
                                  ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 hover:from-emerald-200 hover:to-green-200'
                                  : parseFloat(form.conversion) > 10
                                  ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 hover:from-yellow-200 hover:to-amber-200'
                                  : 'bg-gradient-to-r from-red-100 to-rose-100 text-rose-800 hover:from-red-200 hover:to-rose-200'
                              }`}
                            >
                              {form.conversion}
                            </span>
                            <button
                              onClick={() => handleDelete(form.id)}
                              className="min-h-[36px] sm:min-h-[38px] w-10 sm:w-11 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:from-rose-600 hover:to-red-700 focus:ring-4 focus:ring-rose-200/60 transform hover:scale-90 active:scale-85 transition-all duration-200 flex items-center justify-center group-hover/form-row:scale-95"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
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
