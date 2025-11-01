"use client";

import { useEffect, useMemo, useState } from "react";
import { myAppHook } from "@/context/AppProvider";
import toast from "react-hot-toast";

type DbStatus =
  | "in cart"
  | "wait payment"
  | "payment"
  | "shipping"
  | "completed"
  | "complete"
  | string;

type UiStatus = "payment" | "shipping" | "success";

type OrderRow = {
  id: number;
  datetime?: string | null;
  totalprice?: number | null;
  promotion?: string | null;
  status?: DbStatus | null;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
  history?: HistoryRow | null;
};

type OrderItem = {
  product_id: number;
  quantity: number;
  title?: string;
  price?: number;
};

type HistoryRow = {
  id: number;
  totalprice?: number | null;
  item?: string | any;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
};

function normalizeUiStatus(s?: DbStatus | null): UiStatus {
  const t = String(s || "")
    .toLowerCase()
    .trim();
  if (t === "shipping") return "shipping";
  if (t === "completed" || t === "complete" || t === "success")
    return "success";
  return "payment";
}

function extractItems(o: OrderRow): OrderItem[] {
  if (Array.isArray(o.items)) return o.items;
  const raw = (o as any)?.history?.item ?? (o as any)?.items_json ?? null;
  if (raw) {
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) {
        return parsed.map((x: any) => ({
          product_id: Number(x.product_id ?? x.id),
          quantity: Number(x.quantity ?? x.qty ?? 1),
          title: x.title,
          price: x.price != null ? Number(x.price) : undefined,
        }));
      }
    } catch {}
  }
  return [];
}

async function fetchOrderProducts(
  orderId: number,
  token: string
): Promise<OrderItem[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}/products`,
    {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const list: any[] = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.products)
      ? data.products
      : [];
  return list.map((x: any) => ({
    product_id: Number(x.product_id ?? x.id),
    quantity: Number(x.quantity ?? x.qty ?? 1),
    title: x.title,
    price: x.price != null ? Number(x.price) : undefined,
  }));
}

export default function OrdersPage() {
  const { authToken, isLoading } = myAppHook();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tab, setTab] = useState<UiStatus>("payment");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [lazyItems, setLazyItems] = useState<Record<number, OrderItem[]>>({});

  useEffect(() => {
    if (!authToken) {
      setErr("กรุณาเข้าสู่ระบบก่อน");
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          cache: "no-store",
          signal: ac.signal,
        });
        const data = await res.json();
        if (!res.ok || data?.status === false)
          throw new Error(data?.message || `HTTP ${res.status}`);
        const list: OrderRow[] = Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data?.data)
            ? data.data
            : [];
        setOrders(list);
      } catch (e: any) {
        if (e?.name !== "AbortError")
          setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [authToken]);

  const visible = useMemo(() => {
    return orders.filter((o) => {
      const raw = String(o.status || "")
        .toLowerCase()
        .trim();
      if (tab === "payment") return raw === "wait payment";
      return normalizeUiStatus(o.status) === tab;
    });
  }, [orders, tab]);

  async function changeStatus(orderId: number, nextUi: UiStatus) {
    if (!authToken) return;
    const nextDb: DbStatus = nextUi === "success" ? "completed" : nextUi;

    const prev = [...orders];
    setOrders(
      prev.map((o) => (o.id === orderId ? { ...o, status: nextDb } : o))
    );

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ status: nextDb }),
        }
      );
      const data = await res.json();
      if (!res.ok || data?.status === false)
        throw new Error(data?.message || `HTTP ${res.status}`);
      if (data?.order) {
        setOrders((curr) =>
          curr.map((o) => (o.id === orderId ? data.order : o))
        );
      }
    } catch (e: any) {
      setOrders(prev);
      toast.error(e?.message || "อัปเดตสถานะไม่สำเร็จ");
    }
  }

  async function toggleExpand(order: OrderRow) {
    const id = order.id;
    const now = !expanded[id];
    setExpanded((s) => ({ ...s, [id]: now }));
    if (now) {
      const already =
        (Array.isArray(order.items) && order.items.length > 0) ||
        (lazyItems[id] && lazyItems[id].length > 0) ||
        extractItems(order).length > 0;

      if (!already && authToken) {
        const fetched = await fetchOrderProducts(id, authToken);
        if (fetched.length > 0) setLazyItems((m) => ({ ...m, [id]: fetched }));
      }
    }
  }

  function LineItems({ o }: { o: OrderRow }) {
    const inline = extractItems(o);
    const fromLazy = lazyItems[o.id] || [];
    const items = inline.length > 0 ? inline : fromLazy;
    if (items.length === 0)
      return <div className="text-sm text-gray-500">ไม่มีรายการสินค้า</div>;
    return (
      <ul className="mt-2 space-y-1">
        {items.map((it, idx) => (
          <li key={`${it.product_id}-${idx}`} className="text-sm text-gray-800">
            • #{it.product_id} {it.title ? `– ${it.title}` : ""} x {it.quantity}
            {typeof it.price === "number" ? ` ราคาชิ้นละ ${it.price}฿` : ""}
          </li>
        ))}
      </ul>
    );
  }

  function ActionButton({ o }: { o: OrderRow }) {
    const s = normalizeUiStatus(o.status);
    if (s === "payment") {
      return (
        <button
          onClick={() => changeStatus(o.id, "shipping")}
          className="px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
        >
          ชำระเงิน
        </button>
      );
    }
    if (s === "shipping") {
      return (
        <button
          onClick={() => changeStatus(o.id, "success")}
          className="px-3 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
        >
          ยืนยันการรับสินค้า
        </button>
      );
    }
    return <span className="text-emerald-700 font-medium">จัดส่งสำเร็จ</span>;
  }

  if (isLoading || loading) return <main className="p-4">กำลังโหลด...</main>;
  if (err) return <main className="p-4 text-red-600">{err}</main>;

  return (
    <div className="p-4 sm:p-8">
      <header>
        <h1 className="text-2xl font-bold mb-4">ประวัติการสั่งซื้อ</h1>
      </header>

      <main>
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setTab("payment")}
            className={`px-4 py-2 rounded-full border ${
              tab === "payment"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-800"
            }`}
          >
            Payment / รอชำระเงิน
          </button>
          <button
            onClick={() => setTab("shipping")}
            className={`px-4 py-2 rounded-full border ${
              tab === "shipping"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-800"
            }`}
          >
            Shipping / ระหว่างการจัดส่ง
          </button>
          <button
            onClick={() => setTab("success")}
            className={`px-4 py-2 rounded-full border ${
              tab === "success"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-800"
            }`}
          >
            Success / จัดส่งสำเร็จ
          </button>
        </div>

        {/* List */}
        {visible.length === 0 ? (
          <p className="text-gray-600">ยังไม่มีรายการในหมวดนี้</p>
        ) : (
          <div className="space-y-4">
            {visible.map((o) => {
              const uiStatus = normalizeUiStatus(o.status);
              const dt = o.datetime ?? o.created_at;
              return (
                <div
                  key={o.id}
                  className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold">
                        ออเดอร์ #{o.id}
                      </div>
                      <div className="text-sm text-gray-700 mt-1">
                        วันที่:{" "}
                        <span className="font-medium">
                          {dt ? new Date(dt).toLocaleString("th-TH") : "-"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">
                        ยอดรวม:{" "}
                        <span className="font-bold">{o.totalprice ?? 0}฿</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          uiStatus === "payment"
                            ? "bg-yellow-100 text-yellow-800"
                            : uiStatus === "shipping"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                        }`}
                        title={`สถานะ: ${uiStatus}`}
                      >
                        {uiStatus}
                      </span>
                      <ActionButton o={o} />
                    </div>
                  </div>

                  <button
                    onClick={() => toggleExpand(o)}
                    className="self-start text-sm text-gray-700 underline underline-offset-4 hover:text-gray-900"
                  >
                    {expanded[o.id] ? "ซ่อนรายการสินค้า" : "ดูรายการสินค้า"}
                  </button>

                  {expanded[o.id] && (
                    <div className="rounded-lg border bg-gray-50 p-3">
                      <LineItems o={o} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
