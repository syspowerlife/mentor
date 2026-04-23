import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as dateFnsFormat } from "date-fns"
import { ptBR } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely converts a Firestore Timestamp, Date, string, or number to a Date object.
 * Returns a fallback Date (current or custom) or null if invalid, depending on needs.
 */
export function parseSafeDate(dateValue: any, fallbackToNow = false): Date | null {
  if (!dateValue) return fallbackToNow ? new Date() : null;

  let date: Date;

  if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue.toDate === 'function') {
    date = dateValue.toDate(); // Firestore Timestamp
  } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    date = new Date(dateValue);
  } else if (dateValue.seconds) { // Raw object from server
    date = new Date(dateValue.seconds * 1000);
  } else {
    return fallbackToNow ? new Date() : null;
  }

  // Verify if it's a valid date
  if (isNaN(date.getTime())) {
    return fallbackToNow ? new Date() : null;
  }

  return date;
}

/**
 * Safely formats a date object or Timestamp into a localized string.
 */
export function formatDateOrTimestamp(dateValue: any, options: Intl.DateTimeFormatOptions = {}, locale = 'pt-BR'): string {
  const date = parseSafeDate(dateValue);
  if (!date) return '';

  return date.toLocaleDateString(locale, options);
}

/**
 * Convenience method for formatting with date-fns safely.
 */
export function safeFormat(dateValue: any, formatStr: string, fallback = ''): string {
  const date = parseSafeDate(dateValue);
  if (!date) return fallback;
  try {
    return dateFnsFormat(date, formatStr, { locale: ptBR });
  } catch (e) {
    return fallback;
  }
}

/**
 * Formats a given date value into the 'YYYY-MM-DDThh:mm' format required by <input type="datetime-local" />
 */
export function formatForDateTimeLocal(dateValue: any): string {
  if (!dateValue) return '';
  const date = parseSafeDate(dateValue);
  if (!date) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/**
 * Safely parses API responses, verifying JSON schema integrity and fallback HTTP errors.
 */
export async function handleApiResponse(response: Response, defaultErrorMsg = 'Erro na comunicação com a API'): Promise<any> {
  const contentType = response.headers.get('content-type');
  
  if (response.ok) {
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  // Error block handling
  if (contentType && contentType.includes('application/json')) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || defaultErrorMsg);
    } catch (e: any) {
      if (e.message && !e.message.includes('Unexpected token')) {
        throw e;
      }
      // If parsing fails for whatever reason, fallthrough to generic response
    }
  }

  const errorPrefix = response.status === 404 ? 'Link/Recurso não encontrado' : 
                      response.status >= 500 ? 'Erro interno do servidor' : 'Requisição rejeitada';
                      
  throw new Error(`${defaultErrorMsg}: ${errorPrefix} (${response.status})`);
}

/**
 * Formats bytes into a human-readable string (KB, MB, GB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formats a date into a human readable date and time string.
 */
export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return '---';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
