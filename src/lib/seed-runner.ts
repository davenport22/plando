// This script is designed to be run manually from the command line
// to seed the Firestore database with initial data.
import { config } from 'dotenv';

// IMPORTANT: Load environment variables from .env file BEFORE importing other modules.
config(); 

import { seedViennaActivities } from './seed';

async function runSeed() {
  console.log('Starting database seed...');
  await seedViennaActivities();
  console.log('Database seeding complete.');
  process.exit(0);
}

runSeed().catch(error => {
  console.error('\nSeeding failed. See error details above.');
  process.exit(1);
});
