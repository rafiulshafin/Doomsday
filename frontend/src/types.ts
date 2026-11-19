export interface MoviePrerequisiteRelation {
  movieId: string;
  prerequisiteId: string;
  prerequisite?: {
    id: string;
    title: string;
    releaseYear: number;
    runtime: number;
    watched: boolean;
  };
}

export interface Movie {
  id: string;
  title: string;
  releaseYear: number;
  runtime: number;
  watched: boolean;
  prerequisites: MoviePrerequisiteRelation[];
  createdAt: string;
  updatedAt: string;
}

export interface MovieNode {
  id: string;
  title: string;
  releaseYear: number;
  runtime: number;
  watched: boolean;
  prerequisites: string[];
}

export interface RewatchOrderResponse {
  targetMovie: {
    id: string;
    title: string;
    releaseYear: number;
    runtime: number;
    watched: boolean;
  };
  movies: MovieNode[];
  watchedCount: number;
  unwatchedRuntime: number;
}

export interface Cinema {
  id: string;
  name: string;
  bundleSizes: number[];
  createdAt: string;
  updatedAt: string;
}

export interface BundleBreakdown {
  size: number;
  count: number;
}

export interface BookingQuoteResponse {
  cinemaId: string;
  cinemaName: string;
  possible: boolean;
  groupSize: number;
  totalBundles: number;
  bundles: BundleBreakdown[];
  formatted: string;
}
