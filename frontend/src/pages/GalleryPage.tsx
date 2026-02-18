import { useQuery } from "@tanstack/react-query";
import { Heart, Search } from "lucide-react";
import { useState } from "react";
import {
  getGallery,
  getImageUrl,
  getThumbnailUrl,
  toggleFavorite,
} from "../api/client";
import type { GalleryImage } from "../api/client";

export function GalleryPage() {
  const [page, setPage] = useState(1);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["gallery", page, favoritesOnly],
    queryFn: () => getGallery(page, 50, favoritesOnly),
  });

  const handleToggleFavorite = async (imageId: string) => {
    await toggleFavorite(imageId);
    refetch();
  };

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
        <h1 className="text-lg font-semibold">Gallery</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              favoritesOnly
                ? "bg-forge-500/20 text-forge-400"
                : "bg-surface-3 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Heart className="h-4 w-4" />
            Favorites
          </button>
          <span className="text-sm text-neutral-500">
            {data?.total ?? 0} images
          </span>
        </div>
      </header>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && (
          <div className="flex h-64 items-center justify-center text-neutral-500">
            Loading...
          </div>
        )}

        {data && data.images.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center text-neutral-600">
            <Search className="mb-2 h-8 w-8" />
            <p>No images yet</p>
            <p className="text-sm">Generate some images to see them here</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {data?.images.map((img) => (
            <div
              key={img.id}
              className="group relative cursor-pointer overflow-hidden rounded-lg bg-surface-2"
              onClick={() => setSelectedImage(img)}
            >
              <img
                src={getThumbnailUrl(img.id)}
                alt={img.prompt}
                className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(img.id);
                }}
                className="absolute right-2 top-2 rounded-full bg-black/40 p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Heart
                  className={`h-4 w-4 ${img.is_favorite ? "fill-red-500 text-red-500" : "text-white"}`}
                />
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="truncate text-xs text-white">{img.prompt}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg bg-surface-3 px-3 py-1.5 text-sm text-neutral-400 hover:bg-surface-4 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-neutral-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg bg-surface-3 px-3 py-1.5 text-sm text-neutral-400 hover:bg-surface-4 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Image overlay */}
      {selectedImage && (
        <ImageOverlay
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onToggleFavorite={() => {
            handleToggleFavorite(selectedImage.id);
            setSelectedImage({
              ...selectedImage,
              is_favorite: !selectedImage.is_favorite,
            });
          }}
        />
      )}
    </div>
  );
}

function ImageOverlay({
  image,
  onClose,
  onToggleFavorite,
}: {
  image: GalleryImage;
  onClose: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8"
      onClick={onClose}
    >
      <div
        className="flex max-h-full max-w-5xl gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={getImageUrl(image.id)}
          alt={image.prompt}
          className="max-h-[80vh] rounded-lg object-contain"
        />
        <div className="w-72 space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-medium text-neutral-300">Details</h3>
            <button
              onClick={onToggleFavorite}
              className="rounded-full p-1.5 hover:bg-surface-3"
            >
              <Heart
                className={`h-5 w-5 ${image.is_favorite ? "fill-red-500 text-red-500" : "text-neutral-400"}`}
              />
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <span className="text-neutral-500">Prompt</span>
              <p className="mt-0.5 text-neutral-300">{image.prompt}</p>
            </div>
            {image.negative_prompt && (
              <div>
                <span className="text-neutral-500">Negative</span>
                <p className="mt-0.5 text-neutral-400">
                  {image.negative_prompt}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-neutral-500">Size</span>
                <p className="text-neutral-300">
                  {image.width}x{image.height}
                </p>
              </div>
              <div>
                <span className="text-neutral-500">Seed</span>
                <p className="text-neutral-300">{image.seed}</p>
              </div>
              <div>
                <span className="text-neutral-500">Model</span>
                <p className="text-neutral-300">{image.model_id || "Unknown"}</p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-lg bg-surface-3 px-4 py-2 text-sm text-neutral-400 hover:bg-surface-4"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
