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

  useEffect(() => {
    const loadForms = async () => {
      try {
        const res = await fetch("/api/forms");
        if (!res.ok) {
          console.error("Failed to load forms");
          return;
        }

        const data: Omit<Form, "conversion">[] = await res.json();

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

    loadForms();
  }, []);

  const handleGenerate = async () => {
    if (!formName || !formLink) return;

    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, formUrl: formLink }),
      });

      if (!res.ok) {
        console.error("Failed to create form");
        return;
      }

      const created: Omit<Form, "conversion"> = await res.json();
      const conversion =
        created.clicks > 0
          ? `${Math.round((created.submissions / created.clicks) * 100)}%`
          : "0%";

      setForms((prev) => [{ ...created, conversion }, ...prev]);
      setFormName("");
      setFormLink("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (slug: string) => {
  const res = await fetch(`/api/forms?slug=${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    console.error("Failed to delete form");
    return;
  }

  setForms((prev) => prev.filter((f) => f.id !== slug));
};



  return (
    <main className="min-h-screen flex items-start justify-center bg-white px-4 py-8">
      <div className="w-full max-w-6xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black text-center mb-10 leading-tight">
          Survey Click
          <br className="hidden sm:block" /> Counter
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] gap-8">
          {/* Left: Create tracked link */}
          <section className="bg-[#EBF5E3] border border-[#B9B9B9] rounded-3xl p-6 sm:p-8 shadow-sm">
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
              />
            </div>

            <button
              onClick={handleGenerate}
              className="w-full sm:w-auto px-6 py-2 text-sm font-semibold rounded-md bg-[#D9D9D9] text-black shadow-md shadow-[#D9D9D9] hover:bg-[#c9c9c9] transition-colors"
            >
              Generate
            </button>
          </section>

          {/* Right: Forms overview table */}
          <section className="bg-[#EBF5E3] border border-[#B9B9B9] rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm overflow-x-auto">
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
                    <th className="border border-[#B9B9B9] px-2 sm:px-3 py-2 text-left">
                      {/* delete column header empty on purpose */}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {forms.map((form, i) => (
                    <tr
                      key={form.id ?? i}
                      className="odd:bg-[#EBF5E3] even:bg-[#e1efd5]"
                    >
                      <td className="border border-[#B9B9B9] px-2 sm:px-3 py-2 align-top">
                        {form.name}
                      </td>
                      <td className="border border-[#B9B9B9] px-2 sm:px-3 py-2 align-top break-all">
                        {form.formUrl}
                      </td>
                      <td className="border border-[#B9B9B9] px-2 sm:px-3 py-2 align-top break-all">
                        {form.trackedLink}
                      </td>
                      <td className="border border-[#B9B9B9] px-2 sm:px-3 py-2 align-top">
                        {form.clicks}
                      </td>
                      <td className="border border-[#B9B9B9] px-2 sm:px-3 py-2 align-top">
                        {form.submissions}
                      </td>
                      <td className="border border-[#B9B9B9] px-2 sm:px-3 py-2 align-top">
                        {form.conversion}
                      </td>
                      <td className="border border-[#B9B9B9] px-2 sm:px-3 py-2 align-top text-center">
                        <button
                          onClick={() => handleDelete(form.id)}
                          className="text-2xl leading-none font-semibold text-red-600 hover:text-red-800 cursor-pointer"
                          aria-label="Delete form"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
