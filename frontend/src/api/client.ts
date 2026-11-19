import {
  Movie,
  RewatchOrderResponse,
  Cinema,
  BookingQuoteResponse,
} from "../types";

const BASE_URL = "/api";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.message || "An unexpected error occurred");
    (error as any).status = res.status;
    (error as any).code = data?.error;
    throw error;
  }

  return data as T;
}

export const api = {
  // Movies
  getMovies: () => request<Movie[]>("/movies"),

  createMovie: (payload: {
    title: string;
    releaseYear: number;
    runtime: number;
    watched?: boolean;
    prerequisites?: string[];
  }) =>
    request<Movie>("/movies", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateMovie: (
    id: string,
    payload: {
      title?: string;
      releaseYear?: number;
      runtime?: number;
      watched?: boolean;
      prerequisites?: string[];
    }
  ) =>
    request<Movie>(`/movies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  getRewatchOrder: (id: string) =>
    request<RewatchOrderResponse>(`/movies/${id}/rewatch-order`),

  // Cinemas & Booking
  getCinemas: () => request<Cinema[]>("/cinemas"),

  createCinema: (payload: { name: string; bundleSizes: number[] }) =>
    request<Cinema>("/cinemas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getBookingQuote: (cinemaId: string, groupSize: number) =>
    request<BookingQuoteResponse>(`/cinemas/${cinemaId}/booking?groupSize=${groupSize}`),
};
