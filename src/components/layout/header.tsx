"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationStore } from "@/store/notification.store";
import { ROLE_LABELS } from "@/lib/constants";
import { UserRole } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[];
}

export function Header({ breadcrumbs }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotificationStore();

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm text-gray-500">
        {breadcrumbs?.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            {index > 0 && <span>/</span>}
            {item.href ? (
              <button
                onClick={() => router.push(item.href!)}
                className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {item.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4 h-4 text-gray-500" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 w-4 h-4 p-0 flex items-center justify-center text-[10px] bg-indigo-600">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-sm">通知</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  すべて既読にする
                </button>
              )}
            </div>
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <Bell className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">通知はありません</p>
                </div>
              ) : (
                <div>
                  {notifications.slice(0, 20).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                        !notification.isRead
                          ? "bg-indigo-50/50 dark:bg-indigo-950/20"
                          : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-2">
                        {!notification.isRead && (
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                        )}
                        <div className={!notification.isRead ? "" : "ml-3.5"}>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </p>
                          {notification.body && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {notification.body}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              { addSuffix: true, locale: ja }
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2"
            >
              <Avatar className="w-7 h-7">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-none">
                  {user?.name}
                </span>
                <span className="text-xs text-gray-500 mt-0.5">
                  {user?.role
                    ? ROLE_LABELS[user.role as UserRole]
                    : ""}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-gray-400 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="w-4 h-4 mr-2" />
              プロフィール
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="w-4 h-4 mr-2" />
              設定
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
