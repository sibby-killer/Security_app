import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Users, TrendingUp, MapPin, Clock, PlusCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DashboardStats {
  totalIncidents: number;
  activeIncidents: number;
  resolvedIncidents: number;
  recentIncidents: any[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalIncidents: 0,
    activeIncidents: 0,
    resolvedIncidents: 0,
    recentIncidents: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch incident statistics
      const { data: incidents, error: incidentsError } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (incidentsError) throw incidentsError;

      const totalIncidents = incidents?.length || 0;
      const activeIncidents = incidents?.filter(i => i.status !== 'resolved').length || 0;
      const resolvedIncidents = incidents?.filter(i => i.status === 'resolved').length || 0;

      setStats({
        totalIncidents,
        activeIncidents,
        resolvedIncidents,
        recentIncidents: incidents || [],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported':
        return 'bg-warning text-warning-foreground';
      case 'investigating':
        return 'bg-accent text-accent-foreground';
      case 'resolved':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive text-destructive-foreground';
      case 'medium':
        return 'bg-warning text-warning-foreground';
      case 'low':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

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
          <h1 className="text-3xl font-bold text-foreground">Community Dashboard</h1>
          <p className="text-muted-foreground">Monitor security incidents in your neighborhood</p>
        </div>
        <Link to="/report">
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Report Incident
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIncidents}</div>
            <p className="text-xs text-muted-foreground">All time reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Shield className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.activeIncidents}</div>
            <p className="text-xs text-muted-foreground">Under investigation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.resolvedIncidents}</div>
            <p className="text-xs text-muted-foreground">Successfully handled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {stats.totalIncidents > 0 ? Math.round((stats.resolvedIncidents / stats.totalIncidents) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Resolution success</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
          <CardDescription>Latest security reports in your area</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentIncidents.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No incidents reported yet</p>
              <Link to="/report">
                <Button variant="outline" className="mt-4">
                  Report First Incident
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentIncidents.map((incident) => (
                <div key={incident.id} className="flex items-start justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{incident.title}</h3>
                      <Badge className={getStatusColor(incident.status)}>
                        {incident.status}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(incident.priority)}>
                        {incident.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{incident.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {incident.address || 'Location not specified'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(incident.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Link to={`/incidents/${incident.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
              <div className="text-center pt-4">
                <Link to="/incidents">
                  <Button variant="outline">View All Incidents</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer">
          <Link to="/report">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <PlusCircle className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Report Incident</h3>
              <p className="text-sm text-muted-foreground text-center">
                Quickly report a security incident in your area
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer">
          <Link to="/map">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <MapPin className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-semibold mb-2">View Map</h3>
              <p className="text-sm text-muted-foreground text-center">
                See incidents plotted on an interactive map
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer">
          <Link to="/notifications">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Notifications</h3>
              <p className="text-sm text-muted-foreground text-center">
                Stay updated with security alerts
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;