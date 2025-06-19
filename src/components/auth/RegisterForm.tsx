
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const AVAILABLE_INTERESTS = [
  'Adventure', 'Art & Culture', 'Beaches', 'City Trips', 'Cuisine', 'History', 
  'Hiking', 'Luxury', 'Mountains', 'Nightlife', 'Outdoors', 'Photography', 
  'Relaxation', 'Shopping', 'Wildlife', 'Winter Sports'
];

const registerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  bio: z.string().max(500, "Bio is too long. Please keep it under 500 characters.").optional().default(""),
  location: z.string().max(100, "Location is too long. Please keep it under 100 characters.").optional().default(""),
  avatarUrl: z.string().url("Please enter a valid URL for your avatar, e.g., https://example.com/avatar.png").or(z.literal("")).optional().default(""),
  interests: z.array(z.string()).optional().default([]),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      bio: "",
      location: "",
      avatarUrl: "",
      interests: [],
    },
  });

  // Sync selectedInterests with RHF's interests field for validation and submission
  useEffect(() => {
    form.setValue("interests", selectedInterests);
  }, [selectedInterests, form]);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(item => item !== interest)
        : [...prev, interest]
    );
  };

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    // The 'interests' field in 'data' will be correctly populated 
    // due to the useEffect syncing selectedInterests to form.setValue
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Register Data:", data); 
    toast({ title: "Registration Successful!", description: "Welcome to Plando! Please log in." });
    setIsLoading(false);
    router.push("/login");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us a bit about your travel style or what you love about traveling." {...field} rows={3} />
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
              <FormLabel>Location (Optional)</FormLabel>
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
              <FormLabel>Avatar URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/your-image.png" {...field} />
              </FormControl>
              <FormDescription>Link to an image for your profile picture.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormItem>
          <FormLabel>Interests (Optional)</FormLabel>
          <FormDescription>Select some of your travel interests.</FormDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            {AVAILABLE_INTERESTS.map(interest => (
              <Button
                key={interest}
                type="button"
                variant={selectedInterests.includes(interest) ? "default" : "outline"}
                onClick={() => handleInterestToggle(interest)}
                className="rounded-full px-3 py-1 text-xs h-auto"
              >
                {interest}
              </Button>
            ))}
          </div>
          {/* Hidden FormField to let RHF know about 'interests' for validation */}
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>
    </Form>
  );
}
