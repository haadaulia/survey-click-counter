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

export default function Home() {
  const [formName, setFormName] = useState("");
  const [formLink, setFormLink] = useState("");
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadForms();
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

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload-submissions", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Failed to upload file: ${error.error || "Unknown error"}`);
        return;
      }

      const result = await res.json();
      alert(
        `Upload successful! Processed: ${result.processed || 0}, Errors: ${
          result.errors || 0
        }`
      );

      await loadForms();
    } catch (err) {
      console.error(err);
      alert("Failed to upload file");
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
    <main className="min-h-screen flex items-start justify-center bg-white px-4 py-8">
      <div className="w-full max-w-6xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black text-center mb-10 leading-tight">
          Survey Click Counter
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] gap-8">
          <section className="bg-[#EBF5E3] border border-[#B9B9B9] rounded-3xl p-6 sm:p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-black">
              Create tracked form
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-black">
                Form name
              </label>
              <input
                type="text"
                className="w-full border border-black rounded-md px-3 py-2 text-sm text-black placeholder-[#D9D9D9] bg-white"
                placeholder="STEMM feedback form"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={generating}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1 text-black">
                Form URL
              </label>
              <input
                type="url"
                className="w-full border border-black rounded-md px-3 py-2 text-sm text-black placeholder-[#D9D9D9] bg-white"
                placeholder="https://forms.office.com/..."
                value={formLink}
                onChange={(e) => setFormLink(e.target.value)}
                disabled={generating}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !formName || !formLink}
              className="w-full sm:w-auto px-6 py-2 text-sm font-semibold rounded-md bg-[#D9D9D9] text-black shadow-lg shadow-gray-400 hover:bg-[#c9c9c9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? "Generating..." : "Generate"}
            </button>

            <div className="mt-6">
              <label className="block text-sm font-medium mb-2 text-black">
                Upload submissions (CSV / Excel)
              </label>

              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={handleUpload}
                disabled={uploading}
                className="block w-full text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#D9D9D9] file:text-black hover:file:bg-[#c9c9c9] disabled:opacity-50 disabled:cursor-not-allowed"
              />

              {uploading && (
                <p className="text-sm text-black mt-2">Uploading...</p>
              )}
            </div>
          </section>

          <section className="bg-[#EBF5E3] border border-[#B9B9B9] rounded-3xl p-4 sm:p-6 md:p-8 shadow-lg overflow-x-auto">
            <h2 className="text-2xl font-semibold mb-4 text-black">
              Forms overview
            </h2>

            {loading ? (
              <p className="text-sm text-black">Loading…</p>
            ) : forms.length === 0 ? (
              <p className="text-sm text-black">
                No forms yet. Create one on the left.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs sm:text-sm border-collapse text-black bg-[#EBF5E3]">
                  <thead>
                    <tr className="bg-[#EBF5E3]">
                      <th className="border border-[#B9B9B9] px-2 sm:px-3 py-2 text-left">
                        Form name
                      </th>
                      <th className="border border-[#B9B9B9] px-2 sm:px-3 py-2 text-left">
                        Form URL
                      </th>
                      <th className="border border-[#B9B9B9] px-2 sm:px-3 py-2 text-left">
                        Tracked link
                      </th>
                      <th className="border border-[#B9B9B9] px-2 sm:px-3 py-2 text-left">
                        Total clicks
                      </th>
                      <th className="border border-[#B9B9B9] px-2 sm:px-3 py-2 text-left">
                        Total submissions
                      </th>
                      <th className="border border-[#B9B9B9] px-2 sm:px-3 py-2 text-left">
                        Conversion %
                      </th>
                      <th className="border border-[#B9B9B9] px-2 sm:px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {forms.map((form) => (
                      <tr
                        key={form.id}
                        className="odd:bg-[#EBF5E3] even:bg-[#e1efd5]"
                      >
                        <td className="border border-[#B9B9B9] px-2 sm:px-3 py-2">
                          {form.name}
                        </td>
                        <td className="border border-[#B9B9B9] px-2 sm:px-3 py-2">
  <a
    href={form.formUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-600 hover:underline break-all text-xs"
  >
    {form.formUrl}
  </a>
</td>

                        <td className="border border-[#B9B9B9] px-2 sm:px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="flex-1 break-all text-xs">
                              {form.trackedLink}
                            </span>
                            <button
                              onClick={() => handleCopyLink(form.trackedLink)}
                              className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs whitespace-nowrap"
                              title="Copy link"
                            >
                              Copy
                            </button>
                          </div>
                        </td>
                        <td className="border border-[#B9B9B9] px-2 sm:px-3 py-2 text-center">
                          {form.clicks}
                        </td>
                        <td className="border border-[#B9B9B9] px-2 sm:px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span>{form.submissions}</span>
                            <button
                              onClick={() =>
                                handleIncrementSubmissions(form.id)
                              }
                              className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs"
                              title="Manually increment submissions"
                            >
                              +1
                            </button>
                          </div>
                        </td>
                        <td className="border border-[#B9B9B9] px-2 sm:px-3 py-2 text-center">
                          {form.conversion}
                        </td>
                        <td className="border border-[#B9B9B9] px-2 sm:px-3 py-2 text-center">
                          <button
                            onClick={() => handleDelete(form.id)}
                            className="text-xl font-bold text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            ×
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