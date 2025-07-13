
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserProfile } from "@/types";
import { Loader2, Save, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/lib/actions";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { CitySelect } from "@/components/common/CitySelect";
import { CITIES } from "@/lib/cities";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const AVAILABLE_INTERESTS = [
  'Adventure', 'Art & Culture', 'Beaches', 'City Trips', 'Cuisine', 'History', 
  'Hiking', 'Luxury', 'Mountains', 'Nightlife', 'Outdoors', 'Photography', 
  'Relaxation', 'Shopping', 'Wildlife', 'Winter Sports'
];

const profileEditSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name is too long."),
  avatarUrl: z.string().url("Please enter a valid URL for the avatar.").or(z.literal("")).optional(),
  bio: z.string().max(500, "Bio is too long.").optional().default(""),
  location: z.string().min(1, "Please select your home city."),
  interests: z.string(), // We send interests as a JSON string
});

type ProfileEditFormValues = z.infer<typeof profileEditSchema>;

interface ProfileEditFormProps {
  initialData: UserProfile;
}

export function ProfileEditForm({ initialData }: ProfileEditFormProps) {
  const { toast } = useToast();
  const { refreshUserProfile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialData.interests || []);

  const form = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      name: initialData.name || "",
      avatarUrl: initialData.avatarUrl || "",
      bio: initialData.bio || "",
      location: initialData.location || "",
      interests: JSON.stringify(initialData.interests || []),
    },
  });
  
  // When selectedInterests changes, update the hidden form field
  useEffect(() => {
    form.setValue('interests', JSON.stringify(selectedInterests));
  }, [selectedInterests, form]);


  useEffect(() => {
    form.reset({
      name: initialData.name || "",
      avatarUrl: initialData.avatarUrl || "",
      bio: initialData.bio || "",
      location: initialData.location || "",
      interests: JSON.stringify(initialData.interests || []),
    });
    setSelectedInterests(initialData.interests || []);
  }, [initialData, form]);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(item => item !== interest)
        : [...prev, interest]
    );
  };

  async function handleSubmit(data: ProfileEditFormValues) {
    setIsLoading(true);
    try {
        const interests = JSON.parse(data.interests);
        const payload: Partial<UserProfile> = {
            name: data.name,
            bio: data.bio,
            location: data.location,
            avatarUrl: data.avatarUrl,
            interests,
        };

        const result = await updateUserProfile(initialData.id, payload);

        if (result.success && result.updatedProfile) {
            await refreshUserProfile(result.updatedProfile);
            toast({
                title: "Profile Updated",
                description: "Your changes have been saved successfully.",
            });
            router.push('/profile');
        } else {
            toast({
                title: "Update Failed",
                description: result.error,
                variant: "destructive",
            });
            setIsLoading(false);
        }
    } catch (error) {
        toast({
            title: "An Unexpected Error Occurred",
            description: "Could not save profile. Please try again.",
            variant: "destructive",
        });
        setIsLoading(false);
    }
}

  const isLocationInvalid = initialData.location && !CITIES.includes(initialData.location);

  return (
    <Form {...form}>
       {isLocationInvalid && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Action Required: Update Your Location</AlertTitle>
          <AlertDescription>
            Your currently saved location ('{initialData.location}') is no longer valid. Please select a city from the list below to continue seeing relevant activities.
          </AlertDescription>
        </Alert>
      )}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        
        <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
                <AvatarImage src={form.watch('avatarUrl') || `https://avatar.vercel.sh/${initialData.email}.png`} alt={form.watch('name')} />
                <AvatarFallback>{initialData.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                <FormItem className="flex-grow">
                    <FormLabel>Avatar Image URL</FormLabel>
                    <FormControl>
                        <Input placeholder="https://example.com/your-photo.png" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormDescription>
                        Paste a URL to your profile image.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input type="email" value={initialData.email} disabled className="bg-muted/50"/>
          </FormControl>
          <FormDescription>Email address cannot be changed here.</FormDescription>
        </FormItem>

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us a little about yourself and your travel style." {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Home City</FormLabel>
              <CitySelect onValueChange={field.onChange} defaultValue={field.value} />
              <FormDescription>
                Your home city. This helps us suggest local activities in other Plando modules.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Interests</FormLabel>
          <FormDescription>Select your travel interests.</FormDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            {AVAILABLE_INTERESTS.map(interest => (
              <Button
                key={interest}
                type="button"
                variant={selectedInterests.includes(interest) ? "default" : "outline"}
                onClick={() => handleInterestToggle(interest)}
                className="rounded-full px-4 py-2 text-sm"
              >
                {interest}
              </Button>
            ))}
          </div>
           <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </FormItem>
        
        <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
