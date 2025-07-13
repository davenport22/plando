
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Activity } from "@/types";
import { Loader2, PlusCircle, Wand2 } from "lucide-react";
import { useState } from "react";
import { DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { extractActivityDetailsFromUrlAction } from "@/lib/actions";
import { CitySelect } from "@/components/common/CitySelect";

const customActivitySchema = z.object({
  name: z.string().min(2, "Activity name is too short.").max(100, "Activity name is too long."),
  location: z.string().min(1, "Please select a city."),
  duration: z.coerce.number().min(0.5, "Duration must be at least 0.5 hours.").max(24, "Duration cannot exceed 24 hours."),
  description: z.string().max(200, "Description is too long.").optional(),
});

type CustomActivityFormValues = z.infer<typeof customActivitySchema>;

interface CustomActivityFormProps {
  onAddActivity: (activity: Omit<Activity, 'id' | 'isLiked' | 'tripId' | 'imageUrls' | 'likes' | 'dislikes' | 'category' | 'startTime' | 'votes' | 'participants' | 'modules'>) => Promise<void>;
}

export function CustomActivityForm({ onAddActivity }: CustomActivityFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [url, setUrl] = useState('');
  const [dataAiHint, setDataAiHint] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  const form = useForm<CustomActivityFormValues>({
    resolver: zodResolver(customActivitySchema),
    defaultValues: {
      name: "",
      location: "",
      duration: 1,
      description: "",
    },
  });

  async function handleFetchDetails() {
    if (!url) {
      toast({ title: 'Please enter a URL.', variant: 'destructive' });
      return;
    }
    setIsFetchingDetails(true);
    const result = await extractActivityDetailsFromUrlAction(url);
    setIsFetchingDetails(false);

    if ('error' in result) {
      toast({ title: 'Failed to Fetch Details', description: result.error, variant: 'destructive' });
    } else {
      form.setValue('name', result.name || '');
      form.setValue('description', result.description || '');
      form.setValue('location', result.location || '');
      if (result.duration) {
        form.setValue('duration', result.duration);
      }
      if (result.address && result.location && !result.location.includes(result.address)) {
         form.setValue('location', `${result.address}, ${result.location}`);
      }
      setDataAiHint(result.dataAiHint);
      toast({ title: 'Details Fetched!', description: 'Activity details have been populated. Please review and save.' });
    }
  }

  async function onSubmit(data: CustomActivityFormValues) {
    setIsLoading(true);
    const payload = { ...data, dataAiHint };
    await onAddActivity(payload);
    form.reset();
    setDataAiHint(undefined);
    setUrl('');
    setIsLoading(false);
    // Dialog will be closed by DialogClose wrapper on the button
  }

  return (
    <Form {...form}>
       <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <FormLabel htmlFor="activity-url">Import from URL (Optional)</FormLabel>
          <div className="flex items-center gap-2">
            <Input
              id="activity-url"
              placeholder="e.g., Google Maps link, website..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isFetchingDetails}
            />
            <Button type="button" onClick={handleFetchDetails} disabled={!url || isFetchingDetails} variant="outline" size="icon">
              {isFetchingDetails ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              <span className="sr-only">Fetch Details with AI</span>
            </Button>
          </div>
          <FormDescription>
            Paste a link and let AI fill in the details for you.
          </FormDescription>
        </div>
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or Enter Manually</span>
            </div>
        </div>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <CitySelect onValueChange={field.onChange} defaultValue={field.value} />
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
