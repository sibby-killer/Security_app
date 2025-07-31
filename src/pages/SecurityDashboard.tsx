import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MessageSquare,
  Eye,
  Send,
  FileText,
  User
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface AssignedIncident {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  address: string;
  created_at: string;
  assigned_at: string;
  reporter_id: string;
  profiles?: {
    full_name: string;
    role: string;
  } | null; // Allow null for when profiles data is not accessible
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
  };
}

const SecurityDashboard = () => {
  const { user } = useAuth();
  const [assignedIncidents, setAssignedIncidents] = useState<AssignedIncident[]>([]);
  const [feedback, setFeedback] = useState<IncidentFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSecurityData();
    }
  }, [user]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Fetch assigned incidents - simplified query to avoid RLS issues
      const { data: incidentsData, error: incidentsError } = await supabase
        .from('incidents')
        .select('*')
        .eq('assigned_to', user?.id)
        .order('assigned_at', { ascending: false });

      if (incidentsError) throw incidentsError;
      
      // Transform the data to match the expected type
      const transformedIncidents = (incidentsData || []).map(incident => ({
        ...incident,
        profiles: null // We'll handle profile data separately if needed
      }));
      
      setAssignedIncidents(transformedIncidents);

      // Fetch feedback submitted by this security personnel
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('incident_feedback')
        .select(`
          *,
          incidents (
            title,
            status
          )
        `)
        .eq('security_id', user?.id)
        .order('submitted_at', { ascending: false });

      if (feedbackError) throw feedbackError;
      setFeedback(feedbackData || []);

    } catch (error) {
      console.error('Error fetching security data:', error);
      toast({
        title: "Error",
        description: "Failed to load security data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateIncidentStatus = async (incidentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ status: newStatus as any })
        .eq('id', incidentId);

      if (error) throw error;

      setAssignedIncidents(prev => 
        prev.map(incident => 
          incident.id === incidentId 
            ? { ...incident, status: newStatus }
            : incident
        )
      );

      toast({
        title: "Status Updated",
        description: `Incident status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating incident status:', error);
      toast({
        title: "Error",
        description: "Failed to update incident status",
        variant: "destructive",
      });
    }
  };

  const submitFeedback = async () => {
    if (!selectedIncident || !feedbackText.trim() || !user) return;

    setIsSubmittingFeedback(true);
    try {
      const { error } = await supabase
        .from('incident_feedback')
        .insert({
          incident_id: selectedIncident,
          security_id: user.id,
          feedback_text: feedbackText,
          status: 'submitted'
        });

      if (error) throw error;

      // Update incident status to feedback_pending
      const { error: incidentError } = await supabase
        .from('incidents')
        .update({ status: 'feedback_pending' })
        .eq('id', selectedIncident);

      if (incidentError) throw incidentError;

      // Update local state
      setAssignedIncidents(prev => 
        prev.map(incident => 
          incident.id === selectedIncident 
            ? { ...incident, status: 'feedback_pending' }
            : incident
        )
      );

      // Reset form
      setSelectedIncident(null);
      setFeedbackText('');

      toast({
        title: "Feedback Submitted",
        description: "Your feedback has been submitted and is pending approval.",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const activeIncidents = assignedIncidents.filter(i => 
    ['assigned', 'in_progress'].includes(i.status)
  );
  const completedIncidents = assignedIncidents.filter(i => 
    ['feedback_approved', 'resolved', 'closed'].includes(i.status)
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Security Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your assigned incidents and submit feedback
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedIncidents.length}</div>
            <p className="text-xs text-muted-foreground">
              Incidents assigned to you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeIncidents.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently handling
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedIncidents.length}</div>
            <p className="text-xs text-muted-foreground">
              Successfully resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedback.filter(f => f.status === 'submitted').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Incidents</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        {/* Active Incidents */}
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Incidents</CardTitle>
              <CardDescription>
                Incidents currently assigned to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeIncidents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No active incidents assigned to you
                  </p>
                ) : (
                  activeIncidents.map((incident) => (
                    <div key={incident.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{incident.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {incident.address} • {new Date(incident.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(incident.priority)}>
                            {incident.priority}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm mb-4">{incident.description}</p>
                      
                      <div className="flex items-center gap-2">
                        <Link to={`/incidents/${incident.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </Link>
                        
                        <Select
                          value={incident.status}
                          onValueChange={(value) => updateIncidentStatus(incident.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {incident.status === 'in_progress' && (
                          <Button 
                            size="sm"
                            onClick={() => setSelectedIncident(incident.id)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Submit Feedback
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Incidents */}
        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Incidents</CardTitle>
              <CardDescription>
                Incidents you have successfully handled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedIncidents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No completed incidents yet
                  </p>
                ) : (
                  completedIncidents.map((incident) => (
                    <div key={incident.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{incident.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {incident.address} • Completed: {new Date(incident.assigned_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(incident.priority)}>
                            {incident.priority}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Link to={`/incidents/${incident.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
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

        {/* Feedback */}
        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submit Feedback</CardTitle>
              <CardDescription>
                Submit feedback for incidents you have handled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Feedback Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Incident</label>
                  <Select value={selectedIncident || ''} onValueChange={setSelectedIncident}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an incident to provide feedback for" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeIncidents
                        .filter(incident => incident.status === 'in_progress')
                        .map((incident) => (
                          <SelectItem key={incident.id} value={incident.id}>
                            {incident.title} ({incident.priority})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedIncident && (
                  <div>
                    <label className="text-sm font-medium">Feedback</label>
                    <Textarea
                      placeholder="Describe the actions taken, outcome, and any recommendations..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      rows={4}
                    />
                    <Button 
                      onClick={submitFeedback}
                      disabled={isSubmittingFeedback || !feedbackText.trim()}
                      className="mt-2"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Submitted Feedback */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Submitted Feedback</h3>
                <div className="space-y-4">
                  {feedback.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No feedback submitted yet
                    </p>
                  ) : (
                    feedback.map((item) => (
                      <div key={item.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">
                              {item.incidents?.title || 'Incident'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Submitted: {new Date(item.submitted_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm mb-3">{item.feedback_text}</p>
                        
                        <div className="flex items-center gap-2">
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard; 