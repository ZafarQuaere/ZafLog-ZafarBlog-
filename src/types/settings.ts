export interface SiteAuthor {
  name: string;
  email: string;
  bio: string;
  profilePicture: string;
}

export interface SiteSettings {
  id: "site";
  title: string;
  description: string;
  logo: string;
  favicon: string;
  author: SiteAuthor;
  contactRecipientEmail: string;
}
