"use client";

import React, { useState, useEffect } from "react";
import { myAppHook } from "@/context/AppProvider";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import axios from "axios";
import "./style.css";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

enum Category {
  Pencil = "Pencil",
  Eraser = "Eraser",
  Ruler = "Ruler",
  Pen = "Pen",
  Liquid = "Liquid",
  Paint = "Paint",
  All = "",
}

const Dashboard: React.FC = () => {
  const { isLoading, authToken, role } = myAppHook();
  const router = useRouter();
  const [baseOn, setBaseOn] = useState<string>("user"); // user or product or category
  const [categories, setCategories] = useState<Category>(Category.All);
  const [data, setData] = useState<any[]>([]);
  const [startMonth, setStartMonth] = useState<number>(1);
  const [endMonth, setEndMonth] = useState<number>(12);

  if (isLoading) {
    return <Loader />;
  }

  useEffect(() => {
    if (!authToken || role === "user") {
      router.back();
    }
    fetchData();
  }, [authToken, role, categories]);

  const handleStartMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStartMonth(parseInt(e.target.value));
  };

  const handleEndMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEndMonth(parseInt(e.target.value));
  };

  useEffect(() => {
    if (startMonth && endMonth) {
      fetchData();
    }
  }, [startMonth, endMonth]);

  interface ProductType {
    id?: number;
    title: string;
    category: Category;
    cost: number;
    stock: number;
    file?: string;
    banner_image?: File | null;
  }

  // List all products
  const fetchData = async () => {
    try {
      let type = "";
      if (baseOn === "user") {
        type = "getUserOrderSummary";
      } else if (baseOn === "product") {
        type = "getProductSummary";
      } else if (baseOn === "category") {
        type = "getCategorySummary";
      }

      const currentYear = new Date().getFullYear();

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/${type}`,
        {
          params: {
            category: categories,
            startMonth,
            endMonth,
            year: currentYear,
          },
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setData(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleOptionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCategories(event.target.value as Category);
  };

  const handleCategoryChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setBaseOn(event.target.value);
    try {
      let type = "";
      if (event.target.value === "user") {
        type = "getUserOrderSummary";
      } else if (event.target.value === "product") {
        type = "getProductSummary";
      } else if (event.target.value === "category") {
        type = "getCategorySummary";
      }

      const currentYear = new Date().getFullYear();

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/${type}`,
        {
          params: {
            category: categories,
            startMonth,
            endMonth,
            year: currentYear,
          },
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setData(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const generateMonths = () => {
    const months = [];
    for (let i = startMonth; i <= endMonth; i++) {
      months.push(`เดือน ${i}`);
    }
    return months;
  };

  const chartData = {
    labels: generateMonths(),
    datasets: data.map((item, index) => ({
      label:
        baseOn === "user"
          ? item.Username
          : baseOn === "product"
            ? item.Productname
            : item.Category,
      data: item.MonthlyPrices || [],
      borderColor: `hsl(${(index * 60) % 360}, 70%, 50%)`,
      backgroundColor: "transparent",
      tension: 0.3,
    })),
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
    },
  };

  const graph = document.getElementById("graph");
  if (graph) {
    graph.style.display = "flex";
    graph.style.alignItems = "center";
    graph.style.justifyContent = "center";
  }

  const categoryType = document.getElementById("categoryType");
  if (categoryType) {
    categoryType.style.marginBottom = "1rem";
    categoryType.style.padding = "0.75rem";
    categoryType.style.width = "100%";
    categoryType.style.border = "1px solid #D1D5DB";
    categoryType.style.borderRadius = "0.375rem";
  }

  return (
    <main>
      <section>
        <br />
        <select onChange={handleCategoryChange} value={baseOn}>
          <option value="user">User</option>
          <option value="product">Product</option>
          <option value="category">Product Category</option>
        </select>

        {baseOn === "category" && (
          <>
            <select
              id="categoryType"
              value={categories}
              onChange={handleOptionChange}
            >
              <option value={Category.All}>All Product</option>
              <option value={Category.Pencil}>Pencil</option>
              <option value={Category.Eraser}>Eraser</option>
              <option value={Category.Ruler}>Ruler</option>
              <option value={Category.Pen}>Pen</option>
              <option value={Category.Liquid}>Liquid</option>
              <option value={Category.Paint}>Paint</option>
            </select>
          </>
        )}
        <br />
        <br />

        <div className="flex items-center justify-center">
          {baseOn === "category" && (
            <table className="border border-black">
              <thead>
                <tr className="border border-black">
                  <th className="border border-black px-4 py-2">Category</th>
                  <th className="border border-black px-4 py-2">
                    Total Quantity
                  </th>
                  <th className="border border-black px-4 py-2">Total Price</th>
                  <th className="border border-black px-4 py-2">Total Order</th>
                </tr>
              </thead>
              <tbody>
                {data.map((dataa, index) => (
                  <tr key={index} className="border border-black">
                    <td className="border border-black px-4 py-2">
                      {dataa.Category}
                    </td>
                    <td className="border border-black px-4 py-2">
                      {dataa.TotalQuantity}
                    </td>
                    <td className="border border-black px-4 py-2">
                      {dataa.TotalPrice}
                    </td>
                    <td className="border border-black px-4 py-2">
                      {dataa.TotalOrder}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {baseOn === "user" && (
            <table className="border border-black">
              <thead>
                <tr className="border border-black">
                  <th className="border border-black px-4 py-2">Username</th>
                  <th className="border border-black px-4 py-2">
                    Total Quantity
                  </th>
                  <th className="border border-black px-4 py-2">Total Price</th>
                  <th className="border border-black px-4 py-2">Total Order</th>
                </tr>
              </thead>
              <tbody>
                {data.map((dataa, index) => (
                  <tr key={index} className="border border-black">
                    <td className="border border-black px-4 py-2">
                      {dataa.Username}
                    </td>
                    <td className="border border-black px-4 py-2">
                      {dataa.TotalQuantity}
                    </td>
                    <td className="border border-black px-4 py-2">
                      {dataa.TotalPrice}
                    </td>
                    <td className="border border-black px-4 py-2">
                      {dataa.TotalOrder}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {baseOn === "product" && (
            <table className="border border-black">
              <thead>
                <tr className="border border-black">
                  <th className="border border-black px-4 py-2">product</th>
                  <th className="border border-black px-4 py-2">
                    Total Quantity
                  </th>
                  <th className="border border-black px-4 py-2">Total Price</th>
                  <th className="border border-black px-4 py-2">Total Order</th>
                </tr>
              </thead>
              <tbody>
                {data.map((dataa, index) => (
                  <tr key={index} className="border border-black">
                    <td className="border border-black px-4 py-2">
                      {dataa.Productname}
                    </td>
                    <td className="border border-black px-4 py-2">
                      {dataa.TotalQuantity}
                    </td>
                    <td className="border border-black px-4 py-2">
                      {dataa.TotalPrice}
                    </td>
                    <td className="border border-black px-4 py-2">
                      {dataa.TotalOrder}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <br />

      <section>
        <div id="startEnd">
          <div className="month-start">
            <span className="mr-2">เดือนเริ่มต้น:</span>
            <input
              type="number"
              pattern="\d*"
              min={1}
              max={12}
              value={startMonth}
              onChange={handleStartMonthChange}
              className="border p-2 rounded-md"
            />
          </div>
          <div className="month-end">
            <span className="mr-2">เดือนสิ้นสุด:</span>
            <input
              type="number"
              pattern="\d*"
              min={1}
              max={12}
              value={endMonth}
              onChange={handleEndMonthChange}
              className="border p-2 rounded-md"
            />
          </div>
        </div>

        <br />
        <div id="graph">
          <div className="w-[50%] md:w-[50%]">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
        <br />
        <br />
      </section>
    </main>
  );
};

export default Dashboard;
