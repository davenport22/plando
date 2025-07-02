
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, calculateTripDuration } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { createTrip } from "@/lib/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const newTripFormSchema = z.object({
  name: z.string().min(3, "Trip name must be at least 3 characters.").max(50, "Trip name must be at most 50 characters."),
  destination: z.string().min(2, "Destination must be at least 2 characters.").max(100, "Destination must be at most 100 characters."),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  placeId: z.string().optional(),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type NewTripFormValues = z.infer<typeof newTripFormSchema>;

export function NewTripForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [durationDisplay, setDurationDisplay] = useState<string>("");

  const form = useForm<NewTripFormValues>({
    resolver: zodResolver(newTripFormSchema),
    defaultValues: {
      name: "",
      destination: "",
    },
  });

  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  useEffect(() => {
    if (startDate && endDate && endDate >= startDate) {
      const duration = calculateTripDuration(
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      );
      setDurationDisplay(duration);
    } else {
      setDurationDisplay("");
    }
  }, [startDate, endDate]);

  async function onSubmit(data: NewTripFormValues) {
    setIsLoading(true);
    
    const tripData = {
      ...data,
      startDate: format(data.startDate, "yyyy-MM-dd"),
      endDate: format(data.endDate, "yyyy-MM-dd"),
    };

    const result = await createTrip(tripData);

    if (result?.error) {
      toast({
        title: "Error Creating Trip",
        description: result.error,
        variant: "destructive",
      });
      setIsLoading(false);
    } else {
      toast({
        title: "Trip Created!",
        description: `Your trip "${data.name}" is being saved. Redirecting...`,
      });
      // The redirect is handled by the server action, so we don't need to do anything here.
      // The page will navigate away, so no need to set isLoading to false.
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trip Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Summer in Italy" {...field} />
              </FormControl>
              <FormDescription>Give your trip a memorable name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="destination"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Rome, Italy" {...field} />
              </FormControl>
              <FormDescription>
                Where are you planning to go?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>City Trips Focus</AlertTitle>
          <AlertDescription>
            Plando is currently optimized for city-based trips. Please enter a major city as your destination.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } 
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < (form.getValues("startDate") || new Date(new Date().setHours(0,0,0,0)))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {durationDisplay && (
          <p className="text-sm text-muted-foreground -mt-4">
            Trip duration: {durationDisplay}
          </p>
        )}
        <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Trip
        </Button>
      </form>
    </Form>
  );
}
