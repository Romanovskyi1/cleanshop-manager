// src/api/index.ts
// Типизированные обёртки над всеми эндпоинтами API

import { apiFetch, apiUpload } from './client';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface Company {
  id: number; name: string; vatNumber: string;
  countryCode: string; invoiceEmail: string | null;
  telegramGroupChatId: string | null; invoiceTerms: string;
  isActive: boolean; createdAt: string;
}

export interface User {
  id: number; telegramId: string; username: string;
  firstName: string; lastName: string; displayName: string;
  role: 'client' | 'manager' | 'admin';
  companyId: number | null; languageCode: string;
  isActive: boolean; createdAt: string;
}

export interface I18nString {
  ru?: string; en?: string; de?: string; pl?: string;
}

export interface Product {
  id: number; sku: string; name: Record<string,string>;
  category: string; priceEur: number; boxPriceEur: number;
  palletPriceEur: number; unitsPerBox: number; boxesPerPallet: number;
  stockPallets: number; stockStatus: 'ok'|'low'|'out';
  isEco: boolean; isHit: boolean; isNew: boolean; isActive: boolean;
  certifications: string[]; images: string[]; boxWeightKg?: number;
}

/** Сырые данные товара с I18n полями — возвращает GET /catalog/:id/raw */
export interface RawProduct {
  id: number; sku: string;
  name: I18nString; description: I18nString | null;
  category: string; priceEur: number;
  unitsPerBox: number; boxesPerPallet: number;
  boxWeightKg?: number; palletWeightKg?: number;
  stockPallets: number;
  isEco: boolean; isHit: boolean; isNew: boolean; isActive: boolean;
  certifications: string[]; images: string[];
}

export interface Order {
  id: number; companyId: number; status: string;
  proposedDate: string | null; confirmedDate: string | null;
  totalPallets: number; totalAmountEur: number;
  notes: string | null; createdAt: string; updatedAt: string;
}

export interface Invoice {
  id: number; invoiceNumber: string; orderId: number;
  companyId: number; issuedAt: string; dueDate: string;
  subtotalEur: number; vatRate: number; vatAmount: number;
  totalEur: number; status: 'pending'|'paid'|'overdue'|'cancelled';
  pdfUrl: string | null; paidAt: string | null; createdAt: string;
}

export interface InvoiceDelivery {
  id: number; invoiceId: number; channel: string;
  status: 'pending'|'sent'|'failed';
  externalId: string | null; errorMessage: string | null;
  attempts: number; sentAt: string | null;
}

export interface ChatMessage {
  id: string; companyId: number; senderId: number | null;
  senderType: 'client'|'manager'|'ai'; text: string;
  intent: string | null; cardPayload: unknown; isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalActiveOrders: number; totalPendingInvoices: number;
  totalAmountPendingEur: number; ordersNeedingAction: number;
  newClientsThisMonth: number; totalCompanies: number;
}

export interface Paginated<T> {
  items: T[]; total: number; page: number; limit: number; totalPages: number;
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────

export const ordersApi = {
  list: (params?: Record<string,string>) => {
    const q = params ? '?' + new URLSearchParams(params) : '';
    return apiFetch<Order[]>(`/api/v1/orders${q}`);
  },
  get: (id: number) => apiFetch<Order>(`/api/v1/orders/${id}`),
  confirmDate: (id: number, confirmedDate: string) =>
    apiFetch<Order>(`/api/v1/orders/${id}/confirm-date`, {
      method: 'POST',
      body: JSON.stringify({ confirmedDate }),
    }),
  proposeDate: (id: number, proposedDate: string) =>
    apiFetch<Order>(`/api/v1/orders/${id}/propose-date`, {
      method: 'POST',
      body: JSON.stringify({ proposedDate }),
    }),
};

// ─── CATALOG ─────────────────────────────────────────────────────────────────

export const catalogApi = {
  list: (params?: Record<string,string>) => {
    const q = params ? '?' + new URLSearchParams(params) : '';
    return apiFetch<Paginated<Product>>(`/api/v1/catalog${q}`);
  },
  get:    (id: number) => apiFetch<Product>(`/api/v1/catalog/${id}`),
  getRaw: (id: number) => apiFetch<RawProduct>(`/api/v1/catalog/${id}/raw`),
  create: (body: Partial<Product>) =>
    apiFetch<Product>('/api/v1/catalog', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Partial<Product>) =>
    apiFetch<Product>(`/api/v1/catalog/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  updateStock: (id: number, stockPallets: number) =>
    apiFetch(`/api/v1/catalog/${id}/stock`, {
      method: 'PATCH', body: JSON.stringify({ stockPallets }),
    }),
  remove: (id: number) =>
    apiFetch(`/api/v1/catalog/${id}`, { method: 'DELETE' }),
  uploadImages: (id: number, files: File[]) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    return apiUpload<Product>(`/api/v1/catalog/${id}/images`, form);
  },
};

// ─── INVOICES ────────────────────────────────────────────────────────────────

export const invoicesApi = {
  list: (params?: Record<string,string>) => {
    const q = params ? '?' + new URLSearchParams(params) : '';
    return apiFetch<Invoice[]>(`/api/v1/invoices${q}`);
  },
  get: (id: number) => apiFetch<Invoice>(`/api/v1/invoices/${id}`),
  upload: (formData: FormData) =>
    apiUpload<{ invoice: Invoice; distribution: unknown }>('/api/v1/invoices/upload', formData),
  updateStatus: (id: number, status: string) =>
    apiFetch<Invoice>(`/api/v1/invoices/${id}/status`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    }),
  resend: (id: number, channels?: string[]) =>
    apiFetch(`/api/v1/invoices/${id}/resend`, {
      method: 'POST', body: JSON.stringify({ channels }),
    }),
  deliveryStatus: (id: number) =>
    apiFetch<InvoiceDelivery[]>(`/api/v1/invoices/${id}/delivery-status`),
  downloadUrl: (id: number) =>
    apiFetch<{ url: string }>(`/api/v1/invoices/${id}/download-url`),
};

// ─── CHAT ─────────────────────────────────────────────────────────────────────

export const chatApi = {
  history: (companyId: number, limit = 50) =>
    apiFetch<ChatMessage[]>(`/api/v1/chat/messages?limit=${limit}&companyId=${companyId}`),
  reply: (companyId: number, text: string) =>
    apiFetch<ChatMessage>('/api/v1/chat/manager-reply', {
      method: 'POST', body: JSON.stringify({ companyId, text }),
    }),
  status: () => apiFetch<{ mode: 'ai'|'human'; agentName?: string }>('/api/v1/chat/status'),
};

// ─── CLIENTS (companies + users) ─────────────────────────────────────────────

export const clientsApi = {
  companies: () => apiFetch<Company[]>('/api/v1/companies'),
  company:   (id: number) => apiFetch<Company>(`/api/v1/companies/${id}`),
  users:     (companyId?: number) => {
    const q = companyId ? `?companyId=${companyId}` : '';
    return apiFetch<User[]>(`/api/v1/users${q}`);
  },
  updateUser: (id: number, body: Partial<User>) =>
    apiFetch<User>(`/api/v1/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};
