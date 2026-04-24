"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/config/supabase";
// Using built-in icons instead of Heroicons
import LoadingSpinner from "@/components/LoadingSpinner";

const AdminImages = ({ isOpen, onClose, onImageSelect, selectedImageUrl }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch images from Supabase storage
  const fetchImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage.from("images").list("", {
        limit: 100,
        offset: 0,
      });

      if (error) throw error;

      // Get public URLs for all images
      const imageUrls = data
        .filter((file) => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
        .map((file) => {
          const {
            data: { publicUrl },
          } = supabase.storage.from("images").getPublicUrl(file.name);
          return {
            name: file.name,
            url: publicUrl,
            path: file.name,
          };
        });

      setImages(imageUrls);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  // Upload new image
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `classes/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath);

      // Add to images list
      const newImage = {
        name: fileName,
        url: publicUrl,
        path: filePath,
      };
      setImages((prev) => [newImage, ...prev]);
      setUploadProgress(100);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete image
  const handleDeleteImage = async (imagePath) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const { error } = await supabase.storage
        .from("images")
        .remove([imagePath]);

      if (error) throw error;

      // Remove from images list
      setImages((prev) => prev.filter((img) => img.path !== imagePath));
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Error deleting image. Please try again.");
    }
  };

  // Select image
  const handleSelectImage = (imageUrl) => {
    onImageSelect(imageUrl);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Manage Images</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Upload Section */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <label className="flex items-center px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/80 cursor-pointer transition-colors">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Upload New Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {uploading && (
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <LoadingSpinner size="sm" />
                <span>Uploading... {uploadProgress}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Images Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No images found. Upload some images to get started.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.path}
                  className={`relative group border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    selectedImageUrl === image.url
                      ? "border-secondary"
                      : "border-gray-600 hover:border-gray-500"
                  }`}
                  onClick={() => handleSelectImage(image.url)}
                >
                  <div className="aspect-square relative">
                    <Image
                      src={image.url}
                      alt={image.name}
                      fill
                      className="object-cover"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectImage(image.url);
                          }}
                          className="px-3 py-1 bg-secondary text-white text-sm rounded hover:bg-secondary/80"
                        >
                          Select
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(image.path);
                          }}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {/* Selected indicator */}
                    {selectedImageUrl === image.url && (
                      <div className="absolute top-2 right-2 bg-secondary text-white rounded-full p-1">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-gray-800">
                    <p className="text-xs text-gray-300 truncate">
                      {image.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminImages;
