// This script is designed to be run manually from the command line
// to seed the Firestore database with initial data.
import { seedViennaActivities } from './seed';

async function runSeed() {
  console.log('Starting database seed...');
  await seedViennaActivities();
  console.log('Database seeding complete.');
}

runSeed().catch(error => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
