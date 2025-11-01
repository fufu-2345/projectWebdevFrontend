"use client";

import React, { useState, useEffect } from "react";
import { myAppHook } from "@/context/AppProvider";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import axios from "axios";
import toast from "react-hot-toast";

interface formData {
  id: number;
  discount: number;
}

const Promotion: React.FC = () => {
  const { isLoading, authToken, role } = myAppHook();
  const router = useRouter();
  const [formData, setFormData] = useState<formData[]>([]);

  if (isLoading) {
    return <Loader />;
  }

  useEffect(() => {
    if (!authToken || role === "user") {
      router.back();
    }
    fetchData();
  }, [authToken, role]);

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/promotions`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setFormData(response.data.promotion);
    } catch (error) {
      console.log(error);
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (role === "admin") {
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/updatePromotions`,
          { promotions: formData },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        toast.success("Updated successfully");
      } catch (error) {
        console.log(error);
        toast.error("Failed to update");
      }
    }
  };

  const handleOnChangeEvent = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const newFormData = [...formData];
    newFormData[index].discount = parseInt(event.target.value) || 0;
    setFormData(newFormData);
  };

  return (
    <main className="min-h-[calc(100svh-4rem)] bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Edit Promotion</h1>
          <button
            onClick={() => router.back()}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
            aria-label="Back"
          >
            ← Back
          </button>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          {/* Card header */}
          <div className="flex items-center justify-between rounded-t-3xl border-b border-gray-200 p-5">
            <div>
              <p className="text-lg font-semibold">Promotion Settings</p>
              <p className="text-sm text-gray-600">
                ตั้งค่าค่าส่วนลด (%) ของโปรโมชันแต่ละรายการ
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
              Admin Panel
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="p-5">
            <div className="space-y-4">
              {formData.map((item, index) => (
                <div
                  key={item.id}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-gray-200 bg-gray-50/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="w-full sm:w-auto">
                    <label className="block text-sm font-medium text-gray-800">
                      Promotion #{item.id}
                    </label>
                    <p className="text-xs text-gray-500">
                      ใส่ตัวเลขส่วนลดเป็นเปอร์เซ็นต์ (0–100)
                    </p>
                  </div>

                  <div className="flex w-full items-center gap-2 sm:w-64">
                    <div className="relative w-full">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 pr-10 text-right text-sm outline-none ring-gray-300 placeholder:text-gray-400 focus:border-gray-400 focus:ring-2"
                        value={item.discount}
                        onChange={(e) => handleOnChangeEvent(e, index)}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm text-gray-600">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => fetchData()}
                className="rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Reset
              </button>
              <input
                type="submit"
                value="Save changes"
                className="cursor-pointer rounded-full bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-800"
              />
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Promotion;
