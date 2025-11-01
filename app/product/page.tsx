"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";

type ProductView = {
  id: number;
  name: string;
  image?: string | null;
  price: number;
  amount: number;
  category: string;
};

const API = process.env.NEXT_PUBLIC_API_URL;
const DETAIL_BASE = "/detail-product";

const ORIGIN =
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "") || "";

function toAbsoluteUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) return `${ORIGIN}${path}`;
  return `${ORIGIN}/${path}`;
}

type SortKey = "name-asc" | "name-desc" | "price-asc" | "price-desc";
function sortItems(items: ProductView[], key: SortKey): ProductView[] {
  const arr = [...items];
  switch (key) {
    case "name-asc":
      arr.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", ["en", "th"], {
          sensitivity: "base",
        })
      );
      break;
    case "price-asc":
      arr.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      arr.sort((a, b) => b.price - a.price);
      break;
  }
  return arr;
}

export default function ProductPage() {
  const sp = useSearchParams();
  const cate = (sp.get("cate") || "").trim();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<ProductView[]>([]);
  const token = Cookies.get("authToken");

  const [sortKey, setSortKey] = useState<SortKey>("name-asc");
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(true);

  useEffect(() => {
    if (!cate) {
      setItems([]);
      setLoading(false);
      return;
    }

    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const url = `${API}/products?category=${encodeURIComponent(cate)}`;

        const headers: Record<string, string> = { Accept: "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(url, {
          signal: ac.signal,
          cache: "no-store",
          headers,
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status} ${txt || ""}`.trim());
        }

        const json = await res.json();

        const list: ProductView[] = (json.products || json.data || []).map(
          (p: any) => ({
            id: p.id,
            name: p.title ?? p.name,
            image: toAbsoluteUrl(p.file ?? p.banner_image ?? p.image ?? null),
            price: Number(p.cost ?? p.price ?? 0),
            amount: Number(p.stock ?? p.amount ?? 0),
            category: p.category,
          })
        );
        setItems(list);
      } catch (e: any) {
        const msg = String(e?.message || "");
        if (e?.name === "AbortError" || msg.includes("AbortError")) return;
        setErr(msg || "fetch failed");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [cate, token]);

  // กรอง + เรียง
  const visibleItems = useMemo(() => {
    const filtered = onlyAvailable
      ? items.filter((it) => (it.amount ?? 0) > 0)
      : items;
    return sortItems(filtered, sortKey);
  }, [items, onlyAvailable, sortKey]);

  if (!cate) {
    return (
      <main className="w-full min-h-screen bg-gray-200 px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">เลือกรายการสินค้า</h1>
        <p className="mb-4 text-gray-700">
          กรุณาเลือกประเภทที่{" "}
          <Link href="/cate" className="text-blue-700 underline">
            /cate
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="w-full bg-gray-200 px-4 py-4 pt-16 sm:h=[calc(100svh-4.5rem)] h-[calc(100svh-2rem)] overflow-hidden">
      <div className="mx-auto max-w-[1200px]">
        {/* Header + Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold">
              ประเภท: {cate}
            </h1>
            {/* แสดงจำนวนผล หลังกรอง/เรียง (ซ่อนระหว่างโหลด/มี error) */}
            {!loading && !err && (
              <span className="text-sm text-gray-600">
                แสดง {visibleItems.length} รายการ
                {onlyAvailable ? " (เฉพาะที่มีของ)" : ""}
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-gray-700"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
              />
              เฉพาะสินค้าที่มีของ
            </label>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">เรียงโดย:</span>
              <select
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
                <option value="name-asc">ชื่อ (A–Z / ก–ฮ)</option>
                <option value="price-asc">ราคาต่ำ → สูง</option>
                <option value="price-desc">ราคาสูง → ต่ำ</option>
              </select>
            </div>
          </div>
        </div>

        {loading && <div className="text-gray-700">กำลังโหลด...</div>}
        {!loading && err && (
          <div className="text-red-600">เกิดข้อผิดพลาด: {err}</div>
        )}

        {!loading && !err && (
          <div className="bg-white rounded-[32px] shadow border-2 border-gray-400 bg-gray-200 p-3 sm:p-4 md:p-5">
            {/* กล่องใน (scroll ภายใน) */}
            <div
              className="
                rounded-[28px] bg-white p-4 sm:p-6 md:p-8
                h-[70vh] overflow-y-auto pe-2 overscroll-contain
                border-[3px] border-gray-200
              "
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                {visibleItems.map((p) => (
                  <Link
                    key={p.id}
                    href={`${DETAIL_BASE}/${p.id}?cate=${encodeURIComponent(p.category)}`}
                    className="group block rounded-[22px] border border-gray-400 overflow-hidden hover:shadow-sm transition focus:outline-none focus:ring-2 focus:ring-gray-300"
                    aria-label={`ดูรายละเอียด ${p.name}`}
                  >
                    <div className="relative bg-white aspect-[1.25] overflow-hidden grid place-items-center">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-contain p-2"
                        />
                      ) : (
                        <span className="text-gray-400">IMG</span>
                      )}
                    </div>

                    {/* เส้นคั่น */}
                    <div className="h-px bg-gray-400" />

                    {/* ครึ่งล่าง: ข้อมูล */}
                    <div className="p-3 sm:p-4">
                      <div className="text-base sm:text-lg font-semibold leading-snug line-clamp-2 group-hover:underline">
                        {p.name}
                      </div>
                      <div className="text-sm sm:text-base text-gray-700 mt-1">
                        คงเหลือ{" "}
                        <span className="font-medium text-gray-900">
                          {p.amount}
                        </span>
                      </div>
                      <div className="text-sm sm:text-base text-gray-700">
                        ราคา{" "}
                        <span className="font-medium text-gray-900">
                          {p.price.toFixed(2)}
                        </span>{" "}
                        ฿
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {visibleItems.length === 0 && (
                <div className="text-center text-gray-600 mt-6">
                  ไม่พบสินค้าในเงื่อนไขที่เลือก
                </div>
              )}
            </div>
          </div>
        )}

        {/* ปุ่ม Back */}
        <div className="mt-4 sm:mt-6">
          <Link
            href="/.."
            className="inline-flex items-center rounded-full bg-gray-700 px-5 py-2 text-white hover:bg-gray-800 transition"
          >
            Back
          </Link>
        </div>
      </div>
    </main>
  );
}
