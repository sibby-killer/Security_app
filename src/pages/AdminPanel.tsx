import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  UserPlus, 
  MessageSquare,
  Eye,
  Check,
  X,
  Send,
  Search,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Activity,
  TrendingUp,
  BarChart3,
  Calendar,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  phone?: string;
  address?: string;
  last_seen?: string;
}

interface Incident {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  is_verified: boolean;
  reporter_id: string;
  assigned_to: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  description?: string;
  address?: string;
  location_lat?: number;
  location_lng?: number;
}

interface IncidentFeedback {
  id: string;
  incident_id: string;
  security_id: string;
  feedback_text: string;
  status: string;
  submitted_at: string;
  approved_by_reporter: boolean;
  reporter_approved_at: string | null;
  admin_approved_at: string | null;
  admin_approved_by: string | null;
  incidents?: {
    title: string;
    status: string;
    priority: string;
  };
  profiles?: {
    full_name: string;
    role: string;
  } | null; // Allow null for when profiles data is not accessible
}

interface AdminStats {
  totalIncidents: number;
  unassignedIncidents: number;
  activeSecurity: number;
  pendingFeedback: number;
  totalUsers: number;
  resolvedIncidents: number;
  highPriorityIncidents: number;
  recentActivity: number;
}

const AdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [feedback, setFeedback] = useState<IncidentFeedback[]>([]);
  const [securityPersonnel, setSecurityPersonnel] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [selectedSecurity, setSelectedSecurity] = useState<string | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  
  // Enhanced state for better functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalIncidents: 0,
    unassignedIncidents: 0,
    activeSecurity: 0,
    pendingFeedback: 0,
    totalUsers: 0,
    resolvedIncidents: 0,
    highPriorityIncidents: 0,
    recentActivity: 0,
  });

  useEffect(() => {
    if (user) {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch security personnel
      const securityUsers = usersData?.filter(u => u.role === 'security') || [];
      setSecurityPersonnel(securityUsers);

      // Fetch incidents
      const { data: incidentsData, error: incidentsError } = await supabase
        .from('incidents')
        .select(`
          *,
          profiles!reporter_id (
            full_name,
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (incidentsError) throw incidentsError;
      setIncidents(incidentsData || []);

      // Fetch feedback - simplified query to avoid RLS issues
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('incident_feedback')
        .select(`
          *,
          incidents (
            title,
            status,
            priority
          )
        `)
        .order('submitted_at', { ascending: false });

      if (feedbackError) throw feedbackError;
      
      // Transform the data to match the expected type
      const transformedFeedback = (feedbackData || []).map(feedback => ({
        ...feedback,
        profiles: null // We'll handle profile data separately if needed
      }));
      
      setFeedback(transformedFeedback);

      // Calculate stats
      calculateStats(incidentsData || [], usersData || [], transformedFeedback);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (incidents: Incident[], users: User[], feedback: IncidentFeedback[]) => {
    const unassignedIncidents = incidents.filter(i => !i.assigned_to);
    const resolvedIncidents = incidents.filter(i => i.status === 'resolved' || i.status === 'closed');
    const highPriorityIncidents = incidents.filter(i => i.priority === 'high' || i.priority === 'critical');
    const pendingFeedback = feedback.filter(f => f.status === 'submitted');
    const activeSecurity = users.filter(u => u.role === 'security' && u.is_active);
    const recentActivity = incidents.filter(i => {
      const date = new Date(i.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });

    setStats({
      totalIncidents: incidents.length,
      unassignedIncidents: unassignedIncidents.length,
      activeSecurity: activeSecurity.length,
      pendingFeedback: pendingFeedback.length,
      totalUsers: users.length,
      resolvedIncidents: resolvedIncidents.length,
      highPriorityIncidents: highPriorityIncidents.length,
      recentActivity: recentActivity.length,
    });
  };

  const assignIncident = async () => {
    if (!selectedIncident || !selectedSecurity || !user) return;

    try {
      // Update incident assignment
      const { error: incidentError } = await supabase
        .from('incidents')
        .update({ 
          assigned_to: selectedSecurity,
          assigned_by: user.id,
          assigned_at: new Date().toISOString(),
          status: 'assigned'
        })
        .eq('id', selectedIncident);

      if (incidentError) throw incidentError;

      // Create assignment record
      const { error: assignmentError } = await supabase
        .from('incident_assignments')
        .insert({
          incident_id: selectedIncident,
          assigned_to: selectedSecurity,
          assigned_by: user.id,
          notes: assignmentNotes
        });

      if (assignmentError) throw assignmentError;

      // Update local state
      setIncidents(prev => 
        prev.map(incident => 
          incident.id === selectedIncident 
            ? { 
                ...incident, 
                assigned_to: selectedSecurity,
                assigned_by: user.id,
                assigned_at: new Date().toISOString(),
                status: 'assigned'
              }
            : incident
        )
      );

      // Recalculate stats
      calculateStats(incidents, users, feedback);

      // Reset form
      setSelectedIncident(null);
      setSelectedSecurity(null);
      setAssignmentNotes('');

      toast({
        title: "Incident Assigned",
        description: "The incident has been successfully assigned to security personnel.",
      });
    } catch (error) {
      console.error('Error assigning incident:', error);
      toast({
        title: "Error",
        description: "Failed to assign incident",
        variant: "destructive",
      });
    }
  };

  const approveFeedback = async (feedbackId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('incident_feedback')
        .update({
          admin_approved_at: new Date().toISOString(),
          admin_approved_by: user.id,
          status: 'approved'
        })
        .eq('id', feedbackId);

      if (error) throw error;

      // Update incident status
      const feedbackItem = feedback.find(f => f.id === feedbackId);
      if (feedbackItem) {
        const { error: incidentError } = await supabase
          .from('incidents')
          .update({ status: 'feedback_approved' })
          .eq('id', feedbackItem.incident_id);

        if (incidentError) throw incidentError;
      }

      // Update local state
      setFeedback(prev => 
        prev.map(f => 
          f.id === feedbackId 
            ? { 
                ...f, 
                admin_approved_at: new Date().toISOString(),
                admin_approved_by: user.id,
                status: 'approved'
              }
            : f
        )
      );

      // Recalculate stats
      calculateStats(incidents, users, feedback);

      toast({
        title: "Feedback Approved",
        description: "The security feedback has been approved.",
      });
    } catch (error) {
      console.error('Error approving feedback:', error);
      toast({
        title: "Error",
        description: "Failed to approve feedback",
        variant: "destructive",
      });
    }
  };

  const rejectFeedback = async (feedbackId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('incident_feedback')
        .update({
          status: 'rejected'
        })
        .eq('id', feedbackId);

      if (error) throw error;

      // Update local state
      setFeedback(prev => 
        prev.map(f => 
          f.id === feedbackId 
            ? { ...f, status: 'rejected' }
            : f
        )
      );

      // Recalculate stats
      calculateStats(incidents, users, feedback);

      toast({
        title: "Feedback Rejected",
        description: "The security feedback has been rejected.",
      });
    } catch (error) {
      console.error('Error rejecting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to reject feedback",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole as any })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, role: newRole }
            : user
        )
      );

      // Update security personnel list if needed
      if (newRole === 'security') {
        const updatedUser = users.find(u => u.id === userId);
        if (updatedUser) {
          setSecurityPersonnel(prev => [...prev, { ...updatedUser, role: newRole }]);
        }
      } else {
        setSecurityPersonnel(prev => prev.filter(u => u.id !== userId));
      }

      // Recalculate stats
      calculateStats(incidents, users, feedback);

      toast({
        title: "Role Updated",
        description: `User role updated to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, is_active: isActive }
            : user
        )
      );

      toast({
        title: isActive ? "User Activated" : "User Deactivated",
        description: `User has been ${isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const bulkAssignIncidents = async () => {
    if (selectedIncidents.length === 0 || !selectedSecurity || !user) return;

    try {
      for (const incidentId of selectedIncidents) {
        await supabase
          .from('incidents')
          .update({ 
            assigned_to: selectedSecurity,
            assigned_by: user.id,
            assigned_at: new Date().toISOString(),
            status: 'assigned'
          })
          .eq('id', incidentId);

        await supabase
          .from('incident_assignments')
          .insert({
            incident_id: incidentId,
            assigned_to: selectedSecurity,
            assigned_by: user.id,
            notes: 'Bulk assignment'
          });
      }

      // Update local state
      setIncidents(prev => 
        prev.map(incident => 
          selectedIncidents.includes(incident.id)
            ? { 
                ...incident, 
                assigned_to: selectedSecurity,
                assigned_by: user.id,
                assigned_at: new Date().toISOString(),
                status: 'assigned'
              }
            : incident
        )
      );

      setSelectedIncidents([]);
      setSelectedSecurity(null);

      toast({
        title: "Bulk Assignment Complete",
        description: `${selectedIncidents.length} incidents have been assigned.`,
      });
    } catch (error) {
      console.error('Error bulk assigning incidents:', error);
      toast({
        title: "Error",
        description: "Failed to bulk assign incidents",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported':
        return 'bg-warning text-warning-foreground';
      case 'assigned':
        return 'bg-accent text-accent-foreground';
      case 'in_progress':
        return 'bg-blue-500 text-white';
      case 'feedback_pending':
        return 'bg-orange-500 text-white';
      case 'feedback_submitted':
        return 'bg-purple-500 text-white';
      case 'feedback_approved':
        return 'bg-green-500 text-white';
      case 'resolved':
        return 'bg-success text-success-foreground';
      case 'closed':
        return 'bg-muted text-muted-foreground';
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
      case 'critical':
        return 'bg-red-600 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-primary text-primary-foreground';
      case 'super_admin':
        return 'bg-purple-600 text-white';
      case 'security':
        return 'bg-blue-600 text-white';
      case 'resident':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Filter functions
  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || incident.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const filteredUsers = users.filter(user => {
    return user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.username.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const unassignedIncidents = incidents.filter(i => !i.assigned_to);
  const pendingFeedback = feedback.filter(f => f.status === 'submitted');

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
            <Shield className="h-8 w-8 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Manage users, incidents, and security assignments
          </p>
        </div>
        <Button onClick={fetchAdminData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalIncidents}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.unassignedIncidents} unassigned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Personnel</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSecurity}</div>
                <p className="text-xs text-muted-foreground">
                  Active security staff
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Feedback</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingFeedback}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Registered users
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved Incidents</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.resolvedIncidents}</div>
                <p className="text-xs text-muted-foreground">
                  Successfully resolved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.highPriorityIncidents}</div>
                <p className="text-xs text-muted-foreground">
                  Critical incidents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <Activity className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recentActivity}</div>
                <p className="text-xs text-muted-foreground">
                  Last 7 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalIncidents > 0 
                    ? Math.round((stats.resolvedIncidents / stats.totalIncidents) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Resolution rate
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Incidents */}
        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Incidents</CardTitle>
              <CardDescription>
                View and manage all reported incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search incidents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="reported">Reported</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredIncidents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No incidents found matching your criteria
                  </div>
                ) : (
                  filteredIncidents.map((incident) => (
                    <div key={incident.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold">{incident.title}</h3>
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(incident.priority)}>
                            {incident.priority}
                          </Badge>
                          <Badge variant="secondary">{incident.category.replace('_', ' ')}</Badge>
                          {incident.is_verified && (
                            <Badge className="bg-success text-success-foreground">Verified</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ID: {incident.id.slice(0, 8)} • {new Date(incident.created_at).toLocaleDateString()}
                          {incident.assigned_to && (
                            <span> • Assigned to: {incident.assigned_to.slice(0, 8)}</span>
                          )}
                          {incident.address && (
                            <span> • {incident.address}</span>
                          )}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Link to={`/incidents/${incident.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assign Incidents</CardTitle>
              <CardDescription>
                Assign incidents to security personnel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bulk Assignment */}
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Bulk Assignment</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Select Incidents</Label>
                    <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                      {unassignedIncidents.map((incident) => (
                        <div key={incident.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={incident.id}
                            checked={selectedIncidents.includes(incident.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedIncidents(prev => [...prev, incident.id]);
                              } else {
                                setSelectedIncidents(prev => prev.filter(id => id !== incident.id));
                              }
                            }}
                          />
                          <Label htmlFor={incident.id} className="text-sm">
                            {incident.title} ({incident.priority})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Select Security Personnel</Label>
                    <Select value={selectedSecurity || ''} onValueChange={setSelectedSecurity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose security personnel" />
                      </SelectTrigger>
                      <SelectContent>
                        {securityPersonnel.map((security) => (
                          <SelectItem key={security.id} value={security.id}>
                            {security.full_name || security.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={bulkAssignIncidents}
                      disabled={selectedIncidents.length === 0 || !selectedSecurity}
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Bulk Assign ({selectedIncidents.length})
                    </Button>
                  </div>
                </div>
              </div>

              {/* Single Assignment */}
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Single Assignment</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Select Incident</Label>
                    <Select value={selectedIncident || ''} onValueChange={setSelectedIncident}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an incident" />
                      </SelectTrigger>
                      <SelectContent>
                        {unassignedIncidents.map((incident) => (
                          <SelectItem key={incident.id} value={incident.id}>
                            {incident.title} ({incident.priority})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Select Security Personnel</Label>
                    <Select value={selectedSecurity || ''} onValueChange={setSelectedSecurity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose security personnel" />
                      </SelectTrigger>
                      <SelectContent>
                        {securityPersonnel.map((security) => (
                          <SelectItem key={security.id} value={security.id}>
                            {security.full_name || security.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={assignIncident}
                      disabled={!selectedIncident || !selectedSecurity}
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Assign Incident
                    </Button>
                  </div>
                </div>

                {selectedIncident && selectedSecurity && (
                  <div className="mt-4">
                    <Label>Assignment Notes (Optional)</Label>
                    <Textarea
                      placeholder="Add any specific instructions or notes for the security personnel..."
                      value={assignmentNotes}
                      onChange={(e) => setAssignmentNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </div>

              {/* Unassigned Incidents */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Unassigned Incidents</h3>
                <div className="space-y-2">
                  {unassignedIncidents.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      All incidents have been assigned
                    </p>
                  ) : (
                    unassignedIncidents.map((incident) => (
                      <div key={incident.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <h4 className="font-medium">{incident.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {incident.category} • {incident.priority} priority • {new Date(incident.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(incident.priority)}>
                            {incident.priority}
                          </Badge>
                          <Link to={`/incidents/${incident.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback */}
        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Feedback</CardTitle>
              <CardDescription>
                Review and approve security personnel feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedback.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No feedback submitted yet
                  </p>
                ) : (
                  feedback.map((item) => (
                    <div key={item.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">
                            {item.incidents?.title || 'Incident'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Submitted by: {item.profiles?.full_name || 'Security Personnel'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.submitted_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                          {item.incidents?.priority && (
                            <Badge className={getPriorityColor(item.incidents.priority)}>
                              {item.incidents.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm">{item.feedback_text}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {item.status === 'submitted' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => approveFeedback(item.id)}
                              className="bg-success hover:bg-success/90"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => rejectFeedback(item.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        <Link to={`/incidents/${item.incident_id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View Incident
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found matching your criteria
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {user.full_name?.charAt(0) || user.username.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{user.full_name || user.username}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {user.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </span>
                            )}
                            {user.address && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {user.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={user.role === 'admin' || user.role === 'super_admin' ? 'default' : 'secondary'} className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                        
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="resident">Resident</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          variant={user.is_active ? "outline" : "secondary"}
                          onClick={() => toggleUserStatus(user.id, !user.is_active)}
                        >
                          {user.is_active ? (
                            <>
                              <UserCheck className="h-4 w-4 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="h-4 w-4 mr-1" />
                              Inactive
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;