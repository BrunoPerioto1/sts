import { api } from "../apiClient";
import { unwrap } from "../request";
import type { TemplateField, TipTemplate } from "@/lib/tip-template";

/** Fonte de tips como o admin vê (/admin/sources). */
export interface TipSource {
  id: number;
  name: string;
  template: TipTemplate;
  sampleText: string | null;
  isActive: boolean;
  updatedAt: string;
  /** Tips que o modelo leu nos últimos 7 dias. */
  recentTips: number;
  lastTipAt: string | null;
  /** Usuários que desligaram a fonte no perfil. */
  mutedBy: number;
}

export interface TipSourceParams {
  name: string;
  template: TipTemplate;
  sampleText: string | null;
  isActive: boolean;
}

export interface FieldReading {
  field: TemplateField;
  raw: string | null;
  /** [início, fim) do trecho na mensagem; null pra valor fixo ou não achado. */
  span: [number, number] | null;
  value: string | number | null;
  error: string | null;
}

export interface TipSourcePreview {
  markerFound: boolean;
  fields: FieldReading[];
  /** Card que o usuário recebe; null enquanto o modelo não lê a mensagem inteira. */
  card: string | null;
  /** Tips recentes de outros formatos que o modelo também leria. */
  conflicts: number;
  checked: number;
}

export interface TipSourcePreviewParams {
  text: string;
  template: TipTemplate;
  name?: string;
  id?: number;
}

export async function getTipSources(): Promise<TipSource[]> {
  return (await api.admin.get<TipSource[]>("sources")).data;
}

export function postTipSource(data: TipSourceParams) {
  return unwrap(api.admin.post<TipSource>("sources", data));
}

export function patchTipSource(id: number, data: Partial<TipSourceParams>) {
  return unwrap(api.admin.patch<TipSource>(`sources/${id}`, data));
}

export function deleteTipSource(id: number) {
  return unwrap(api.admin.delete<void>(`sources/${id}`));
}

export function previewTipSource(data: TipSourcePreviewParams) {
  return unwrap(api.admin.post<TipSourcePreview>("sources/preview", data));
}

/** Fonte ativa como o usuário vê no perfil. */
export interface MyTipSource {
  id: number;
  name: string;
  enabled: boolean;
}

export async function getMyTipSources(): Promise<MyTipSource[]> {
  return (await api.tips.get<MyTipSource[]>("sources")).data;
}

export function putMyTipSource(id: number, enabled: boolean) {
  return unwrap(api.tips.put<{ id: number; enabled: boolean }>(`sources/${id}`, { enabled }));
}
