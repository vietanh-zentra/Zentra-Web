"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/config/supabase";

export const useClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("classes")
        .select(
          `
          *,
          class_images (
            id,
            image_url,
            sort_order
          )
        `
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Process the data to get the main image for each class
      const processedClasses = data.map((classItem) => ({
        ...classItem,
        image: classItem.class_images?.[0]?.image_url || "/placeholder.png",
      }));

      setClasses(processedClasses);
    } catch (err) {
      console.error("Error fetching classes:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addClass = async (classData) => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .insert([classData])
        .select()
        .single();

      if (error) throw error;

      await fetchClasses();
      return data;
    } catch (err) {
      console.error("Error adding class:", err);
      throw err;
    }
  };

  const updateClass = async (id, updates) => {
    try {
      console.log("Updating class with data:", updates);

      const { data, error } = await supabase
        .from("classes")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;

      await fetchClasses();
      return data;
    } catch (err) {
      console.error("Error updating class:", err);
      throw err;
    }
  };

  const deleteClass = async (id) => {
    try {
      const { error } = await supabase
        .from("classes")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      await fetchClasses();
    } catch (err) {
      console.error("Error deleting class:", err);
      throw err;
    }
  };

  const addClassImage = async (classId, imageUrl, sortOrder = 0) => {
    try {
      const { data, error } = await supabase
        .from("class_images")
        .insert([
          {
            class_id: classId,
            image_url: imageUrl,
            sort_order: sortOrder,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await fetchClasses();
      return data;
    } catch (err) {
      console.error("Error adding class image:", err);
      throw err;
    }
  };

  const deleteClassImage = async (imageId) => {
    try {
      const { error } = await supabase
        .from("class_images")
        .delete()
        .eq("id", imageId);

      if (error) throw error;

      await fetchClasses();
    } catch (err) {
      console.error("Error deleting class image:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  return {
    classes,
    loading,
    error,
    fetchClasses,
    addClass,
    updateClass,
    deleteClass,
    addClassImage,
    deleteClassImage,
  };
};
