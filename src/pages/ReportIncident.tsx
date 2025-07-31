import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Camera, AlertTriangle, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ReportIncident = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Access",
            description: "Unable to get current location. Please enter address manually.",
            variant: "destructive",
          });
        }
      );
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Create incident record
      const incidentData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        priority: formData.get('priority') as any,
        address: formData.get('address') as string,
        location_lat: location?.lat || 0,
        location_lng: location?.lng || 0,
        is_anonymous: formData.get('anonymous') === 'on',
        reporter_id: user.id,
        status: 'reported' as any,
      };

      const { data: incident, error: incidentError } = await supabase
        .from('incidents')
        .insert(incidentData)
        .select()
        .single();

      if (incidentError) throw incidentError;

      // Upload photos if any
      if (selectedFiles.length > 0 && incident) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${incident.id}/${Math.random()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('incident-photos')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('incident-photos')
            .getPublicUrl(fileName);

          return supabase
            .from('incident_photos')
            .insert({
              incident_id: incident.id,
              photo_url: publicUrl,
              file_name: file.name,
              file_size: file.size,
              uploaded_by: user.id,
            });
        });

        await Promise.all(uploadPromises);
      }

      toast({
        title: "Incident Reported",
        description: "Your incident has been successfully reported to the community.",
      });

      navigate('/incidents');
    } catch (error) {
      console.error('Error submitting incident:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit incident. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-primary" />
          Report Security Incident
        </h1>
        <p className="text-muted-foreground mt-2">
          Help keep your community safe by reporting security incidents
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incident Details</CardTitle>
          <CardDescription>
            Please provide as much information as possible to help authorities respond effectively
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Incident Title*</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Brief description of the incident"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category*</Label>
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select incident category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="theft">Theft</SelectItem>
                  <SelectItem value="assault">Assault</SelectItem>
                  <SelectItem value="vandalism">Vandalism</SelectItem>
                  <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                  <SelectItem value="break_in">Break-in</SelectItem>
                  <SelectItem value="drug_activity">Drug Activity</SelectItem>
                  <SelectItem value="noise_complaint">Noise Complaint</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level*</Label>
              <Select name="priority" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High - Immediate threat/Emergency</SelectItem>
                  <SelectItem value="medium">Medium - Requires attention</SelectItem>
                  <SelectItem value="low">Low - Non-urgent matter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description*</Label>
              <Textarea
                id="description"
                name="description"
                required
                placeholder="Provide detailed information about what happened, when it occurred, and any other relevant details"
                rows={4}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="address">Location/Address</Label>
              <div className="flex gap-2">
                <Input
                  id="address"
                  name="address"
                  placeholder="Enter the address or location details"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setLocation({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                          });
                          toast({
                            title: "Location Updated",
                            description: "Current location has been captured.",
                          });
                        }
                      );
                    }
                  }}
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
              {location && (
                <p className="text-xs text-muted-foreground">
                  GPS coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              )}
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label htmlFor="photos">Photos (Optional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6">
                <div className="text-center">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <Label htmlFor="photos" className="cursor-pointer">
                    <span className="text-sm font-medium text-primary hover:underline">
                      Click to upload photos
                    </span>
                    <Input
                      id="photos"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload up to 5 photos (PNG, JPG, JPEG)
                  </p>
                </div>
                
                {selectedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Anonymous reporting */}
            <div className="flex items-center space-x-2">
              <Checkbox id="anonymous" name="anonymous" />
              <Label htmlFor="anonymous" className="text-sm">
                Report anonymously (your identity will not be shared)
              </Label>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Report...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Submit Incident Report
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportIncident;