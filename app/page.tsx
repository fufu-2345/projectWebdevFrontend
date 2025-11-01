"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { myAppHook, Role } from "@/context/AppProvider";

type Category = { id: string; name: string };
type Promotion = {
  id: number;
  discount?: number;
  created_at?: string;
  updated_at?: string;
};

const categories: Category[] = [
  { id: "pen", name: "ปากกา" },
  { id: "pencil", name: "ดินสอ" },
  { id: "eraser", name: "ยางลบ" },
  { id: "ruler", name: "ไม้บรรทัด" },
  { id: "marker", name: "ปากกาเมจิก" },
  { id: "liquid", name: "ลิควิด" },
];

const FILES: Record<string, string | null> = {
  pen: "pen.jpg",
  pencil: "pensil.jpg",
  eraser: "staedtler.jpg",
  ruler: "ruler.jpg",
  marker: "magicpen.jpg",
  liquid: "liquid.jpg",
};

const API = process.env.NEXT_PUBLIC_API_URL || "";

function localImg(cateId: string) {
  const f = FILES[cateId];
  return f ? `/img-cate/${f}` : null;
}

function promoLabel(p: Promotion, percent: number) {
  if (p.id === 1) return `โปรโมชั่น ซื้อ 2 รับส่วนลด ${percent}%`;
  if (p.id === 2) return `โปรโมชั่นเลขวันตรงกับเดือน รับส่วนลด ${percent}%`;
  if (p.id === 3) return `โปรโมชั่น 1 แถม 1`;
  return `ลด ${percent}%`;
}

export default function CatePage() {
  const { role, authToken } = myAppHook();
  const isAdmin = role === Role.Admin;

  const [promos, setPromos] = useState<Promotion[]>([]);
  const [promoLoading, setPromoLoading] = useState<boolean>(true);
  const [promoErr, setPromoErr] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        setPromoLoading(true);
        setPromoErr(null);
        const res = await fetch(`${API}/promotions`, {
          headers: {
            Accept: "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
        const list: Promotion[] =
          (Array.isArray(data?.promotion) && data.promotion) ||
          (Array.isArray(data?.promotions) && data.promotions) ||
          (Array.isArray(data?.data) && data.data) ||
          [];
        if (!aborted) setPromos(list);
      } catch (e: any) {
        if (!aborted) setPromoErr(e?.message || "โหลดโปรโมชันไม่สำเร็จ");
      } finally {
        if (!aborted) setPromoLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [authToken]);

  return (
    <>
      <header>
        {!isAdmin && (
          <section className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-3">
              {promoLoading ? (
                [0, 1, 2].map((i) => (
                  <div key={`sk-${i}`} className="py-8 sm:py-12 text-center">
                    <div className="mx-4 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse h-24 sm:h-28" />
                  </div>
                ))
              ) : promoErr ? (
                <div className="col-span-1 sm:col-span-3 py-6 text-center text-sm text-red-600">
                  {promoErr}
                </div>
              ) : (
                Array.from({ length: 3 }).map((_, idx) => {
                  const p = promos[idx];

                  if (!p) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="py-8 sm:py-12 text-center uppercase bg-gray-200"
                      >
                        <span className="font-semibold text-xl sm:text-2xl tracking-wide">
                          PROMOTION
                        </span>
                      </div>
                    );
                  }

                  const percent =
                    typeof p.discount === "number" && !Number.isNaN(p.discount)
                      ? Math.round(Number(p.discount))
                      : 0;

                  const bgClass =
                    p.id === 1 || p.id === 3
                      ? "bg-gradient-to-br from-yellow-100 to-yellow-300"
                      : "bg-gradient-to-br from-orange-100 to-orange-300";

                  return (
                    <div
                      key={p.id}
                      className={`py-6 sm:py-10 text-center text-xl sm:text-2xl font-semibold ${bgClass} shadow-md`}
                    >
                      {promoLabel(p, percent)}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}
      </header>

      <main className="mx-auto px-4 py-4">
        <h1 className="text-2xl font-semibold mb-8">เลือกประเภทสินค้า</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 justify-items-center">
          {categories.map((c) => {
            const url = localImg(c.id);
            return (
              <Link
                key={c.id}
                href={`/product?cate=${c.id}`}
                className="bg-white inline-flex flex-col items-center rounded-xl border p-4 sm:p-6 hover:shadow transition w-full max-w-[280px] sm:max-w-[300px] min-h-[240px] focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                aria-label={`ดูสินค้า ${c.name}`}
                title={c.name}
              >
                <div className="mb-3 grid place-items-center rounded-2xl bg-gray-100 overflow-hidden w-28 h-28 sm:w-36 sm:h-36">
                  {url ? (
                    <Image
                      src={url}
                      alt={c.name}
                      width={240}
                      height={240}
                      className="w-full h-full object-cover"
                      priority={false}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">IMG</span>
                  )}
                </div>

                <div className="text-lg sm:text-2xl text-center leading-snug tracking-wide">
                  {c.name}
                </div>
                <div className="text-sm text-gray-500 mt-1">ดูสินค้า</div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
