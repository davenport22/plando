
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DialogClose } from "@/components/ui/dialog";
import { cn, calculateTripDuration } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Loader2, Save, Sparkles, Trash2, AlertTriangle, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import type { Trip } from "@/types";
import { Separator } from "@/components/ui/separator";
import { ParticipantManager } from "./ParticipantManager";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { CitySelect } from "@/components/common/CitySelect";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";


const editTripFormSchema = z.object({
  name: z.string().min(3, "Trip name must be at least 3 characters.").max(50, "Trip name must be at most 50 characters."),
  destination: z.string().min(1, "Please select a destination city."),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  itineraryGenerationRule: z.enum(['majority', 'all']).default('majority'),
  syncLocalActivities: z.boolean().default(true),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  placeId: z.string().optional(),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type EditTripFormValues = z.infer<typeof editTripFormSchema>;

interface EditTripFormProps {
  currentTrip: Trip;
  onSubmit: (data: Partial<Omit<Trip, 'id' | 'ownerId' | 'participantIds' | 'imageUrl' | 'participants'>>) => Promise<void>;
  onDelete: (tripId: string) => Promise<void>;
}

export function EditTripForm({ currentTrip, onSubmit, onDelete }: EditTripFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [durationDisplay, setDurationDisplay] = useState<string>("");
  const [hasCopied, setHasCopied] = useState(false);

  const form = useForm<EditTripFormValues>({
    resolver: zodResolver(editTripFormSchema),
    defaultValues: {
      name: currentTrip.name,
      destination: currentTrip.destination,
      startDate: currentTrip.startDate ? parseISO(currentTrip.startDate) : new Date(),
      endDate: currentTrip.endDate ? parseISO(currentTrip.endDate) : new Date(),
      itineraryGenerationRule: currentTrip.itineraryGenerationRule || 'majority',
      syncLocalActivities: currentTrip.syncLocalActivities ?? true,
      latitude: currentTrip.latitude,
      longitude: currentTrip.longitude,
      placeId: currentTrip.placeId,
    },
  });
  
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  useEffect(() => {
    if (currentTrip.startDate && currentTrip.endDate) {
      const initialDuration = calculateTripDuration(
        currentTrip.startDate, 
        currentTrip.endDate
      );
      setDurationDisplay(initialDuration);
    }
  }, [currentTrip.startDate, currentTrip.endDate]);


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


  useEffect(() => {
    form.reset({
      name: currentTrip.name,
      destination: currentTrip.destination,
      startDate: currentTrip.startDate ? parseISO(currentTrip.startDate) : new Date(),
      endDate: currentTrip.endDate ? parseISO(currentTrip.endDate) : new Date(),
      itineraryGenerationRule: currentTrip.itineraryGenerationRule || 'majority',
      syncLocalActivities: currentTrip.syncLocalActivities ?? true,
      latitude: currentTrip.latitude,
      longitude: currentTrip.longitude,
      placeId: currentTrip.placeId,
    });
  }, [currentTrip, form]);

  async function handleFormSubmit(data: EditTripFormValues) {
    setIsLoading(true);
    
    await onSubmit({ 
        ...data,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        endDate: format(data.endDate, 'yyyy-MM-dd'),
    });
    setIsLoading(false);
  }

  const handleDeleteTrip = async () => {
    setIsDeleting(true);
    await onDelete(currentTrip.id);
    setIsDeleting(false);
  };
  
  const handleCopyId = () => {
    navigator.clipboard.writeText(currentTrip.id);
    setHasCopied(true);
    toast({ title: "Copied!", description: "Trip ID copied to clipboard." });
    setTimeout(() => setHasCopied(false), 2000);
  };


  return (
    <div className="space-y-6">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 pt-4">
                 <div className="space-y-2">
                  <FormLabel htmlFor="trip-id">Shareable Trip ID</FormLabel>
                   <div className="flex items-center gap-2">
                    <Input id="trip-id" value={currentTrip.id} readOnly className="font-mono bg-muted/50" />
                    <Button type="button" variant="outline" size="icon" onClick={handleCopyId} aria-label="Copy Trip ID">
                      {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <FormDescription>Share this ID with friends so they can join your trip.</FormDescription>
                </div>
                <Separator />
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Trip Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Summer in Italy" {...field} />
                    </FormControl>
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
                    <CitySelect onValueChange={field.onChange} defaultValue={field.value} />
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                "w-full justify-start text-left font-normal",
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
                                "w-full justify-start text-left font-normal",
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
                <p className="text-sm text-muted-foreground -mt-4 md:col-span-2">
                    Trip duration: {durationDisplay}
                </p>
                )}

                <FormField
                    control={form.control}
                    name="itineraryGenerationRule"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>Itinerary Generation Rule</FormLabel>
                        <FormDescription>
                            Choose how activities qualify for the automatic itinerary.
                        </FormDescription>
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                            >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="majority" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                 Majority of Voters Like It (with >50% participation)
                                </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="all" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                 All Participants Must Like It
                                </FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                  control={form.control}
                  name="syncLocalActivities"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          Sync Local Activities
                        </FormLabel>
                        <FormDescription>
                          Automatically include local discovery activities for your trip's destination.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label="Sync local activities"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <DialogClose asChild>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Trip Details
                </Button>
                </DialogClose>
            </form>
        </Form>
        <Separator />
        <ParticipantManager trip={currentTrip} />

        <Separator />
        <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
            <h3 className="font-semibold text-destructive flex items-center gap-2">
                <AlertTriangle />
                Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground">
                Deleting a trip is a permanent action and cannot be undone. All associated activities and itinerary data will be lost forever.
            </p>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete this Trip
                </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This will permanently delete the trip "{currentTrip.name}" and all its data. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteTrip} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, delete trip"}
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    </div>
  );
}
