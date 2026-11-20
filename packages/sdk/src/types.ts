export interface Template {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export type TemplateListResponse = Template[];
