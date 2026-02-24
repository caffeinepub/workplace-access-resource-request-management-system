import { useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetNotifications, useGetUnreadNotificationCount, useMarkNotificationAsRead } from '../hooks/useQueries';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useGetNotifications();
  const { data: unreadCount = BigInt(0) } = useGetUnreadNotificationCount();
  const { mutate: markRead } = useMarkNotificationAsRead();

  const unread = Number(unreadCount);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unread > 0 && (
            <span className="text-xs text-muted-foreground">{unread} unread</span>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <Bell size={24} className="mx-auto mb-2 opacity-30" />
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {[...notifications].reverse().map((notif) => (
                <div
                  key={notif.id.toString()}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors",
                    !notif.read && "bg-teal-50 dark:bg-teal-950/20"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                    notif.read ? "bg-muted-foreground/30" : "bg-teal-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(Number(notif.createdAt) / 1_000_000), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.read && (
                    <button
                      onClick={() => markRead(notif.id)}
                      className="flex-shrink-0 text-teal-500 hover:text-teal-600 transition-colors"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
