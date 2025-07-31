import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, MapPin, Clock, User, MessageCircle, Camera, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Incident {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  address: string;
  location_lat: number;
  location_lng: number;
  created_at: string;
  updated_at: string;
  reporter_id: string;
  assigned_to: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  is_anonymous: boolean;
  is_verified: boolean;
  resolved_at: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  is_internal: boolean;
  profiles?: {
    full_name: string;
    role: string;
  };
}

interface Photo {
  id: string;
  photo_url: string;
  file_name: string;
  created_at: string;
}

const IncidentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchIncidentDetails();
    }
  }, [id]);

  const fetchIncidentDetails = async () => {
    try {
      // Fetch incident
      const { data: incidentData, error: incidentError } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', id)
        .single();

      if (incidentError) throw incidentError;
      setIncident(incidentData);

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            full_name,
            role
          )
        `)
        .eq('incident_id', id)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;
      setComments(commentsData || []);

      // Fetch photos
      const { data: photosData, error: photosError } = await supabase
        .from('incident_photos')
        .select('*')
        .eq('incident_id', id)
        .order('created_at', { ascending: true });

      if (photosError) throw photosError;
      setPhotos(photosData || []);
    } catch (error) {
      console.error('Error fetching incident details:', error);
      toast({
        title: "Error",
        description: "Failed to load incident details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !incident) return;

    setIsSubmittingComment(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          incident_id: incident.id,
          content: newComment,
          user_id: user.id,
          is_internal: false,
        })
        .select(`
          *,
          profiles (
            full_name,
            role
          )
        `)
        .single();

      if (error) throw error;

      setComments(prev => [...prev, data]);
      setNewComment('');
      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully.",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const updateIncidentStatus = async (newStatus: string) => {
    if (!incident || !user) return;

    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('incidents')
        .update(updateData)
        .eq('id', incident.id);

      if (error) throw error;

      setIncident(prev => prev ? { ...prev, ...updateData } : null);
      toast({
        title: "Status Updated",
        description: `Incident status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update incident status",
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

  if (!incident) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Incident Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The incident you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/incidents">
              <Button>Back to Incidents</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/incidents">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{incident.title}</h1>
          <p className="text-muted-foreground">Incident #{incident.id.slice(0, 8)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Details */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>Incident Details</CardTitle>
                <Badge className={getStatusColor(incident.status)}>
                  {incident.status}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(incident.priority)}>
                  {incident.priority} priority
                </Badge>
                <Badge variant="secondary">{incident.category.replace('_', ' ')}</Badge>
                {incident.is_anonymous && (
                  <Badge variant="outline">Anonymous</Badge>
                )}
                {incident.is_verified && (
                  <Badge variant="outline" className="bg-success text-success-foreground">
                    Verified
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground">{incident.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{incident.address || 'Location not specified'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(incident.created_at).toLocaleString()}</span>
                </div>
                {!incident.is_anonymous && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Reporter ID: {incident.reporter_id.slice(0, 8)}</span>
                  </div>
                )}
                {incident.resolved_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-success" />
                    <span>Resolved: {new Date(incident.resolved_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          {photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Evidence Photos ({photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="space-y-2">
                      <img
                        src={photo.photo_url}
                        alt={photo.file_name}
                        className="w-full h-48 object-cover rounded-md border"
                      />
                      <p className="text-xs text-muted-foreground">{photo.file_name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Comments & Updates ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Comment */}
              {user && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment or update..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleAddComment}
                    disabled={isSubmittingComment || !newComment.trim()}
                  >
                    {isSubmittingComment ? 'Adding...' : 'Add Comment'}
                  </Button>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No comments yet. Be the first to add an update.
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-4 border border-border rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {comment.profiles?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {comment.profiles?.full_name || 'User'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {comment.profiles?.role || 'resident'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                          {comment.is_internal && (
                            <Badge variant="secondary" className="text-xs">Internal</Badge>
                          )}
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle>Manage Status</CardTitle>
                <CardDescription>Update the incident status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={incident.status}
                  onValueChange={updateIncidentStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reported">Reported</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="feedback_pending">Feedback Pending</SelectItem>
                    <SelectItem value="feedback_submitted">Feedback Submitted</SelectItem>
                    <SelectItem value="feedback_approved">Feedback Approved</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                
                {incident.assigned_to && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Assigned to:</p>
                    <p className="font-medium">{incident.assigned_to.slice(0, 8)}</p>
                    {incident.assigned_at && (
                      <p className="text-xs text-muted-foreground">
                        Assigned: {new Date(incident.assigned_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/report">
                <Button variant="outline" className="w-full">
                  Report Similar Incident
                </Button>
              </Link>
              <Link to="/map">
                <Button variant="outline" className="w-full">
                  View on Map
                </Button>
              </Link>
              <Button variant="outline" className="w-full">
                Share Incident
              </Button>
            </CardContent>
          </Card>

          {/* Related Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Area Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Incidents this month:</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between">
                  <span>Resolution rate:</span>
                  <span className="font-semibold text-success">85%</span>
                </div>
                <div className="flex justify-between">
                  <span>Average response:</span>
                  <span className="font-semibold">2.4 hours</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetails;