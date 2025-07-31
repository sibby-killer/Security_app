import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, AlertTriangle, Filter, Navigation } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Incident {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  location_lat: number;
  location_lng: number;
  address: string;
  created_at: string;
}

const MapView = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetchIncidents();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    filterIncidents();
  }, [incidents, statusFilter, categoryFilter]);

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('id, title, category, status, priority, location_lat, location_lng, address, created_at')
        .not('location_lat', 'eq', 0)
        .not('location_lng', 'eq', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast({
        title: "Error",
        description: "Failed to load incidents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const filterIncidents = () => {
    let filtered = incidents;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(incident => incident.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(incident => incident.category === categoryFilter);
    }

    setFilteredIncidents(filtered);
  };

  const getIncidentIcon = (priority: string, status: string) => {
    let colorClass = 'text-muted-foreground';
    
    if (status === 'resolved') {
      colorClass = 'text-success';
    } else if (priority === 'high') {
      colorClass = 'text-destructive';
    } else if (priority === 'medium') {
      colorClass = 'text-warning';
    } else {
      colorClass = 'text-accent';
    }

    return (
      <div className={`${colorClass} p-2 rounded-full bg-background border-2 border-current`}>
        <AlertTriangle className="h-4 w-4" />
      </div>
    );
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-8 w-8 text-primary" />
            Incident Map
          </h1>
          <p className="text-muted-foreground">View security incidents plotted by location</p>
        </div>
        <Button onClick={getCurrentLocation}>
          <Navigation className="h-4 w-4 mr-2" />
          Find My Location
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="reported">Reported</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="theft">Theft</SelectItem>
                  <SelectItem value="assault">Assault</SelectItem>
                  <SelectItem value="vandalism">Vandalism</SelectItem>
                  <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                  <SelectItem value="break_in">Break-in</SelectItem>
                  <SelectItem value="drug_activity">Drug Activity</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Legend</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-destructive rounded-full"></div>
                  <span>High Priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-warning rounded-full"></div>
                  <span>Medium Priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-accent rounded-full"></div>
                  <span>Low Priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success rounded-full"></div>
                  <span>Resolved</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map Placeholder and Incident List */}
        <div className="lg:col-span-3 space-y-6">
          {/* Map Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Interactive Map</CardTitle>
              <CardDescription>
                Showing {filteredIncidents.length} incidents
                {userLocation && ' - Your location is marked in blue'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg h-96 flex items-center justify-center relative overflow-hidden">
                {/* Simulated Map Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100 opacity-50">
                  <div className="absolute top-4 left-4 w-8 h-8 bg-blue-600 rounded-full animate-pulse">
                    {userLocation && (
                      <div className="w-full h-full flex items-center justify-center text-white text-xs">
                        You
                      </div>
                    )}
                  </div>
                </div>

                {/* Incident Markers */}
                {filteredIncidents.slice(0, 10).map((incident, index) => (
                  <div
                    key={incident.id}
                    className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform`}
                    style={{
                      left: `${20 + (index % 4) * 20}%`,
                      top: `${20 + Math.floor(index / 4) * 20}%`,
                    }}
                    onClick={() => setSelectedIncident(incident)}
                  >
                    {getIncidentIcon(incident.priority, incident.status)}
                  </div>
                ))}

                <div className="text-center">
                  <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold text-muted-foreground">Interactive Map View</p>
                  <p className="text-sm text-muted-foreground">
                    Click on markers to view incident details
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    In a real implementation, this would be integrated with Google Maps, OpenStreetMap, or similar
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Incident Details */}
          {selectedIncident && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Incident</CardTitle>
                <CardDescription>Click on map markers to view details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{selectedIncident.title}</h3>
                    <Badge>{selectedIncident.status}</Badge>
                    <Badge variant="outline">{selectedIncident.priority} priority</Badge>
                    <Badge variant="secondary">{selectedIncident.category.replace('_', ' ')}</Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {selectedIncident.address || 'Address not provided'}
                    </div>
                    <div>
                      Coordinates: {selectedIncident.location_lat.toFixed(6)}, {selectedIncident.location_lng.toFixed(6)}
                    </div>
                    <div>
                      Reported: {new Date(selectedIncident.created_at).toLocaleString()}
                    </div>
                    {userLocation && (
                      <div>
                        Distance: {calculateDistance(
                          userLocation.lat,
                          userLocation.lng,
                          selectedIncident.location_lat,
                          selectedIncident.location_lng
                        ).toFixed(2)} km from your location
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => window.open(`/incidents/${selectedIncident.id}`, '_blank')}
                    className="w-full"
                  >
                    View Full Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nearby Incidents List */}
          <Card>
            <CardHeader>
              <CardTitle>Incident List</CardTitle>
              <CardDescription>
                {filteredIncidents.length} incidents match your filters
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredIncidents.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No incidents match your current filters</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedIncident?.id === incident.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedIncident(incident)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{incident.title}</h4>
                        <Badge className="text-xs">{incident.priority}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div>{incident.category.replace('_', ' ')} • {incident.status}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {incident.address || 'Location not specified'}
                        </div>
                        {userLocation && (
                          <div className="mt-1">
                            {calculateDistance(
                              userLocation.lat,
                              userLocation.lng,
                              incident.location_lat,
                              incident.location_lng
                            ).toFixed(2)} km away
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MapView;