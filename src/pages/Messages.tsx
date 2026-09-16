import { MessagesLayout } from "@/components/messaging";

/** Volunteer inbox — one conversation per accepted application. */
export default function Messages() {
  return <MessagesLayout basePath="/messages" isOrg={false} />;
}
