
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
import { Loader2, Save, Upload } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/lib/actions";
import { CityAutocompleteInput } from "@/components/common/CityAutocompleteInput";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const AVAILABLE_INTERESTS = [
  'Adventure', 'Art & Culture', 'Beaches', 'City Trips', 'Cuisine', 'History', 
  'Hiking', 'Luxury', 'Mountains', 'Nightlife', 'Outdoors', 'Photography', 
  'Relaxation', 'Shopping', 'Wildlife', 'Winter Sports'
];

const profileEditSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name is too long."),
  bio: z.string().max(500, "Bio is too long.").optional().default(""),
  location: z.string().max(100, "Location is too long.").optional().default(""),
  interests: z.array(z.string()).optional().default([]), 
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

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData.avatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      name: initialData.name || "",
      bio: initialData.bio || "",
      location: initialData.location || "",
      interests: initialData.interests || [],
    },
  });

  useEffect(() => {
    form.reset({
      name: initialData.name || "",
      bio: initialData.bio || "",
      location: initialData.location || "",
      interests: initialData.interests || [],
    });
    setSelectedInterests(initialData.interests || []);
    setAvatarPreview(initialData.avatarUrl || null);
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
    
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('bio', data.bio || "");
    formData.append('location', data.location || "");
    formData.append('interests', JSON.stringify(selectedInterests));
    formData.append('userId', initialData.id);

    if (avatarFile) {
      formData.append('avatarFile', avatarFile);
    } else {
      formData.append('avatarUrl', initialData.avatarUrl || "");
    }
    
    const result = await updateUserProfile(formData);
    
    if (result.success) {
      await refreshUserProfile();
      toast({
        title: "Profile Updated!",
        description: "Your changes have been saved successfully.",
      });
      router.push('/profile');
    } else {
      toast({
        title: "Update Failed",
        description: result.error,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        
        <FormItem>
          <FormLabel>Profile Picture</FormLabel>
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview || `https://avatar.vercel.sh/${initialData.email}.png`} />
              <AvatarFallback>{initialData.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Change Photo
            </Button>
            <Input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png, image/jpeg, image/gif"
              onChange={handleAvatarChange}
            />
          </div>
          <FormDescription>Upload a new profile picture. Best results with a square image.</FormDescription>
        </FormItem>

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
              <FormLabel>Location</FormLabel>
              <FormControl>
                <CityAutocompleteInput
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="e.g., City, Country"
                />
              </FormControl>
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
                    <Input type="hidden" {...field} value={selectedInterests.join(',')} />
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
