import { useState } from "react";
import type { JSX } from "react";

import { Heart, Search } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

import {
  getGallery,
  getImageUrl,
  getThumbnailUrl,
  toggleFavorite,
} from "../api/client";
import { isValueDefined } from "../utils/typeGuards";

import type { GalleryImage } from "../api/client";

const ImageOverlay = ({
  image,
  onClose,
  onToggleFavorite,
}: {
  image: GalleryImage;
  onClose: () => void;
  onToggleFavorite: () => void;
}): JSX.Element => {
  const handleBackdropKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Escape") onClose();
  };

  const handleContentKeyDown = (e: React.KeyboardEvent): void => {
    e.stopPropagation();
  };

  const handleContentClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8"
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={handleBackdropKeyDown}
    >
      <div
        className="flex max-h-full max-w-5xl gap-6"
        role="presentation"
        onClick={handleContentClick}
        onKeyDown={handleContentKeyDown}
      >
        <img
          alt={image.prompt}
          className="max-h-[80vh] rounded-lg object-contain"
          src={getImageUrl(image.id)}
        />
        <div className="w-72 space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-medium text-neutral-300">Details</h3>
            <button
              className="rounded-full p-1.5 hover:bg-surface-3"
              onClick={onToggleFavorite}
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
            {image.negative_prompt !== "" ? (
              <div>
                <span className="text-neutral-500">Negative</span>
                <p className="mt-0.5 text-neutral-400">
                  {image.negative_prompt}
                </p>
              </div>
            ) : null}
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
                <p className="text-neutral-300">
                  {image.model_id !== "" ? image.model_id : "Unknown"}
                </p>
              </div>
            </div>
          </div>

          <button
            className="w-full rounded-lg bg-surface-3 px-4 py-2 text-sm text-neutral-400 hover:bg-surface-4"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const GalleryPage = (): JSX.Element => {
  const [page, setPage] = useState(1);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["gallery", page, favoritesOnly],
    queryFn: async () => getGallery(page, undefined, favoritesOnly),
  });

  const handleToggleFavorite = async (imageId: string): Promise<void> => {
    await toggleFavorite(imageId);
    await refetch();
  };

  const totalPages = isValueDefined(data)
    ? Math.ceil(data.total / data.page_size)
    : 0;

  const handleImageKeyDown = (
    e: React.KeyboardEvent,
    img: GalleryImage,
  ): void => {
    if (e.key === "Enter" || e.key === " ") setSelectedImage(img);
  };

  const handleFavoriteClick = (
    e: React.MouseEvent,
    imageId: string,
  ): void => {
    e.stopPropagation();
    handleToggleFavorite(imageId).catch(() => {
      // Silently handle favorite toggle failures
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
        <h1 className="text-lg font-semibold">Gallery</h1>
        <div className="flex items-center gap-3">
          <button
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              favoritesOnly
                ? "bg-forge-500/20 text-forge-400"
                : "bg-surface-3 text-neutral-400 hover:text-neutral-200"
            }`}
            onClick={() => setFavoritesOnly(!favoritesOnly)}
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
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-neutral-500">
            Loading...
          </div>
        ) : null}

        {data?.images.length === 0 && (
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
              role="button"
              tabIndex={0}
              onClick={() => setSelectedImage(img)}
              onKeyDown={(e) => handleImageKeyDown(e, img)}
            >
              <img
                alt={img.prompt}
                className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
                src={getThumbnailUrl(img.id)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <button
                className="absolute right-2 top-2 rounded-full bg-black/40 p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => handleFavoriteClick(e, img.id)}
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
              className="rounded-lg bg-surface-3 px-3 py-1.5 text-sm text-neutral-400 hover:bg-surface-4 disabled:opacity-50"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="text-sm text-neutral-500">
              Page {page} of {totalPages}
            </span>
            <button
              className="rounded-lg bg-surface-3 px-3 py-1.5 text-sm text-neutral-400 hover:bg-surface-4 disabled:opacity-50"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Image overlay */}
      {isValueDefined(selectedImage) ? (
        <ImageOverlay
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onToggleFavorite={() => {
            handleToggleFavorite(selectedImage.id).catch(() => {
              // Silently handle favorite toggle failures
            });
            setSelectedImage({
              ...selectedImage,
              is_favorite: !selectedImage.is_favorite,
            });
          }}
        />
      ) : null}
    </div>
  );
};
