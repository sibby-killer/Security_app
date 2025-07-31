import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, Settings, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: number;
  is_read: boolean;
  created_at: string;
  incident_id?: string;
}

interface NotificationSettings {
  push: boolean;
  email: boolean;
  incident_alerts: boolean;
  status_updates: boolean;
  weekly_summary: boolean;
}

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    push: true,
    email: true,
    incident_alerts: true,
    status_updates: true,
    weekly_summary: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchSettings();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      if (data?.notification_preferences) {
        setSettings({
          ...settings,
          ...data.notification_preferences,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      );

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  const updateSettings = async (newSettings: NotificationSettings) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: newSettings })
        .eq('id', user?.id);

      if (error) throw error;

      setSettings(newSettings);
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'incident_alert':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'status_update':
        return <Info className="h-5 w-5 text-accent" />;
      case 'system':
        return <Settings className="h-5 w-5 text-muted-foreground" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-success" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 3) return 'bg-destructive text-destructive-foreground';
    if (priority >= 2) return 'bg-warning text-warning-foreground';
    return 'bg-muted text-muted-foreground';
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Stay updated with security alerts and system notifications
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-2" />
            Mark All Read ({unreadCount})
          </Button>
        )}
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">
            Notifications
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-destructive text-destructive-foreground">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Notifications List */}
        <TabsContent value="notifications" className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  You're all caught up! New notifications will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-accent/5 border-accent' : ''
                  }`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{notification.title}</h3>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority >= 3 ? 'High' : 
                             notification.priority >= 2 ? 'Medium' : 'Low'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                          
                          {notification.incident_id && (
                            <Button size="sm" variant="outline">
                              View Incident
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Customize when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Delivery Methods */}
              <div>
                <h4 className="font-semibold mb-4">Delivery Methods</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications" className="text-sm font-medium">
                        Push Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receive instant alerts in your browser
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={settings.push}
                      onCheckedChange={(checked) =>
                        updateSettings({ ...settings, push: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications" className="text-sm font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receive updates via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={settings.email}
                      onCheckedChange={(checked) =>
                        updateSettings({ ...settings, email: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Notification Types */}
              <div>
                <h4 className="font-semibold mb-4">Notification Types</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="incident-alerts" className="text-sm font-medium">
                        Incident Alerts
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        New security incidents in your area
                      </p>
                    </div>
                    <Switch
                      id="incident-alerts"
                      checked={settings.incident_alerts}
                      onCheckedChange={(checked) =>
                        updateSettings({ ...settings, incident_alerts: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="status-updates" className="text-sm font-medium">
                        Status Updates
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Updates on incidents you've reported or commented on
                      </p>
                    </div>
                    <Switch
                      id="status-updates"
                      checked={settings.status_updates}
                      onCheckedChange={(checked) =>
                        updateSettings({ ...settings, status_updates: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weekly-summary" className="text-sm font-medium">
                        Weekly Summary
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Weekly digest of neighborhood activity
                      </p>
                    </div>
                    <Switch
                      id="weekly-summary"
                      checked={settings.weekly_summary}
                      onCheckedChange={(checked) =>
                        updateSettings({ ...settings, weekly_summary: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Quiet Hours */}
              <div>
                <h4 className="font-semibold mb-4">Quiet Hours</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Set times when you don't want to receive non-urgent notifications
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quiet-start" className="text-sm">Start Time</Label>
                    <input
                      type="time"
                      id="quiet-start"
                      className="w-full p-2 border border-border rounded-md"
                      defaultValue="22:00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quiet-end" className="text-sm">End Time</Label>
                    <input
                      type="time"
                      id="quiet-end"
                      className="w-full p-2 border border-border rounded-md"
                      defaultValue="07:00"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Notifications;