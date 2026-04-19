"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../config/supabase";

export function useProducts(limit) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        let query = supabase
          .from("jewellery")
          .select(
            `
            *,
            jewellery_images (
              image_url,
              sort_order
            )
          `
          )
          .order("created_at", { ascending: false });

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Transform the data to match our component's needs
        const transformedProducts = data.map((item) => ({
          id: item.id,
          name: item.title,
          description: item.description,
          price: item.price,
          sold_out: item.is_sold_out,
          images: item.jewellery_images?.length
            ? item.jewellery_images
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((img) => img.image_url)
            : ["/placeholder.png"],
          materials: item.materials,
          healing_intention: item.healing_intention,
        }));

        setProducts(transformedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [limit]);

  return { products, loading, error };
}
