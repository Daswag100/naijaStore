"use client";

import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  images?: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  showHelper?: boolean;
}

export default function ImageUpload({ 
  images = [], 
  onImagesChange, 
  maxImages = 5,
  showHelper = false 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const { toast } = useToast();

  // Convert file to base64 for storage
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const newImages = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: "Please upload only image files",
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Please upload images smaller than 5MB",
            variant: "destructive",
          });
          continue;
        }

        const base64 = await convertToBase64(file);
        newImages.push(base64);
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast({
          title: "Images uploaded",
          description: `${newImages.length} image(s) uploaded successfully`,
        });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }, [images, maxImages, onImagesChange, toast]);

  // Validate and add image by URL
  const addImageByUrl = async () => {
    if (!imageUrl.trim()) return;

    if (images.length >= maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive",
      });
      return;
    }

    let finalUrl = imageUrl.trim();

    // Check if URL starts with http/https
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      toast({
        title: "Invalid URL",
        description: "Please enter a complete URL starting with https://",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(finalUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive",
      });
      return;
    }

    if (images.includes(finalUrl)) {
      toast({
        title: "Duplicate image",
        description: "This image URL is already added",
        variant: "destructive",
      });
      return;
    }

    // Test if image loads
    const img = new Image();
    img.onload = () => {
      onImagesChange([...images, finalUrl]);
      setImageUrl("");
      
      toast({
        title: "Image added",
        description: "Image URL has been added successfully",
      });
    };
    
    img.onerror = () => {
      toast({
        title: "Image failed to load",
        description: "This image URL appears to be invalid or inaccessible",
        variant: "destructive",
      });
    };

    img.src = finalUrl;
  };

  // Remove image
  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    
    toast({
      title: "Image removed",
      description: "Image has been removed from the gallery",
    });
  };

  return (
    <div className="space-y-4">
      {/* File Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
        <input
          type="file"
          id="image-upload"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />
        <label
          htmlFor="image-upload"
          className={`cursor-pointer ${
            uploading || images.length >= maxImages ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            ) : (
              <Upload className="w-8 h-8 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {uploading ? 'Uploading...' : 'Click to upload images from your computer'}
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, JPEG up to 5MB each (Max {maxImages} images)
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* URL Input */}
      <div className="space-y-2">
        <div className="flex space-x-2">
          <div className="flex-1">
            <Input
              placeholder="Enter complete image URL (e.g., https://example.com/image.jpg)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={images.length >= maxImages}
            />
          </div>
          <Button 
            type="button" 
            onClick={addImageByUrl}
            variant="outline"
            disabled={!imageUrl.trim() || images.length >= maxImages}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Examples: https://example.com/image.jpg or https://images.unsplash.com/photo-123
        </p>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Product Images ({images.length}/{maxImages})
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 border">
                  <img
                    src={image}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex items-center justify-center h-full text-gray-400">
                            <div class="text-center">
                              <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              <p class="text-xs">Image failed to load</p>
                            </div>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
                  onClick={() => removeImage(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {index === 0 ? 'Main Image' : `Image ${index + 1}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Counter */}
      <div className="text-xs text-gray-500 text-center">
        {images.length === 0 
          ? 'No images added yet' 
          : `${images.length} of ${maxImages} images added`
        }
      </div>

      {/* Help text */}
      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
        <strong>Tips:</strong>
        <ul className="mt-1 space-y-1">
          <li>• Upload files from your computer for best results</li>
          <li>• For URLs, use complete links like: https://example.com/image.jpg</li>
          <li>• Try free image services like Unsplash, Pexels, or Imgur</li>
        </ul>
      </div>
    </div>
  );
}