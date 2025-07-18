
'use server';

import { firestore, isFirebaseInitialized } from './firebase';
import type { Activity } from '@/types';
import { generateAndStoreActivityImage } from './aiUtils';
import { generateActivityDescription } from '@/ai/flows/generate-activity-description-flow';

const viennaActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Classical Concert at St. Anne's Church", description: "Experience the magic of Mozart and Beethoven in the stunning baroque ambiance of St. Anne's Church.", location: "Vienna, Austria", duration: 1.5, dataAiHint: "vienna church concert", createdBy: 'system' },
    { name: "Coffee and Cake at a Viennese Coffee House", description: "Indulge in classic pastries like Sachertorte or Apfelstrudel in a historic setting.", location: "Vienna, Austria", duration: 1.5, dataAiHint: "vienna coffee cake", createdBy: 'system' },
    { name: "Fun at the Prater Amusement Park", description: "Enjoy a nostalgic day out with thrilling rides, games, and a romantic trip on the famous Wiener Riesenrad (Ferris Wheel).", location: "Vienna, Austria", duration: 3.5, dataAiHint: "amusement park", createdBy: 'system' },
    { name: "Stroll through Schönbrunn Gardens", description: "A romantic walk through the magnificent gardens of the former imperial summer residence, with beautiful fountains and the Gloriette.", location: "Vienna, Austria", duration: 2.5, dataAiHint: "vienna palace garden", createdBy: 'system' },
    { name: "Visit Belvedere Palace to See 'The Kiss'", description: "Witness Gustav Klimt's masterpiece 'The Kiss' in person at the stunning Belvedere Palace, a perfect romantic art date.", location: "Vienna, Austria", duration: 2, dataAiHint: "vienna art palace", createdBy: 'system' },
];

const villachActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Hike on Gerlitzen Alpe", description: "Take the cable car up and hike one of the many trails on Gerlitzen for stunning panoramic views of the surrounding lakes and mountains.", location: "Villach, Austria", duration: 4, dataAiHint: "alps hiking", createdBy: 'system' },
    { name: "Mountain Biking around Lake Faak", description: "Explore the scenic trails around the turquoise waters of Lake Faak, with routes available for all skill levels.", location: "Villach, Austria", duration: 3, dataAiHint: "mountain biking lake", createdBy: 'system' },
    { name: "Stand-up Paddling on Lake Ossiach", description: "Rent a paddleboard and enjoy a relaxing yet sporty day on the beautiful Lake Ossiach, one of Carinthia's largest lakes.", location: "Villach, Austria", duration: 2, dataAiHint: "paddleboarding lake", createdBy: 'system' },
    { name: "Climb at Kletterwald Ossiacher See", description: "Challenge yourselves at this high ropes adventure park with various courses set in the forest right by the lake.", location: "Villach, Austria", duration: 3.5, dataAiHint: "ropes course forest", createdBy: 'system' },
    { name: "Paragliding from Gerlitzen", description: "Experience the thrill of a tandem paragliding flight from the Gerlitzen mountain, soaring over Lake Ossiach.", location: "Villach, Austria", duration: 2, dataAiHint: "paragliding alps", createdBy: 'system' },
];

const newYorkActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Walk Through Central Park", description: "Rent a rowboat, visit Strawberry Fields, or simply enjoy a picnic in this iconic urban oasis.", location: "New York, USA", duration: 3, dataAiHint: "central park", createdBy: 'system' },
    { name: "See a Broadway Show", description: "Experience the magic of live theater with a world-class performance in the heart of Times Square.", location: "New York, USA", duration: 3, dataAiHint: "broadway theater", createdBy: 'system' },
    { name: "Visit the Metropolitan Museum of Art", description: "Explore vast collections spanning thousands of years of world culture, from ancient Egypt to contemporary art.", location: "New York, USA", duration: 4, dataAiHint: "art museum", createdBy: 'system' },
    { name: "Walk Across the Brooklyn Bridge", description: "Enjoy stunning views of the Manhattan skyline and the Statue of Liberty on this iconic walk.", location: "New York, USA", duration: 1.5, dataAiHint: "brooklyn bridge", createdBy: 'system' },
    { name: "Explore the Food Scene in Greenwich Village", description: "Go on a food tour or simply wander the charming streets, sampling everything from pizza to artisanal cupcakes.", location: "New York, USA", duration: 3, dataAiHint: "village food", createdBy: 'system' },
];

const londonActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Visit the Tower of London", description: "Explore centuries of British history, see the Crown Jewels, and meet the famous Yeoman Warders.", location: "London, UK", duration: 3.5, dataAiHint: "london tower", createdBy: 'system' },
    { name: "Explore the British Museum", description: "Discover world treasures like the Rosetta Stone and the Parthenon sculptures in this vast museum.", location: "London, UK", duration: 4, dataAiHint: "british museum", createdBy: 'system' },
    { name: "Ride the London Eye", description: "Get a bird's-eye view of the city's famous landmarks from a giant Ferris wheel on the South Bank.", location: "London, UK", duration: 1, dataAiHint: "london eye", createdBy: 'system' },
    { name: "Wander Through Borough Market", description: "Sample artisanal foods, fresh produce, and street food from around the world at this historic market.", location: "London, UK", duration: 2, dataAiHint: "food market", createdBy: 'system' },
    { name: "See a Show in the West End", description: "Catch a world-famous musical or play in London's renowned theatre district.", location: "London, UK", duration: 3, dataAiHint: "west end", createdBy: 'system' },
];

const parisActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Visit the Louvre Museum", description: "Home to the Mona Lisa and Venus de Milo, explore one of the world's largest and most famous art museums.", location: "Paris, France", duration: 4, dataAiHint: "louvre museum", createdBy: 'system' },
    { name: "Climb the Eiffel Tower", description: "Ascend the iconic landmark for breathtaking panoramic views of the City of Lights.", location: "Paris, France", duration: 2.5, dataAiHint: "eiffel tower", createdBy: 'system' },
    { name: "Stroll Through Montmartre", description: "Discover the artistic soul of Paris in this charming hilltop neighborhood, home to the Sacré-Cœur Basilica.", location: "Paris, France", duration: 3, dataAiHint: "montmartre paris", createdBy: 'system' },
    { name: "Take a Seine River Cruise", description: "See Paris's most famous monuments from a different perspective on a relaxing boat tour.", location: "Paris, France", duration: 1.5, dataAiHint: "seine river", createdBy: 'system' },
    { name: "Indulge in a Patisserie Tour", description: "Sample exquisite pastries, macarons, and chocolates from some of the city's finest bakeries.", location: "Paris, France", duration: 2, dataAiHint: "paris pastry", createdBy: 'system' },
];

const tokyoActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Cross Shibuya Crossing", description: "Experience the world's busiest intersection, a mesmerizing scramble of people and neon lights.", location: "Tokyo, Japan", duration: 1, dataAiHint: "shibuya crossing", createdBy: 'system' },
    { name: "Visit Senso-ji Temple", description: "Explore Tokyo's oldest temple in the historic Asakusa district, with its vibrant Nakamise-dori market street.", location: "Tokyo, Japan", duration: 2, dataAiHint: "tokyo temple", createdBy: 'system' },
    { name: "Explore Akihabara Electric Town", description: "Dive into the heart of anime, manga, and gaming culture with endless electronics stores and themed cafes.", location: "Tokyo, Japan", duration: 3, dataAiHint: "akihabara tokyo", createdBy: 'system' },
    { name: "Dine at a Themed Cafe", description: "From robots to ninjas to cartoon characters, enjoy a uniquely Japanese dining experience.", location: "Tokyo, Japan", duration: 2, dataAiHint: "themed cafe", createdBy: 'system' },
    { name: "Enjoy Views from the Tokyo Skytree", description: "Get a stunning 360-degree view of the vast Tokyo metropolis from one of the world's tallest towers.", location: "Tokyo, Japan", duration: 2, dataAiHint: "tokyo skytree", createdBy: 'system' },
];

const sydneyActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Tour the Sydney Opera House", description: "Go behind the scenes of this architectural masterpiece and learn about its history and performances.", location: "Sydney, Australia", duration: 1.5, dataAiHint: "sydney opera", createdBy: 'system' },
    { name: "Walk from Bondi to Coogee", description: "Take the stunning coastal walk, passing beautiful beaches, cliffs, and rock pools along the way.", location: "Sydney, Australia", duration: 2.5, dataAiHint: "bondi beach", createdBy: 'system' },
    { name: "Climb the Sydney Harbour Bridge", description: "For the adventurous, climb to the summit of the iconic bridge for unforgettable views of the harbour.", location: "Sydney, Australia", duration: 3.5, dataAiHint: "harbour bridge", createdBy: 'system' },
    { name: "Explore The Rocks", description: "Wander through the historic cobblestone laneways, enjoy pubs, galleries, and weekend markets.", location: "Sydney, Australia", duration: 2, dataAiHint: "sydney rocks", createdBy: 'system' },
    { name: "Take a Ferry to Manly Beach", description: "Enjoy a scenic ferry ride across the harbour and relax or learn to surf at this famous beach.", location: "Sydney, Australia", duration: 4, dataAiHint: "manly beach", createdBy: 'system' },
];

const romeActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Tour the Colosseum", description: "Step back in time at the ancient amphitheater, imagining gladiatorial contests and public spectacles.", location: "Rome, Italy", duration: 3, dataAiHint: "colosseum rome", createdBy: 'system' },
    { name: "Explore the Roman Forum and Palatine Hill", description: "Wander through the ruins of the heart of ancient Rome, the center of public life.", location: "Rome, Italy", duration: 3, dataAiHint: "roman forum", createdBy: 'system' },
    { name: "Visit Vatican City", description: "Marvel at St. Peter's Basilica, explore the Vatican Museums, and gaze at Michelangelo's Sistine Chapel ceiling.", location: "Rome, Italy", duration: 5, dataAiHint: "vatican city", createdBy: 'system' },
    { name: "Toss a Coin in the Trevi Fountain", description: "Make a wish at the world's most famous fountain, a masterpiece of Baroque art.", location: "Rome, Italy", duration: 0.5, dataAiHint: "trevi fountain", createdBy: 'system' },
    { name: "Take a Roman Cooking Class", description: "Learn the secrets of Italian cuisine by making fresh pasta or pizza from scratch.", location: "Rome, Italy", duration: 4, dataAiHint: "pasta cooking", createdBy: 'system' },
];

const berlinActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Walk Along the East Side Gallery", description: "See the longest remaining section of the Berlin Wall, now an open-air gallery of murals.", location: "Berlin, Germany", duration: 1.5, dataAiHint: "berlin wall", createdBy: 'system' },
    { name: "Visit the Brandenburg Gate", description: "Witness the iconic symbol of German reunification and a monument to peace.", location: "Berlin, Germany", duration: 0.5, dataAiHint: "brandenburg gate", createdBy: 'system' },
    { name: "Explore Museum Island", description: "Discover a complex of five world-renowned museums, a UNESCO World Heritage site.", location: "Berlin, Germany", duration: 4, dataAiHint: "berlin museum", createdBy: 'system' },
    { name: "Ascend the Reichstag Dome", description: "Enjoy panoramic views of Berlin from the glass dome of the German parliament building.", location: "Berlin, Germany", duration: 1.5, dataAiHint: "reichstag dome", createdBy: 'system' },
    { name: "Experience Berlin's Nightlife", description: "Explore the legendary club scene in districts like Kreuzberg or Friedrichshain.", location: "Berlin, Germany", duration: 5, dataAiHint: "berlin nightlife", createdBy: 'system' },
];

const munichActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Stroll Through the English Garden", description: "Relax in one of the world's largest urban parks, watch surfers on the Eisbach river, and visit a beer garden.", location: "Munich, Germany", duration: 3, dataAiHint: "english garden", createdBy: 'system' },
    { name: "Visit a Traditional Beer Hall", description: "Experience Bavarian culture with a stein of beer and traditional food at the famous Hofbräuhaus.", location: "Munich, Germany", duration: 2, dataAiHint: "munich beer", createdBy: 'system' },
    { name: "Explore Marienplatz and the Glockenspiel", description: "Witness the famous animated clock tower in the heart of Munich's old town.", location: "Munich, Germany", duration: 1, dataAiHint: "marienplatz munich", createdBy: 'system' },
    { name: "Tour the Deutsches Museum", description: "Discover one of the world's oldest and largest science and technology museums.", location: "Munich, Germany", duration: 4, dataAiHint: "science museum", createdBy: 'system' },
    { name: "Day Trip to Neuschwanstein Castle", description: "Visit the fairytale castle that inspired Disney, nestled in the stunning Bavarian Alps.", location: "Munich, Germany", duration: 8, dataAiHint: "neuschwanstein castle", createdBy: 'system' },
];

const losAngelesActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Hike to the Hollywood Sign", description: "Get an up-close look at the iconic sign and enjoy spectacular views of the city.", location: "Los Angeles, USA", duration: 3, dataAiHint: "hollywood sign", createdBy: 'system' },
    { name: "Visit Griffith Observatory", description: "Explore exhibits, look through telescopes, and enjoy stunning views of the city and the Hollywood Sign.", location: "Los Angeles, USA", duration: 2.5, dataAiHint: "griffith observatory", createdBy: 'system' },
    { name: "Stroll along Santa Monica Pier", description: "Enjoy the amusement park, aquarium, and beautiful ocean views on this historic pier.", location: "Los Angeles, USA", duration: 2, dataAiHint: "santa monica", createdBy: 'system' },
    { name: "Explore Venice Beach Boardwalk", description: "Experience the eclectic vibe with street performers, skate parks, and unique shops.", location: "Los Angeles, USA", duration: 2, dataAiHint: "venice beach", createdBy: 'system' },
    { name: "Tour Warner Bros. Studio", description: "Go behind the scenes of your favorite movies and TV shows at a working Hollywood studio.", location: "Los Angeles, USA", duration: 3.5, dataAiHint: "movie studio", createdBy: 'system' },
];

const chicagoActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Visit Millennium Park & The Bean", description: "Take a photo with the iconic Cloud Gate sculpture and enjoy the park's art and gardens.", location: "Chicago, USA", duration: 1.5, dataAiHint: "chicago bean", createdBy: 'system' },
    { name: "Chicago Architecture River Cruise", description: "Learn about the city's famous skyscrapers and architectural history from a boat on the Chicago River.", location: "Chicago, USA", duration: 1.5, dataAiHint: "chicago architecture", createdBy: 'system' },
    { name: "Explore the Art Institute of Chicago", description: "View masterpieces like 'American Gothic' and works by Monet, Picasso, and more.", location: "Chicago, USA", duration: 3.5, dataAiHint: "art institute", createdBy: 'system' },
    { name: "Go to the Top of Willis Tower", description: "Step out onto The Ledge, a glass balcony offering thrilling views from 103 floors up.", location: "Chicago, USA", duration: 2, dataAiHint: "willis tower", createdBy: 'system' },
    { name: "Eat Deep-Dish Pizza", description: "Indulge in Chicago's most famous culinary creation at one of the city's legendary pizzerias.", location: "Chicago, USA", duration: 1.5, dataAiHint: "deep-dish pizza", createdBy: 'system' },
];

const torontoActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Go Up the CN Tower", description: "Enjoy breathtaking views of the city and Lake Ontario from the observation decks of this iconic tower.", location: "Toronto, Canada", duration: 2, dataAiHint: "cn tower", createdBy: 'system' },
    { name: "Explore the Distillery District", description: "Wander through beautifully restored Victorian industrial architecture, now home to boutiques, galleries, and cafes.", location: "Toronto, Canada", duration: 2.5, dataAiHint: "distillery district", createdBy: 'system' },
    { name: "Visit the Royal Ontario Museum", description: "Discover art, world culture, and natural history in Canada's largest museum.", location: "Toronto, Canada", duration: 3.5, dataAiHint: "ontario museum", createdBy: 'system' },
    { name: "Take a Ferry to the Toronto Islands", description: "Escape the city for beautiful parks, beaches, and stunning skyline views.", location: "Toronto, Canada", duration: 4, dataAiHint: "toronto islands", createdBy: 'system' },
    { name: "Shop and Eat at St. Lawrence Market", description: "Explore one of the world's best food markets, packed with local produce, artisanal cheeses, and delicious prepared foods.", location: "Toronto, Canada", duration: 2, dataAiHint: "food market", createdBy: 'system' },
];

const vancouverActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Explore Stanley Park", description: "Cycle or walk the famous Seawall, visit the totem poles, and enjoy the lush rainforest scenery.", location: "Vancouver, Canada", duration: 3.5, dataAiHint: "stanley park", createdBy: 'system' },
    { name: "Visit Granville Island Market", description: "A bustling hub for local artisans, fresh food, and street performers, accessible by a cute aquabus.", location: "Vancouver, Canada", duration: 3, dataAiHint: "granville island", createdBy: 'system' },
    { name: "Walk Across the Capilano Suspension Bridge", description: "Experience a thrilling walk high above the Capilano River, followed by a Treetops Adventure.", location: "Vancouver, Canada", duration: 3, dataAiHint: "suspension bridge", createdBy: 'system' },
    { name: "Hike the Grouse Grind", description: "Challenge yourself with a steep hike up Grouse Mountain, famously known as 'Mother Nature's Stairmaster'.", location: "Vancouver, Canada", duration: 3, dataAiHint: "grouse mountain", createdBy: 'system' },
    { name: "Go Whale Watching", description: "Take a tour from Vancouver to see majestic orcas, humpback whales, and other marine wildlife in their natural habitat.", location: "Vancouver, Canada", duration: 4, dataAiHint: "whale watching", createdBy: 'system' },
];

const madridActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Explore the Prado Museum", description: "Discover one of the world's greatest art collections, with masterpieces by Goya, Velázquez, and El Greco.", location: "Madrid, Spain", duration: 3.5, dataAiHint: "prado museum", createdBy: 'system' },
    { name: "Relax in Retiro Park", description: "Rent a rowboat on the lake, visit the Crystal Palace, and enjoy the beautiful gardens of this central park.", location: "Madrid, Spain", duration: 2.5, dataAiHint: "retiro park", createdBy: 'system' },
    { name: "Visit the Royal Palace of Madrid", description: "Tour the opulent rooms of the official residence of the Spanish Royal Family.", location: "Madrid, Spain", duration: 2.5, dataAiHint: "royal palace", createdBy: 'system' },
    { name: "Experience a Flamenco Show", description: "Feel the passion and energy of Spain's most famous dance form at an authentic tablao.", location: "Madrid, Spain", duration: 2, dataAiHint: "flamenco show", createdBy: 'system' },
    { name: "Go on a Tapas Tour", description: "Hop between traditional bars in neighborhoods like La Latina, sampling a variety of delicious Spanish small plates.", location: "Madrid, Spain", duration: 3, dataAiHint: "madrid tapas", createdBy: 'system' },
];

const barcelonaActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Marvel at La Sagrada Família", description: "Explore Gaudí's unfinished masterpiece, a breathtaking basilica unlike any other.", location: "Barcelona, Spain", duration: 2.5, dataAiHint: "sagrada familia", createdBy: 'system' },
    { name: "Wander Through the Gothic Quarter", description: "Get lost in the narrow, medieval streets of Barcelona's oldest neighborhood.", location: "Barcelona, Spain", duration: 3, dataAiHint: "gothic quarter", createdBy: 'system' },
    { name: "Explore Park Güell", description: "Enjoy whimsical architecture and beautiful mosaics in this colorful public park designed by Gaudí.", location: "Barcelona, Spain", duration: 2.5, dataAiHint: "park guell", createdBy: 'system' },
    { name: "Stroll Down La Rambla", description: "Experience the vibrant atmosphere of Barcelona's most famous street, leading to the Boqueria Market.", location: "Barcelona, Spain", duration: 2, dataAiHint: "la rambla", createdBy: 'system' },
    { name: "Relax at Barceloneta Beach", description: "Enjoy the sun, sea, and sand at the city's most popular beach.", location: "Barcelona, Spain", duration: 3, dataAiHint: "barcelona beach", createdBy: 'system' },
];

const amsterdamActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Visit the Anne Frank House", description: "A poignant and powerful experience, visit the secret annex where Anne Frank and her family hid.", location: "Amsterdam, Netherlands", duration: 2, dataAiHint: "anne frank", createdBy: 'system' },
    { name: "Explore the Rijksmuseum", description: "See masterpieces by Rembrandt, Vermeer, and other Dutch masters, including 'The Night Watch'.", location: "Amsterdam, Netherlands", duration: 3.5, dataAiHint: "rijksmuseum amsterdam", createdBy: 'system' },
    { name: "Take a Canal Cruise", description: "See the city's iconic gabled houses and historic bridges from the water.", location: "Amsterdam, Netherlands", duration: 1.5, dataAiHint: "amsterdam canal", createdBy: 'system' },
    { name: "Visit the Van Gogh Museum", description: "Immerse yourself in the world's largest collection of works by Vincent van Gogh.", location: "Amsterdam, Netherlands", duration: 2.5, dataAiHint: "van gogh", createdBy: 'system' },
    { name: "Rent a Bike and Explore", description: "Experience Amsterdam like a local by cycling through its charming streets and along the canals.", location: "Amsterdam, Netherlands", duration: 3, dataAiHint: "amsterdam bike", createdBy: 'system' },
];

const singaporeActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Explore Gardens by the Bay", description: "Wander through the futuristic Supertree Grove and explore the stunning Cloud Forest and Flower Dome.", location: "Singapore, Singapore", duration: 4, dataAiHint: "gardens bay", createdBy: 'system' },
    { name: "Dine at a Hawker Centre", description: "Experience Singapore's diverse food culture by sampling delicious and affordable dishes at a bustling hawker centre.", location: "Singapore, Singapore", duration: 1.5, dataAiHint: "hawker food", createdBy: 'system' },
    { name: "Visit the Marina Bay Sands Skypark", description: "Enjoy spectacular 360-degree views of the city's skyline from the top of this iconic building.", location: "Singapore, Singapore", duration: 1.5, dataAiHint: "marina bay", createdBy: 'system' },
    { name: "Walk Through the Singapore Botanic Gardens", description: "Explore the lush greenery and the stunning National Orchid Garden in this UNESCO World Heritage Site.", location: "Singapore, Singapore", duration: 2.5, dataAiHint: "botanic gardens", createdBy: 'system' },
    { name: "Experience the Night Safari", description: "See nocturnal animals in their naturalistic habitats at the world's first nocturnal zoo.", location: "Singapore, Singapore", duration: 3.5, dataAiHint: "night safari", createdBy: 'system' },
];

const hongKongActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Take the Tram to Victoria Peak", description: "Ride the historic Peak Tram for stunning panoramic views of Hong Kong's skyline and harbor.", location: "Hong Kong, China", duration: 2.5, dataAiHint: "victoria peak", createdBy: 'system' },
    { name: "Ride the Star Ferry", description: "Enjoy one of the world's most scenic ferry rides, crossing Victoria Harbour between Hong Kong Island and Kowloon.", location: "Hong Kong, China", duration: 0.5, dataAiHint: "star ferry", createdBy: 'system' },
    { name: "Explore Temple Street Night Market", description: "Bargain for goods, sample street food, and soak in the lively atmosphere of this famous night market.", location: "Hong Kong, China", duration: 2, dataAiHint: "night market", createdBy: 'system' },
    { name: "Visit the Big Buddha and Po Lin Monastery", description: "Take a cable car up to see the giant Tian Tan Buddha statue on Lantau Island.", location: "Hong Kong, China", duration: 5, dataAiHint: "big buddha", createdBy: 'system' },
    { name: "Hike the Dragon's Back Trail", description: "Enjoy a relatively easy hike with spectacular views of the coastline and surrounding islands.", location: "Hong Kong, China", duration: 3, dataAiHint: "dragon back", createdBy: 'system' },
];

const dubaiActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Visit the Top of Burj Khalifa", description: "Ascend the world's tallest building for breathtaking views of the city, desert, and ocean.", location: "Dubai, UAE", duration: 2, dataAiHint: "burj khalifa", createdBy: 'system' },
    { name: "Go on a Desert Safari", description: "Experience dune bashing in a 4x4, ride a camel, and enjoy a traditional Bedouin-style dinner under the stars.", location: "Dubai, UAE", duration: 6, dataAiHint: "desert safari", createdBy: 'system' },
    { name: "Explore the Dubai Mall", description: "Shop at one of the world's largest malls, see the Dubai Aquarium, and watch the Dubai Fountain show.", location: "Dubai, UAE", duration: 4, dataAiHint: "dubai mall", createdBy: 'system' },
    { name: "Wander Through the Gold and Spice Souks", description: "Experience traditional Arabian markets in Deira, browsing intricate jewelry and aromatic spices.", location: "Dubai, UAE", duration: 2, dataAiHint: "dubai souk", createdBy: 'system' },
    { name: "Relax at Jumeirah Public Beach", description: "Enjoy the sun and get a classic photo with the iconic Burj Al Arab hotel in the background.", location: "Dubai, UAE", duration: 3, dataAiHint: "dubai beach", createdBy: 'system' },
];

const bangkokActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Visit the Grand Palace and Wat Phra Kaew", description: "Marvel at the opulent architecture and the sacred Emerald Buddha at this iconic landmark.", location: "Bangkok, Thailand", duration: 3, dataAiHint: "grand palace", createdBy: 'system' },
    { name: "Explore Wat Arun (Temple of Dawn)", description: "Climb the central prang of this stunning riverside temple for beautiful views, especially at sunset.", location: "Bangkok, Thailand", duration: 1.5, dataAiHint: "wat arun", createdBy: 'system' },
    { name: "Take a Long-tail Boat Tour on the Canals", description: "Discover a different side of Bangkok by exploring the 'khlongs' (canals) of Thonburi.", location: "Bangkok, Thailand", duration: 2, dataAiHint: "bangkok boat", createdBy: 'system' },
    { name: "Shop at Chatuchak Weekend Market", description: "Get lost in one of the world's largest outdoor markets, with thousands of stalls selling everything imaginable.", location: "Bangkok, Thailand", duration: 4, dataAiHint: "chatuchak market", createdBy: 'system' },
    { name: "Enjoy the Street Food at Yaowarat (Chinatown)", description: "Experience the vibrant and delicious street food scene in Bangkok's bustling Chinatown.", location: "Bangkok, Thailand", duration: 2.5, dataAiHint: "bangkok streetfood", createdBy: 'system' },
];

const seoulActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Visit Gyeongbokgung Palace", description: "Explore the largest of the Five Grand Palaces built during the Joseon Dynasty.", location: "Seoul, South Korea", duration: 3, dataAiHint: "gyeongbokgung palace", createdBy: 'system' },
    { name: "Stroll Through Bukchon Hanok Village", description: "Wander through a traditional Korean village with beautifully preserved hanok houses.", location: "Seoul, South Korea", duration: 2, dataAiHint: "hanok village", createdBy: 'system' },
    { name: "Go Up N Seoul Tower", description: "Enjoy panoramic views of the city from Namsan Mountain and leave a 'love lock' on the terrace.", location: "Seoul, South Korea", duration: 2.5, dataAiHint: "n seoul tower", createdBy: 'system' },
    { name: "Shop and Eat in Myeongdong", description: "Experience Seoul's busiest shopping district, famous for cosmetics, fashion, and street food.", location: "Seoul, South Korea", duration: 3, dataAiHint: "myeongdong shopping", createdBy: 'system' },
    { name: "Visit the DMZ (Demilitarized Zone)", description: "Take a guided tour to the border between North and South Korea for a unique historical and political experience.", location: "Seoul, South Korea", duration: 6, dataAiHint: "korea dmz", createdBy: 'system' },
];

const allActivities = [
    ...viennaActivities, ...villachActivities, ...newYorkActivities, ...londonActivities, ...parisActivities, ...tokyoActivities,
    ...sydneyActivities, ...romeActivities, ...berlinActivities, ...munichActivities, ...losAngelesActivities, ...chicagoActivities,
    ...torontoActivities, ...vancouverActivities, ...madridActivities, ...barcelonaActivities, ...amsterdamActivities,
    ...singaporeActivities, ...hongKongActivities, ...dubaiActivities, ...bangkokActivities, ...seoulActivities
];
const SEED_FLAG_VERSION = 'v7_all_cities';

async function seedDatabase() {
  if (!isFirebaseInitialized) {
    console.error("Firebase not initialized. Cannot seed database. Please check your .env file.");
    process.exit(1);
  }

  const flagRef = firestore.collection('_internal').doc(SEED_FLAG_VERSION);
  const flagDoc = await flagRef.get();

  if (flagDoc.exists) {
      console.log(`Database has already been seeded with version: ${SEED_FLAG_VERSION}. Halting.`);
      return;
  }
  
  console.log(`Starting database seed (version: ${SEED_FLAG_VERSION})...`);
  
  console.log("Deleting all old system-generated activities to ensure a clean slate...");
  const activitiesCollection = firestore.collection('activities');
  const query = activitiesCollection.where('createdBy', '==', 'system');
  
  await new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });

  const writeBatch = firestore.batch();
  let successCount = 0;

  for (const activityData of allActivities) {
    let imageUrl: string;
    try {
        console.log(` -> Generating AI image for "${activityData.name}"...`);
        imageUrl = await generateAndStoreActivityImage(
            activityData.name,
            activityData.location,
            activityData.dataAiHint
        );
    } catch(e) {
        console.warn(` -> Failed to generate AI image for "${activityData.name}". Falling back to placeholder.`);
        imageUrl = `https://placehold.co/400x250.png`;
    }

    let enhancedDetails = {};
    try {
        console.log(` -> Generating AI description for "${activityData.name}"...`);
        enhancedDetails = await generateActivityDescription({
            activityName: activityData.name,
            location: activityData.location,
        });
    } catch(e) {
        console.warn(` -> Failed to generate AI description for "${activityData.name}".`);
    }

    const docRef = activitiesCollection.doc();
    const newActivity: Activity = {
        ...(activityData as Omit<Activity, 'id'>),
        ...enhancedDetails,
        id: docRef.id,
        imageUrls: [imageUrl],
        modules: ['couples', 'friends', 'meet'],
        createdBy: 'system',
        likes: 0,
        dislikes: 0,
    };
    writeBatch.set(docRef, newActivity);
    successCount++;
    console.log(` -> Queued "${activityData.name}" for creation.`);
  }

  if (successCount > 0) {
      console.log(`Committing ${successCount} new activities to the database...`);
      await writeBatch.commit();
      console.log(`Successfully added ${successCount} new activities.`);
  } else {
      console.log("No new activities were processed to commit.");
  }
  
  await flagRef.set({ seededAt: new Date().toISOString(), version: SEED_FLAG_VERSION });
  
  console.log("Database seeding complete.");
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: (value: unknown) => void, reject: (reason?: any) => void) {
    const snapshot = await query.limit(500).get();
  
    if (snapshot.size === 0) {
      console.log("No more old system activities to delete.");
      resolve(true);
      return;
    }
  
    const batch = firestore.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
  
    await batch.commit();
    console.log(`Deleted a batch of ${snapshot.size} old activities.`);
  
    process.nextTick(() => {
      deleteQueryBatch(query, resolve, reject);
    });
}

seedDatabase().catch(error => {
  console.error('Seeding script failed with a critical error:', error);
  process.exit(1);
});
