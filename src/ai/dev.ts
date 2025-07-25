
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-suggested-itinerary.ts';
import '@/ai/flows/generate-activity-description-flow.ts';
import '@/ai/flows/generate-destination-image-flow.ts';
import '@/ai/flows/generate-invitation-email-flow.ts';
import '@/ai/flows/extract-activity-details-from-url-flow.ts';
import '@/ai/flows/generate-activity-image-flow.ts';
