
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { UserProfile } from "@/types";
import { Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/lib/actions";

const AVAILABLE_INTERESTS = [
  'Adventure', 'Art & Culture', 'Beaches', 'City Trips', 'Cuisine', 'History', 
  'Hiking', 'Luxury', 'Mountains', 'Nightlife', 'Outdoors', 'Photography', 
  'Relaxation', 'Shopping', 'Wildlife', 'Winter Sports'
];

const profileEditSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name is too long."),
  bio: z.string().max(500, "Bio is too long.").optional().default(""),
  location: z.string().max(100, "Location is too long.").optional().default(""),
  avatarUrl: z.string().url("Please enter a valid URL.").or(z.literal("")).optional().default(""),
  interests: z.array(z.string()).optional().default([]), 
});

type ProfileEditFormValues = z.infer<typeof profileEditSchema>;

interface ProfileEditFormProps {
  initialData: UserProfile;
}

export function ProfileEditForm({ initialData }: ProfileEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialData.interests || []);

  const form = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      name: initialData.name || "",
      bio: initialData.bio || "",
      location: initialData.location || "",
      avatarUrl: initialData.avatarUrl || "",
      interests: initialData.interests || [],
    },
  });

  useEffect(() => {
    form.reset({
      name: initialData.name || "",
      bio: initialData.bio || "",
      location: initialData.location || "",
      avatarUrl: initialData.avatarUrl || "",
      interests: initialData.interests || [],
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
    
    const updateData: Partial<UserProfile> = {
      name: data.name,
      bio: data.bio,
      location: data.location,
      avatarUrl: data.avatarUrl,
      interests: selectedInterests,
    };
    
    const result = await updateUserProfile(initialData.id, updateData);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
      router.push('/profile');
      router.refresh(); // Ask Next.js to refresh the new page data
    } else {
      toast({
        title: "Update Failed",
        description: result.error || "An unknown error occurred.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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
                <Input placeholder="e.g., City, Country" {...field} />
              </FormControl>
              <FormDescription>
                Your home city. This helps us suggest local activities in other Plando modules.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="avatarUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/your-avatar.png" {...field} />
              </FormControl>
              <FormDescription>Link to your profile picture.</FormDescription>
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
