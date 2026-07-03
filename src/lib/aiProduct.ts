import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export type AiProductDraft = {
  title: string;
  description: string;
  price: number;
  vibe: string;
  imageUrl: string;
};

export async function synthesizeProductFromPrompt(
  prompt: string
): Promise<AiProductDraft> {
  const res = await fetch(`${API_HOST}/api/mobile/products/ai-synthesize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json();
  if (!data.success || !data.product) {
    throw new Error(data.error || "AI synthesis failed.");
  }

  const p = data.product;
  return {
    title: String(p.title),
    description: String(p.description),
    price: Number(p.price) || 125000,
    vibe: String(p.vibe || "Quiet Luxury"),
    imageUrl: String(p.imageUrl),
  };
}
