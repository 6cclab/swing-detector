export type SwingUploadResponse = {
  swing_id: string;
  status: string;
};

export type SwingSummary = {
  id: string;
  created_at: string;
  status: string;
  overall_score: number | null;
  handedness: string;
  source_swing_id?: string;
  swing_index?: number;
};

export type SwingListResponse = {
  items: SwingSummary[];
  total: number;
  page: number;
  page_size: number;
};

export type ProgressPoint = {
  date: string;
  score: number;
};

export type AngleTrend = {
  angle_name: string;
  values: number[];
  dates: string[];
};

export type ProgressResponse = {
  scores: ProgressPoint[];
  angle_trends: AngleTrend[];
};
