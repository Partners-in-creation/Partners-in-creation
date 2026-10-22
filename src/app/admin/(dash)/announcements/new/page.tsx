import Link from "next/link";
import { AnnouncementForm } from "@/components/AnnouncementForm";

export default function NewAnnouncement() {
  return (
    <>
      <Link href="/admin/announcements" className="small">← Announcements</Link>
      <h1>Post an update</h1>
      <AnnouncementForm />
    </>
  );
}
