/**
 * Request body size validation utilities.
 * Prevents resource exhaustion by rejecting oversized payloads early.
 */

export const DEFAULT_MAX_REQUEST_SIZE = 50 * 1024 * 1024; // 50MB
export const DEFAULT_MAX_FORM_DATA_SIZE = 100 * 1024 * 1024; // 100MB
export const DEFAULT_MAX_JSON_SIZE = 10 * 1024 * 1024; // 10MB
export const DEFAULT_MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
/**
 * Single source of truth for the branding file size limit.
 * The stricter limit (2MB) wins so the validator and request-size
 * checks agree on the same ceiling.
 */
export const MAX_BRANDING_FILE_BYTES = 2 * 1024 * 1024; // 2MB
export const DEFAULT_MAX_BRANDING_FILE_SIZE = MAX_BRANDING_FILE_BYTES;

export interface SizeLimit {
    bytes: number;
    label: string;
}

/**
 * Check if a request body size exceeds the limit
 * Returns the response size in bytes, or null if limit exceeded
 */
export function checkRequestSize(
    contentLength: string | null,
    maxBytes: number,
): number | null {
    if (!contentLength) return null;

    const size = parseInt(contentLength, 10);
    if (isNaN(size) || size > maxBytes) {
        return null;
    }

    return size;
}

/**
 * Format bytes as human-readable size (e.g., "5 MB", "100 KB").
 *
 * Supported range: finite, non-negative numbers from 0 up to the largest
 * unit in the `sizes` array (TB). Values below 1 byte are reported in
 * `bytes`, and values of 1 TB or more are reported in `TB`.
 * Non-finite (e.g. `NaN`, `Infinity`) or negative input returns `'0 bytes'`.
 */
export function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '0 bytes';
    if (bytes === 0) return '0 bytes';

    const k = 1024;
    const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB'];
    const rawIndex = Math.floor(Math.log(bytes) / Math.log(k));
    const i = Math.min(Math.max(rawIndex, 0), sizes.length - 1);

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate content-length header and return error response if limit exceeded
 */
export function validateContentLength(
    contentLength: string | null,
    maxBytes: number,
): { valid: true; size: number } | { valid: false; message: string } {
    if (!contentLength) {
        return { valid: false, message: 'Missing Content-Length header' };
    }

    const size = parseInt(contentLength, 10);
    if (isNaN(size)) {
        return { valid: false, message: 'Invalid Content-Length header' };
    }

    if (size > maxBytes) {
        return {
            valid: false,
            message: `Request body exceeds maximum size of ${formatBytes(maxBytes)}. Received: ${formatBytes(size)}.`,
        };
    }

    return { valid: true, size };
}
