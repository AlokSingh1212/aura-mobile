import { API_HOST } from "@/constants/api";

export type ProductReviewSummary = {
  averageRating: number;
  reviewCount: number;
  distribution: Record<number, number>;
  reviews: {
    id: string;
    rating: number;
    body: string;
    author: string;
    createdAt?: string;
    image?: string | null;
  }[];
};

const EMPTY: ProductReviewSummary = {
  averageRating: 0,
  reviewCount: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  reviews: [],
};

export async function fetchProductReviews(
  artifactId: string
): Promise<ProductReviewSummary> {
  try {
    const res = await fetch(
      `${API_HOST}/api/mobile/products/reviews?artifactId=${encodeURIComponent(artifactId)}`
    );
    const data = await res.json();
    if (data.success) {
      return {
        averageRating: data.averageRating ?? 0,
        reviewCount: data.reviewCount ?? 0,
        distribution: data.distribution ?? EMPTY.distribution,
        reviews: data.reviews ?? [],
      };
    }
  } catch {
    /* fallback below */
  }
  return EMPTY;
}

export async function submitProductReview(payload: {
  userId: string;
  artifactId: string;
  rating: number;
  content: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_HOST}/api/mobile/products/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data;
  } catch {
    return { success: false, error: "Could not submit review." };
  }
}

export function formatReviewDate(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  } catch {
    return "";
  }
}
