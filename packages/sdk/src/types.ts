export interface Template {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export type TemplateListResponse = Template[];

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  /**
   * ISO 8601 timestamp string (e.g. `"2024-01-15T12:34:56.789Z"`).
   * This is the raw parsed JSON value returned by `CraftClient`, not a `Date`.
   */
  createdAt: string;
  updatedAt?: string;
  [key: string]: unknown;
}
