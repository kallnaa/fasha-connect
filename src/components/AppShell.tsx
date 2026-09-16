import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import logo from "@/assets/logo.svg";
import {
  BadgeCheck,
  Bell,
  BellOff,
  Briefcase,
  CalendarDays,
  ChartColumn,
  Compass,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  UserRoundCog,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink as RouterNavLink, useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";

const VOLUNTEER_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Compass },
  { to: "/opportunities", label: "Opportunities", icon: CalendarDays },
  { to: "/messages", label: "Messages", icon: MessagesSquare },
  { to: "/profile", label: "Profile", icon: UserRoundCog },
];

const ORG_NAV = [
  { to: "/org", label: "Dashboard", icon: LayoutDashboard },
  { to: "/org/opportunities", label: "Opportunities", icon: Briefcase },
  { to: "/org/messages", label: "Messages", icon: MessagesSquare },
  { to: "/org/post", label: "Post", icon: Compass },
  { to: "/org/analytics", label: "Analytics", icon: ChartColumn },
  { to: "/org/profile", label: "Profile", icon: UserRoundCog },
];

type NotificationRow = {
  _id: string; // eslint-disable-line @typescript-eslint/no-unused-vars
  title: string;
  body: string;
  kind: string;
  link?: string | null;
  read: boolean;
  createdAt: number;
};

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const isOrg = user?.accountType === "organization";
  const NAV = isOrg ? ORG_NAV : VOLUNTEER_NAV;

  const notifications =
    (useQuery(api.notifications.listMine) as NotificationRow[] | undefined) ?? [];
  const unread = notifications.filter((n) => !n.read).length;
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  // total unread chat messages for the messages badge
  const msgUnread = useQuery(api.messages.unreadCount, {}) ?? 0;

  const openNotification = (n: NotificationRow) => {
    if (!n.read) markRead({ id: n._id as never });
    setNotifOpen(false);
    if (n.link) navigate(n.link);
  };

  // one-time demo seed so new accounts land on a lively app
  const featured = useQuery(api.opportunities.listFeatured, { limit: 1 });
  const seed = useMutation(api.seed.seedDemoData);
  const seedAttempted = useRef(false);
  useEffect(() => {
    if (featured !== undefined && featured.length === 0 && !seedAttempted.current) {
      seedAttempted.current = true;
      seed({}).catch(() => {});
    }
  }, [featured, seed]);

  // close menus on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    if (notifOpen || accountOpen) {
      window.addEventListener("mousedown", onClick);
      return () => window.removeEventListener("mousedown", onClick);
    }
  }, [notifOpen, accountOpen]);

  return (
    <div className="min-h-screen">
      {/* pastel blobs backdrop */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="clay-blob absolute -top-24 -left-24 size-96 bg-peach/40" />
        <div className="clay-blob absolute top-1/3 -right-32 size-[28rem] bg-mint/35" />
        <div className="clay-blob absolute -bottom-32 left-1/4 size-80 bg-sky/30" />
      </div>

      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="clay-surface mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-[1.5rem] px-4 py-2.5 sm:px-6">
          <Link to={isOrg ? "/org" : "/dashboard"} className="flex items-center gap-2.5">
            <img src={logo} alt="Fasha" className="size-9 rounded-xl shadow-sm" />
            <span className="font-display text-xl font-extrabold tracking-tight">
              Fasha
            </span>
            {isOrg && (
              <span className="ml-1 hidden rounded-full bg-sky/60 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#1e3a52] sm:inline">
                Org
              </span>
            )}
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <ShellNavLink key={item.to} to={item.to} icon={item.icon} label={item.label} />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Messages */}
            <Link
              to={isOrg ? "/org/messages" : "/messages"}
              aria-label={`Messages${msgUnread ? ` (${msgUnread} unread)` : ""}`}
              className={cn(
                "relative flex size-9 items-center justify-center rounded-full bg-secondary/70 transition-colors hover:bg-secondary",
                msgUnread > 0 && "bg-mint/70",
              )}
            >
              <MessagesSquare className="size-4" />
              {msgUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                  {msgUnread > 9 ? "9+" : msgUnread}
                </span>
              )}
            </Link>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifications"
                className={cn(
                  "relative rounded-full bg-secondary/70 hover:bg-secondary",
                  unread > 0 && "bg-butter/70",
                )}
                onClick={() => setNotifOpen((v) => !v)}
              >
                <Bell className="size-4" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Button>
              {notifOpen && (
                <div className="clay-pop absolute right-0 mt-2 w-80 p-2 sm:w-96">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="font-display text-sm font-bold">Notifications</span>
                    {unread > 0 && (
                      <button
                        className="text-xs font-semibold text-primary hover:underline"
                        onClick={() => markAllRead({})}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
                        <BellOff className="size-6 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                          Nothing yet — updates land here.
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n._id}
                          onClick={() => openNotification(n)}
                          className={cn(
                            "w-full rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-secondary/60",
                            !n.read && "bg-butter/40",
                          )}
                        >
                          <p className="text-sm font-bold">{n.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            {n.body}
                          </p>
                          <p className="mt-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                            <span>{timeAgo(n.createdAt)}</span>
                            {n.link && <span className="font-bold text-primary normal-case">Open →</span>}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Account */}
            <div className="relative" ref={accountRef}>
              <Button
                variant="ghost"
                className="rounded-full bg-secondary/70 px-3 hover:bg-secondary"
                onClick={() => setAccountOpen((v) => !v)}
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/80 text-xs font-bold text-primary-foreground">
                  {initials(isOrg ? (user?.orgName ?? user?.name) : user?.name)}
                </span>
                <span className="hidden max-w-28 truncate text-sm font-bold sm:inline">
                  {(isOrg ? (user?.orgName ?? user?.name) : user?.name) ?? "Account"}
                </span>
              </Button>
              {accountOpen && (
                <div className="clay-pop absolute right-0 mt-2 w-60 p-2">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-bold">
                      {isOrg ? (user?.orgName ?? "Organization") : (user?.name ?? "Volunteer")}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user?.email ?? "Guest account"}
                    </p>
                    {isOrg && user?.verification === "verified" && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#22503a]">
                        <BadgeCheck className="size-3.5" /> Verified Organization
                      </p>
                    )}
                  </div>
                  <div className="my-1 h-px bg-border" />
                  {NAV.map((item) => (
                    <ShellNavLink key={item.to} to={item.to} icon={item.icon} label={item.label} stacked />
                  ))}
                  <div className="my-1 h-px bg-border" />
                  <button
                    className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
                    onClick={async () => {
                      setAccountOpen(false);
                      await signOut();
                      navigate("/");
                    }}
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="clay-surface mx-auto mt-2 flex max-w-6xl items-center justify-around gap-1 overflow-x-auto rounded-[1.25rem] px-2 py-2 lg:hidden">
          {NAV.map((item) => (
            <ShellNavLink key={item.to} to={item.to} icon={item.icon} label={item.label} />
          ))}
        </nav>
      </header>

      <main className={cn("relative z-10 mx-auto max-w-6xl px-3 pt-6 pb-16 sm:px-5", className)}>
        {children}
      </main>
    </div>
  );
}

function ShellNavLink({
  to,
  icon: Icon,
  label,
  stacked = false,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  stacked?: boolean;
}) {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition-colors",
          stacked && "w-full px-3 py-2",
          isActive
            ? "bg-primary text-primary-foreground clay-chip"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        )
      }
    >
      <Icon className="size-4" />
      {label}
    </RouterNavLink>
  );
}

export function initials(name?: string | null) {
  if (!name) return "F";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}
