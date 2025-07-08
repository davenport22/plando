
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Activity } from "@/types";
import { Loader2, PlusCircle } from "lucide-react";
import { useState } from "react";
import { DialogClose } from "@/components/ui/dialog";

const customActivitySchema = z.object({
  name: z.string().min(2, "Activity name is too short.").max(100, "Activity name is too long."),
  location: z.string().min(2, "Location is too short.").max(100, "Location is too long."),
  duration: z.coerce.number().min(0.5, "Duration must be at least 0.5 hours.").max(24, "Duration cannot exceed 24 hours."),
  description: z.string().max(200, "Description is too long.").optional(),
});

type CustomActivityFormValues = z.infer<typeof customActivitySchema>;

interface CustomActivityFormProps {
  onAddActivity: (activity: Omit<Activity, 'id' | 'isLiked' | 'tripId' | 'imageUrls' | 'likes' | 'dislikes' | 'category' | 'startTime' | 'dataAiHint' | 'votes'>) => Promise<void>;
}

export function CustomActivityForm({ onAddActivity }: CustomActivityFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<CustomActivityFormValues>({
    resolver: zodResolver(customActivitySchema),
    defaultValues: {
      name: "",
      location: "",
      duration: 1,
      description: "",
    },
  });

  async function onSubmit(data: CustomActivityFormValues) {
    setIsLoading(true);
    await onAddActivity(data);
    form.reset();
    setIsLoading(false);
    // Dialog will be closed by DialogClose wrapper on the button
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Local Market Visit" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Grand Bazaar" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (hours)</FormLabel>
              <FormControl>
                <Input type="number" step="0.5" placeholder="e.g., 2.5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Any details like opening hours, cost, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogClose asChild>
          <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            Add Activity
          </Button>
        </DialogClose>
      </form>
    </Form>
  );
}
