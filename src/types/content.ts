export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_active: boolean;
}

export interface OrgEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  type: string;
}