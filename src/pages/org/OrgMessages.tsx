import { MessagesLayout } from "@/components/messaging";

/** Org inbox — message accepted volunteers individually or announce to all. */
export default function OrgMessages() {
  return <MessagesLayout basePath="/org/messages" isOrg />;
}
