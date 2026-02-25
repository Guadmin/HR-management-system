"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import {
  LayoutDashboard,
  Target,
  TrendingUp,
  MessageSquare,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  CalendarDays,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "ダッシュボード",
    icon: LayoutDashboard,
  },
  {
    href: "/goals",
    label: "目標設定",
    icon: Target,
  },
  {
    href: "/progress",
    label: "目標進捗",
    icon: TrendingUp,
  },
  {
    href: "/feedback",
    label: "中間フィードバック",
    icon: MessageSquare,
    roles: [UserRole.MANAGER, UserRole.DIRECTOR, UserRole.HR_ADMIN],
  },
  {
    href: "/evaluations",
    label: "期末評価",
    icon: ClipboardList,
  },
  {
    href: "/career",
    label: "キャリアデザイン",
    icon: Briefcase,
  },
  {
    href: "/calibration",
    label: "キャリブレーション",
    icon: BarChart3,
    roles: [UserRole.DIRECTOR, UserRole.HR_ADMIN],
  },
  {
    href: "/team",
    label: "チーム管理",
    icon: Users,
    roles: [UserRole.MANAGER, UserRole.DIRECTOR, UserRole.HR_ADMIN],
  },
];

const adminNavItems: NavItem[] = [
  {
    href: "/admin/periods",
    label: "評価期間管理",
    icon: CalendarDays,
    roles: [UserRole.HR_ADMIN],
  },
  {
    href: "/admin/organization",
    label: "組織マスタ",
    icon: FileSpreadsheet,
    roles: [UserRole.HR_ADMIN],
  },
  {
    href: "/admin/settings",
    label: "システム設定",
    icon: Settings,
    roles: [UserRole.HR_ADMIN],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole | undefined;

  const isVisible = (item: NavItem) => {
    if (!item.roles) return true;
    if (!userRole) return false;
    return item.roles.includes(userRole);
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              )}
            >
              <Icon className="w-5 h-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        )}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{item.label}</span>
        {isActive && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
        )}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-16 border-b border-gray-200 dark:border-gray-800", collapsed ? "px-3 justify-center" : "px-4")}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white text-base">TalentFlow</span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {!collapsed && (
          <p className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            メニュー
          </p>
        )}
        {navItems.filter(isVisible).map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {userRole === UserRole.HR_ADMIN && (
          <>
            {!collapsed && (
              <p className="px-2 mt-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                管理
              </p>
            )}
            {collapsed && <div className="my-2 border-t border-gray-200 dark:border-gray-800" />}
            {adminNavItems.filter(isVisible).map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* Collapse Button */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("w-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100", collapsed ? "justify-center px-0" : "justify-end")}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span className="text-xs">折りたたむ</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
