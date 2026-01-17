"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileSidebar } from "./MobileSidebar";
import type { Role } from "@prisma/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    nome: string;
    email: string;
    role: Role;
    avatar?: string | null;
  };
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleMobileMenuClick = useCallback(() => {
    setMobileSidebarOpen(true);
  }, []);

  const handleMobileSidebarClose = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          role={user.role}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        role={user.role}
        open={mobileSidebarOpen}
        onClose={handleMobileSidebarClose}
      />

      {/* Main Content */}
      <div
        className={cn(
          "flex flex-col transition-all duration-300",
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        <Header
          user={user}
          onMenuClick={handleMobileMenuClick}
          showMenuButton
        />

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
