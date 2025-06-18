
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

const profileEditSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name is too long."),
  bio: z.string().max(500, "Bio is too long.").optional().default(""),
  location: z.string().max(100, "Location is too long.").optional().default(""),
  avatarUrl: z.string().url("Please enter a valid URL.").or(z.literal("")).optional().default(""),
  interests: z.string().optional().default(""), // Comma-separated string
});

type ProfileEditFormValues = z.infer<typeof profileEditSchema>;

interface ProfileEditFormProps {
  initialData: UserProfile;
  onSubmit: (data: Partial<UserProfile>) => Promise<void>;
}

export function ProfileEditForm({ initialData, onSubmit }: ProfileEditFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      name: initialData.name || "",
      bio: initialData.bio || "",
      location: initialData.location || "",
      avatarUrl: initialData.avatarUrl || "",
      interests: initialData.interests?.join(", ") || "",
    },
  });

  useEffect(() => {
    form.reset({
      name: initialData.name || "",
      bio: initialData.bio || "",
      location: initialData.location || "",
      avatarUrl: initialData.avatarUrl || "",
      interests: initialData.interests?.join(", ") || "",
    });
  }, [initialData, form]);

  async function handleSubmit(data: ProfileEditFormValues) {
    setIsLoading(true);
    const interestsArray = data.interests ? data.interests.split(",").map(s => s.trim()).filter(s => s) : [];
    
    const updateData: Partial<UserProfile> = {
      name: data.name,
      bio: data.bio,
      location: data.location,
      avatarUrl: data.avatarUrl,
      interests: interestsArray,
    };
    await onSubmit(updateData);
    setIsLoading(false);
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

        <FormField
          control={form.control}
          name="interests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interests</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Hiking, Photography, Foodie, Beaches" {...field} rows={3} />
              </FormControl>
              <FormDescription>Enter your interests, separated by commas.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
