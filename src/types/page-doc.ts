export type PageId = "about" | "contact";

export interface AboutPageDoc {
  id: "about";
  content: string;
  updatedAt: string | null;
}

export interface ContactPageDoc {
  id: "contact";
  content: string;
  formEnabled: boolean;
  recipientEmail: string;
  updatedAt: string | null;
}
