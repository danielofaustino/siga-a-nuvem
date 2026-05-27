export type Church = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  color: string | null;
  instagram: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type EventRow = {
  id: string;
  google_event_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  church_id: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  image_url: string | null;
  capacity: number | null;
  is_published: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type EventWithChurch = EventRow & {
  church: Pick<
    Church,
    "id" | "name" | "slug" | "color" | "address" | "instagram" | "latitude" | "longitude"
  > | null;
  attendance_count?: number;
};

export type Attendance = {
  id: string;
  event_id: string;
  name: string;
  whatsapp: string | null;
  instagram: string | null;
  church_id: string | null;
  created_at: string;
};
