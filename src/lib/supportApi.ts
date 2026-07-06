import { apiFetch } from "@/lib/apiClient";

export type SupportMessage = {
  id: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
};

export async function fetchSupportTickets(): Promise<SupportTicket[]> {
  const res = await apiFetch("/support");
  const data = await res.json();
  if (!data.success) return [];
  return data.tickets || [];
}

export async function createSupportTicket(subject: string, content: string) {
  const res = await apiFetch("/support", {
    method: "POST",
    body: JSON.stringify({ subject, content }),
  });
  return res.json();
}

export async function sendSupportMessage(ticketId: string, content: string) {
  const res = await apiFetch("/support", {
    method: "POST",
    body: JSON.stringify({ action: "message", ticketId, content }),
  });
  return res.json();
}
