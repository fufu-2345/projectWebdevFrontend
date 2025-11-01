"use client";
import React, { useEffect, useState } from "react";
import { myAppHook } from "@/context/AppProvider";
import toast from "react-hot-toast";

interface Product {
  id: number;
  title: string;
  cost: number;
  stock: number;
}

interface Item {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

interface Order {
  id: number;
  totalprice: number;
  status: string;
  items: Item[];
}

const Page: React.FC = () => {
  const { authToken, isLoading: authLoading } = myAppHook();
  const [order, setOrder] = useState<Order | null>(null);
  const [promoTotal, setPromoTotal] = useState<number | null>(null);
  const [appliedPromotions, setAppliedPromotions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // โหลดข้อมูล cart
  const fetchCart = async () => {
    if (!authToken) return;
    try {
      const res = await fetch("http://localhost:8000/api/cart", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.status) {
        setOrder(data.cart);
        await calculatePromotions();
      } else {
        setOrder(null);
      }
    } catch (err) {
      console.error("Fetch cart error:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePromotions = async () => {
      if (!authToken) return;
      try {
        const res = await fetch("http://localhost:8000/api/cart/calculate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });
        const data = await res.json();
        if (data.status) {
          setPromoTotal(data.totalprice);
          const promoIdsArray = Object.values(data.applied_promotions_ids).map(Number);
          setAppliedPromotions(promoIdsArray);
        }
      } catch (err) {
        console.error("Promotion calc error:", err);
      }
    };




  useEffect(() => {
    fetchCart();
  }, [authToken]);

  // 🔹 เปลี่ยนจำนวนสินค้า
  const handleQuantityChange = async (
    itemId: number,
    newQuantity: number,
    stock: number
  ) => {
    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > stock) newQuantity = stock;

    try {
      const res = await fetch("http://localhost:8000/api/cart/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ item_id: itemId, quantity: newQuantity }),
      });
      const data = await res.json();
      if (data.status) {
        await fetchCart();
        await calculatePromotions();
      }
       else toast.success(data.message);
    } catch (err) {
      console.error(err);
      toast.error("Error updating quantity");
    }
  };

  // ลบสินค้าออกจากตะกร้า
  const handleDelete = async (itemId: number) => {
    try {
      const res = await fetch("http://localhost:8000/api/cart/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ item_id: itemId }),
      });
      const data = await res.json();
      if (data.status) fetchCart();
      else toast.success(data.message);
    } catch (err) {
      console.error(err);
      toast.error("Error deleting item");
    }
  };

  // Checkout
  const handleCheckout = async () => {
    if (!authToken) {
      toast.error("Please login first!");
      return;
    }
    try {
      const res = await fetch("http://localhost:8000/api/cart/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();

      if (data.status) {
        toast.success("Order placed successfully! Total: $" + data.totalprice);
        setOrder(null);
      } else {
        toast.success(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Checkout failed!");
    }
  };

  // รวมราคาสินค้าทั้งหมด
  const calculateTotal = () =>
    order?.items?.reduce(
      (acc, item) => acc + item.quantity * item.product.cost,
      0
    ) || 0;

  // Loading
  if (loading || authLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600 animate-pulse text-lg">
          Loading your cart...
        </p>
      </div>
    );

  // ตะกร้าว่าง
  if (!order || !order.items || order.items.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
        <h2 className="text-2xl font-bold text-gray-700 mb-2">
          Your cart is empty
        </h2>
        <a
          href="/"
          className="px-6 py-3 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition"
        >
          Go Shopping
        </a>
      </div>
    );

  // 🔹 แสดงรายการสินค้า
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center sm:text-left">
          Shopping Cart
        </h1>
      </header>

      <main>
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 shadow-sm text-sm sm:text-base">
            <thead>
              <tr className="bg-gray-100 text-center">
                <th className="p-3 border">Product</th>
                <th className="p-3 border">Price</th>
                <th className="p-3 border">Quantity</th>
                <th className="p-3 border">Total</th>
                <th className="p-3 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr
                  key={item.id}
                  className="text-center hover:bg-gray-50 transition duration-150"
                >
                  <td className="p-2 sm:p-3 border font-medium">
                    {item.product.title}
                  </td>
                  <td className="p-2 sm:p-3 border">${item.product.cost}</td>
                  <td className="p-2 sm:p-3 border">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item.id,
                            item.quantity - 1,
                            item.product.stock
                          )
                        }
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        pattern="\d+"
                        onChange={(e) =>
                          handleQuantityChange(
                            item.id,
                            parseInt(e.target.value) || 1,
                            item.product.stock
                          )
                        }
                        className="w-12 sm:w-16 px-2 py-1 border rounded text-center"
                      />
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item.id,
                            item.quantity + 1,
                            item.product.stock
                          )
                        }
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Stock: {item.product.stock}
                    </p>
                  </td>
                  <td className="p-2 sm:p-3 border">
                    ${(item.quantity * item.product.cost).toFixed(2)}
                  </td>
                  <td className="p-2 sm:p-3 border">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

    <div className="mt-6 flex flex-col sm:flex-row justify-between items-start gap-4">
  <div className="flex flex-col">
    <p className="text-xl font-semibold">
      Total:{" "}
      <span className="text-green-600">
        ${promoTotal !== null ? promoTotal.toFixed(2) : calculateTotal().toFixed(2)}
      </span>
    </p>

   {appliedPromotions.length > 0 && (
  <div className="text-sm text-gray-500 mt-1">
    {appliedPromotions.map((id) => {
      let message = "";
      switch (id) {
        case 1:
          message = "ได้รับโปรโมชั่นซื้อ2ถูกกว่า!";
          break;
        case 2:
          message = "ได้รับโปรโมชั่นวันและเดือนตรงกัน!";
          break;
        case 3:
          message = "ได้รับโปรโมชั่นซื้อ2แถม1!";
          break;
        default:
          message = "";
      }
      return message ? <p key={id}>{message}</p> : null;
    })}
  </div>
)}
  </div>

  <button
    onClick={handleCheckout}
    className="px-6 py-3 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition"
  >
    Checkout
  </button>
</div>
 </main>
    </div>
  );
};

export default Page;
