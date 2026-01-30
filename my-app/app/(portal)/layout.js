"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  GraduationCap,
  MessageCircle,
  FileText,
  FolderOpen,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/portal", label: "Home", icon: Shield, exact: true },
  { href: "/portal/training", label: "Training", icon: GraduationCap },
  { href: "/portal/chat", label: "Q&A", icon: MessageCircle },
  { href: "/portal/wvpp", label: "WVPP", icon: FileText },
  { href: "/portal/documents", label: "Documents", icon: FolderOpen },
];

export default function PortalLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function isActive(href) {
    if (href === "/portal") return pathname === "/portal";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4">
        <Shield className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">SafeWorkCA</span>
      </div>
      <Separator />

      {/* Portal label */}
      <div className="px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Employee Portal
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-1 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-4">
        <Separator className="mb-4" />
        <p className="text-xs text-muted-foreground">
          Questions? Use the Q&A chat or contact your manager.
        </p>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-col border-r bg-card md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r bg-card">
            <div className="flex items-center justify-end p-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close sidebar</span>
              </Button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>
          <div className="flex-1" />
          <UserButton />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
