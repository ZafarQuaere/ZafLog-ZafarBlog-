import type { Metadata } from "next";
import { PostContent } from "@/components/blog/PostContent";
import { ContactForm } from "@/components/forms/ContactForm";
import { getPageDocServer } from "@/lib/posts-server";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Contact",
};

export default async function ContactPage() {
  const data = await getPageDocServer("contact");
  const content = String(data?.content ?? "_Reach out using the form below._");
  const formEnabled = data?.formEnabled !== false;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">Contact</h1>
      <PostContent content={content} />
      {formEnabled ? (
        <div className="mt-10 max-w-xl">
          <ContactForm />
        </div>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">The contact form is currently disabled.</p>
      )}
    </div>
  );
}
