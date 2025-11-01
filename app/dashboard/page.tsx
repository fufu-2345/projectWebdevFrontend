"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { myAppHook } from "@/context/AppProvider";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import axios from "axios";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

enum Category {
  Pencil = "Pencil",
  Eraser = "Eraser",
  Ruler = "Ruler",
  Pen = "Pen",
  Liquid = "Liquid",
  Paint = "Paint",
  All = "",
}

interface ProductType {
  id?: number;
  title: string;
  category: Category;
  cost: number;
  stock: number;
  file?: string;
  banner_image?: File | null;
}

const Dashboard: React.FC = () => {
  const { isLoading, authToken } = myAppHook();
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category>(Category.All);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [formData, setFormData] = useState<ProductType>({
    title: "",
    category: Category.Pencil,
    cost: 0.0,
    stock: 0,
    file: "",
    banner_image: null,
  });

  if (isLoading) {
    return <Loader />;
  }

  useEffect(() => {
    if (!authToken) {
      router.push("/auth");
      return;
    }
    fetchAllProducts();
  }, [authToken]);

  const handleOnChangeEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      // have file
      setFormData({
        ...formData,
        banner_image: event.target.files[0],
        file: URL.createObjectURL(event.target.files[0]),
      });
    } else {
      // no file
      setFormData({
        ...formData,
        [event.target.name]: event.target.value,
      });
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formData.cost < 0 || formData.stock < 0) {
      toast.error("Cost and Stock must be non-negative values.");
      return;
    }
    try {
      if (isEdit) {
        // edit product
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/products/${formData.id}`,
          {
            ...formData,
            _method: "PUT",
          },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        if (response.data.status) {
          fetchAllProducts();
          toast.success("Product Update successfully");
          setFormData({
            title: "",
            category: Category.Pencil,
            cost: 0.0,
            stock: 0,
            file: "",
            banner_image: null,
          });
          setIsEdit(false);
          if (fileRef.current) {
            fileRef.current.value = "";
          }
        }
      } else {
        // add product
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/products`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        if (response.data.status) {
          fetchAllProducts();
          toast.success("Product Created successfully");
          setFormData({
            title: "",
            category: Category.Pencil,
            cost: 0.0,
            stock: 0,
            file: "",
            banner_image: null,
          });
          if (fileRef.current) {
            fileRef.current.value = "";
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // List all products
  const fetchAllProducts = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/products`,
        {
          params: { category: categories },
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setProducts(response.data.products);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${process.env.NEXT_PUBLIC_API_URL}/products/${id}`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );
          if (response.data.status) {
            Swal.fire({
              title: "Deleted!",
              text: "Your file has been deleted.",
              icon: "success",
            });
            fetchAllProducts();
          }
        } catch (error) {
          console.log(error);
        }
      }
    });
  };

  const handleOptionChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setCategories(event.target.value as Category);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/products`,
        {
          params: { category: event.target.value },
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setProducts(response.data.products);
    } catch (error) {
      console.log(error);
    }
  };

  const adminTest = async () => {};

  return (
    <main>
      <div className="container mx-auto mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section>
            {/* Add Product Section */}
            <div className="card p-4 border border-gray-200 rounded-lg shadow-md">
              <h4 className="text-xl font-semibold mb-4">
                {isEdit ? "Edit" : "Add"} Product
              </h4>
              <form onSubmit={handleFormSubmit}>
                <input
                  className="form-input mb-4 p-3 w-full border border-gray-300 rounded-md"
                  name="title"
                  placeholder="Title"
                  pattern=".+"
                  value={formData.title}
                  onChange={handleOnChangeEvent}
                  required
                />
                <select
                  className="form-input mb-4 p-3 w-full border border-gray-300 rounded-md"
                  name="category"
                  value={formData.category}
                  onChange={handleOnChangeEvent}
                  required
                >
                  <option value={""}>All Product</option>
                  <option value={Category.Pencil}>Pencil</option>
                  <option value={Category.Eraser}>Eraser</option>
                  <option value={Category.Ruler}>Ruler</option>
                  <option value={Category.Pen}>Pen</option>
                  <option value={Category.Liquid}>Liquid</option>
                  <option value={Category.Paint}>Paint</option>
                </select>
                <input
                  className="form-input mb-4 p-3 w-full border border-gray-300 rounded-md"
                  name="cost"
                  placeholder="Cost"
                  type="number"
                  value={formData.cost}
                  pattern="^/d+(\.[0-9]{1,2})?$"
                  // min="0"
                  onChange={handleOnChangeEvent}
                  required
                />
                <input
                  className="form-input mb-4 p-3 w-full border border-gray-300 rounded-md"
                  name="stock"
                  placeholder="stock"
                  type="number"
                  value={formData.stock}
                  pattern="^/d+$"
                  // min="0"
                  onChange={handleOnChangeEvent}
                  required
                />
                <div className="mb-2">
                  {formData.file && (
                    <Image
                      src={formData.file}
                      alt="Preview"
                      id="bannerPreview"
                      width={100}
                      height={100}
                    />
                  )}
                </div>
                <input
                  className="form-input mb-4 p-3 w-full border border-gray-300 rounded-md"
                  type="file"
                  ref={fileRef}
                  onChange={handleOnChangeEvent}
                  id="bannerInput"
                />
                <button
                  className="w-full bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600"
                  type="submit"
                >
                  {isEdit ? "Update" : "Add"} Product
                </button>
              </form>
            </div>
          </section>

          <section>
            {/* Product List Section */}
            <div>
              <select
                className="form-input mb-4 p-3 w-full border border-gray-300 rounded-md"
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
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left border-b">ID</th>
                      <th className="px-4 py-2 text-left border-b">Title</th>
                      <th className="px-4 py-2 text-left border-b">Banner</th>
                      <th className="px-4 py-2 text-left border-b">Cost</th>
                      <th className="px-4 py-2 text-left border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((singleProduct, index) => (
                      <tr key={singleProduct.id}>
                        <td className="px-4 py-2 border-b">
                          {singleProduct.id}
                        </td>
                        <td className="px-4 py-2 border-b">
                          {singleProduct.title}
                        </td>
                        <td className="px-4 py-2 border-b">
                          {singleProduct.banner_image ? (
                            <Image
                              src={singleProduct.banner_image}
                              alt="Product"
                              width={50}
                              height={50}
                            />
                          ) : (
                            "No Image"
                          )}
                        </td>
                        <td className="px-4 py-2 border-b">
                          ${singleProduct.cost}
                        </td>
                        <td className="px-4 py-2 border-b">
                          <button
                            className="bg-yellow-400 text-white px-4 py-2 rounded-md hover:bg-yellow-500 mr-2"
                            onClick={() => {
                              setFormData({
                                id: singleProduct.id,
                                category: singleProduct.category,
                                cost: singleProduct.cost,
                                stock: singleProduct.stock,
                                title: singleProduct.title,
                                file: singleProduct.banner_image,
                              });
                              setIsEdit(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                            onClick={() =>
                              handleDeleteProduct(singleProduct.id)
                            }
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
