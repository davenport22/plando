// This script is designed to be run manually from the command line
// to seed the Firestore database with initial data.
import { config } from 'dotenv';
config(); // Load environment variables from .env file

import { seedViennaActivities } from './seed';

async function runSeed() {
  try {
    console.log('Starting database seed...');
    await seedViennaActivities();
    console.log('Database seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('\nSeeding failed. See error details above.');
    process.exit(1);
  }
}

runSeed();
