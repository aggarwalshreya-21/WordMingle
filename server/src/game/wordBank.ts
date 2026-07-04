import type { WordPair } from '../rooms/types.js';

// Each genre maps to a list of related word pairs. The group shares `main`;
// the odd player secretly gets `odd`. Pairs are intentionally close so the
// odd player can bluff, but distinct enough to be caught by sharp clues.
export const WORD_BANK: Record<string, WordPair[]> = {
  Animals: [
    { main: 'Elephant', odd: 'Giraffe' },
    { main: 'Lion', odd: 'Tiger' },
    { main: 'Dolphin', odd: 'Shark' },
    { main: 'Owl', odd: 'Eagle' },
    { main: 'Frog', odd: 'Toad' },
    { main: 'Rabbit', odd: 'Hare' },
    { main: 'Crocodile', odd: 'Alligator' },
    { main: 'Wolf', odd: 'Fox' },
    { main: 'Horse', odd: 'Donkey' },
    { main: 'Penguin', odd: 'Seal' },
    { main: 'Bee', odd: 'Wasp' },
    { main: 'Camel', odd: 'Llama' },
  ],
  Movies: [
    { main: 'Titanic', odd: 'Avatar' },
    { main: 'Inception', odd: 'Interstellar' },
    { main: 'Jaws', odd: 'Alien' },
    { main: 'Frozen', odd: 'Tangled' },
    { main: 'Avengers', odd: 'Justice League' },
    { main: 'Star Wars', odd: 'Star Trek' },
    { main: 'Toy Story', odd: 'Shrek' },
    { main: 'The Matrix', odd: 'Blade Runner' },
    { main: 'Harry Potter', odd: 'Lord of the Rings' },
    { main: 'Jurassic Park', odd: 'King Kong' },
  ],
  'Food & Drinks': [
    { main: 'Pizza', odd: 'Pasta' },
    { main: 'Coffee', odd: 'Tea' },
    { main: 'Burger', odd: 'Sandwich' },
    { main: 'Ice Cream', odd: 'Yogurt' },
    { main: 'Pancake', odd: 'Waffle' },
    { main: 'Sushi', odd: 'Dumpling' },
    { main: 'Fries', odd: 'Chips' },
    { main: 'Chocolate', odd: 'Caramel' },
    { main: 'Lemonade', odd: 'Orange Juice' },
    { main: 'Taco', odd: 'Burrito' },
    { main: 'Donut', odd: 'Bagel' },
  ],
  Sports: [
    { main: 'Soccer', odd: 'Rugby' },
    { main: 'Tennis', odd: 'Badminton' },
    { main: 'Basketball', odd: 'Volleyball' },
    { main: 'Cricket', odd: 'Baseball' },
    { main: 'Boxing', odd: 'Wrestling' },
    { main: 'Swimming', odd: 'Diving' },
    { main: 'Golf', odd: 'Hockey' },
    { main: 'Skiing', odd: 'Snowboarding' },
    { main: 'Cycling', odd: 'Skateboarding' },
    { main: 'Archery', odd: 'Darts' },
  ],
  Countries: [
    { main: 'Canada', odd: 'USA' },
    { main: 'Brazil', odd: 'Argentina' },
    { main: 'Japan', odd: 'South Korea' },
    { main: 'Italy', odd: 'Spain' },
    { main: 'Egypt', odd: 'Morocco' },
    { main: 'India', odd: 'Pakistan' },
    { main: 'Norway', odd: 'Sweden' },
    { main: 'China', odd: 'Mongolia' },
    { main: 'Australia', odd: 'New Zealand' },
    { main: 'France', odd: 'Belgium' },
  ],
  Celebrities: [
    { main: 'Beyonce', odd: 'Rihanna' },
    { main: 'Tom Cruise', odd: 'Brad Pitt' },
    { main: 'Taylor Swift', odd: 'Adele' },
    { main: 'Lionel Messi', odd: 'Cristiano Ronaldo' },
    { main: 'Dwayne Johnson', odd: 'Vin Diesel' },
    { main: 'Leonardo DiCaprio', odd: 'Matt Damon' },
    { main: 'Ariana Grande', odd: 'Selena Gomez' },
    { main: 'Elon Musk', odd: 'Jeff Bezos' },
    { main: 'Emma Watson', odd: 'Emma Stone' },
    { main: 'Drake', odd: 'Kanye West' },
  ],
  Occupations: [
    { main: 'Doctor', odd: 'Nurse' },
    { main: 'Teacher', odd: 'Professor' },
    { main: 'Chef', odd: 'Baker' },
    { main: 'Pilot', odd: 'Flight Attendant' },
    { main: 'Police Officer', odd: 'Detective' },
    { main: 'Firefighter', odd: 'Paramedic' },
    { main: 'Lawyer', odd: 'Judge' },
    { main: 'Carpenter', odd: 'Plumber' },
    { main: 'Actor', odd: 'Singer' },
    { main: 'Photographer', odd: 'Painter' },
  ],
  'Everyday Objects': [
    { main: 'Umbrella', odd: 'Raincoat' },
    { main: 'Backpack', odd: 'Suitcase' },
    { main: 'Pillow', odd: 'Blanket' },
    { main: 'Pen', odd: 'Pencil' },
    { main: 'Clock', odd: 'Watch' },
    { main: 'Spoon', odd: 'Fork' },
    { main: 'Candle', odd: 'Lantern' },
    { main: 'Mirror', odd: 'Window' },
    { main: 'Broom', odd: 'Mop' },
    { main: 'Wallet', odd: 'Purse' },
  ],
};

export const GENRES = Object.keys(WORD_BANK);

export function isValidGenre(genre: string): boolean {
  return Object.prototype.hasOwnProperty.call(WORD_BANK, genre);
}

export function randomWordPair(genre: string): WordPair {
  const pairs = WORD_BANK[genre];
  return pairs[Math.floor(Math.random() * pairs.length)];
}
