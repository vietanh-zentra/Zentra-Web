"use client";

import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/config/supabase";
import AdminImages from "./AdminImages";

const ClassFormInputs = ({ classData, onChange, onSubmit, isSubmitting }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(classData?.image || null);
  const [uploading, setUploading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageSelect = (imageUrl) => {
    setImagePreview(imageUrl);
    setImageFile(null); // Clear file input since we're using existing image
  };

  const uploadImage = async () => {
    if (!imageFile) return imagePreview || classData?.image || null;

    try {
      setUploading(true);

      // Generate unique filename
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `classes/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const imageUrl = await uploadImage();

      // Remove the image field from classData since it's not a column in the classes table
      const { image, ...classDataWithoutImage } = classData;

      // Submit class data without image
      await onSubmit(classDataWithoutImage, imageUrl);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Class Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-white mb-2"
        >
          Class Title *
        </label>
        <input
          type="text"
          id="title"
          value={classData.title || ""}
          onChange={(e) => onChange({ ...classData, title: e.target.value })}
          required
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-secondary"
          placeholder="e.g., Pilates, MS Move Well: Standing"
        />
      </div>

      {/* Class Type */}
      <div>
        <label
          htmlFor="class_type"
          className="block text-sm font-medium text-white mb-2"
        >
          Class Type *
        </label>
        <select
          id="class_type"
          value={classData.class_type || ""}
          onChange={(e) =>
            onChange({ ...classData, class_type: e.target.value })
          }
          required
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-secondary"
        >
          <option value="">Select class type</option>
          <option value="in-person">In-Person</option>
          <option value="online">Online</option>
        </select>
      </div>

      {/* Day */}
      <div>
        <label
          htmlFor="day"
          className="block text-sm font-medium text-white mb-2"
        >
          Day *
        </label>
        <select
          id="day"
          value={classData.day || ""}
          onChange={(e) => onChange({ ...classData, day: e.target.value })}
          required
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-secondary"
        >
          <option value="">Select day</option>
          <option value="Monday">Monday</option>
          <option value="Tuesday">Tuesday</option>
          <option value="Wednesday">Wednesday</option>
          <option value="Thursday">Thursday</option>
          <option value="Friday">Friday</option>
          <option value="Saturday">Saturday</option>
          <option value="Sunday">Sunday</option>
        </select>
      </div>

      {/* Time */}
      <div>
        <label
          htmlFor="time"
          className="block text-sm font-medium text-white mb-2"
        >
          Time *
        </label>
        <input
          type="text"
          id="time"
          value={classData.time || ""}
          onChange={(e) => onChange({ ...classData, time: e.target.value })}
          required
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-secondary"
          placeholder="e.g., 18:00 - 19:00"
        />
      </div>

      {/* Location */}
      <div>
        <label
          htmlFor="location"
          className="block text-sm font-medium text-white mb-2"
        >
          Location *
        </label>
        <input
          type="text"
          id="location"
          value={classData.location || ""}
          onChange={(e) => onChange({ ...classData, location: e.target.value })}
          required
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-secondary"
          placeholder="e.g., Pitlochry Town Hall, Online"
        />
      </div>

      {/* Booking URL */}
      <div>
        <label
          htmlFor="booking_url"
          className="block text-sm font-medium text-white mb-2"
        >
          Booking URL
        </label>
        <input
          type="text"
          id="booking_url"
          value={classData.booking_url || ""}
          onChange={(e) =>
            onChange({ ...classData, booking_url: e.target.value })
          }
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-secondary"
          placeholder="e.g., /contact, https://booking.com"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-white mb-2"
        >
          Description *
        </label>
        <textarea
          id="description"
          value={classData.description || ""}
          onChange={(e) =>
            onChange({ ...classData, description: e.target.value })
          }
          required
          rows={4}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:border-secondary"
          placeholder="Describe the class, what participants can expect, and who it's suitable for..."
        />
      </div>

      {/* Image Upload */}
      <div>
        <label
          htmlFor="image"
          className="block text-sm font-medium text-white mb-2"
        >
          Class Image
        </label>
        <div className="space-y-4">
          {imagePreview && (
            <div className="relative w-32 h-32">
              <Image
                src={imagePreview}
                alt="Class preview"
                fill
                className="object-cover rounded-md"
              />
            </div>
          )}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/80 transition-colors"
            >
              Choose File
            </button>

          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting || uploading}
          className="w-full px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting || uploading ? "Saving..." : "Save Class"}
        </button>
      </div>

      {/* Admin Images Modal */}
      <AdminImages
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onImageSelect={handleImageSelect}
        selectedImageUrl={imagePreview}
      />
    </form>
  );
};

export default ClassFormInputs;
