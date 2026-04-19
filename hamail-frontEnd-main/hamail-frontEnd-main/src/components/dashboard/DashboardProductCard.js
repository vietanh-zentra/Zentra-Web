"use client";
import Image from "next/image";
import Link from "next/link";
import { StarIcon } from "@heroicons/react/24/solid";

export default function DashboardProductCard({ product, onToggleFeatured }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative">
        <button
          className="absolute top-2 right-2 z-10"
          onClick={() => onToggleFeatured(product.id)}
          title={
            product.is_featured ? "Remove from featured" : "Add to featured"
          }
        >
          <StarIcon
            className={`w-6 h-6 ${
              product.is_featured ? "text-yellow-400" : "text-white"
            }`}
          />
        </button>
        <Link href={`/dashboard/product/${product.id}`}>
          <div className="relative h-48 w-full">
            <Image
              src={product.images?.[0] || "/placeholder-image.jpg"}
              alt={`${product.name} - ${product.materials} jewelry piece`}
              fill
              className="object-cover"
            />
          </div>
        </Link>
      </div>
      <div className="p-4">
        <Link href={`/dashboard/product/${product.id}`}>
          <h3 className="text-lg font-normal mb-2 hover:text-gray-700 text-black !text-black">
            {product.title}
          </h3>
        </Link>
        <p className="text-black !text-black mb-2 font-normal text-base">
          £{product.price}
        </p>
        <p className="text-sm font-normal text-black !text-black mb-2">
          {product.materials}
        </p>
        <p className="text-sm font-normal text-black !text-black">
          {product.healing_intention}
        </p>
        {product.is_sold_out && (
          <span className="inline-block bg-red-100 text-red-800 !text-red-800 text-xs font-normal px-2 py-1 rounded mt-2">
            Sold Out
          </span>
        )}
      </div>
    </div>
  );
}
