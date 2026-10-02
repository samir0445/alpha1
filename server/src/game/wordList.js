// Curated word list for Wordy - high imagery, fun to draw and guess
export const WORD_LIST = [
  "AIRPLANE", "APPLE", "ASTRONAUT", "BALLOON", "BANANA", "BASEBALL", "BATTERY", "BEACH",
  "BICYCLE", "BIRD", "BOAT", "BOOK", "BRIDGE", "BUTTERFLY", "CACTUS", "CAMERA",
  "CAMPFIRE", "CANDLE", "CAR", "CASTLE", "CAT", "CHAIR", "CHEESE", "CHERRY",
  "CLOCK", "CLOUD", "CLOWN", "COMPASS", "COOKIE", "COW", "CRAB", "CROWN",
  "CUPCAKE", "DIAMOND", "DINOSAUR", "DOG", "DOLPHIN", "DONUT", "DRAGON", "DRUM",
  "DUCK", "EARTH", "ELEPHANT", "EYES", "FEATHER", "FIRE", "FISH", "FLAG",
  "FLOWER", "FOOTBALL", "FROG", "GHOST", "GIRAFFE", "GLASSES", "GUITAR", "HAMMER",
  "HAT", "HELICOPTER", "HORSE", "HOTDOG", "HOUSE", "ICEBERG", "ICECREAM", "IGLOO",
  "ISLAND", "JELLYFISH", "KEY", "KITE", "LADDER", "LAMP", "LEAF", "LIGHTHOUSE",
  "LION", "LIZARD", "LOCK", "LOLLIPOP", "MAGNET", "MERMAID", "MICKEY", "MICROSCOPE",
  "MONKEY", "MOON", "MOUNTAIN", "MUSHROOM", "OCTOPUS", "OWL", "PAINTING", "PALMTREE",
  "PENGUIN", "PIANO", "PIG", "PIZZA", "PLANET", "PLANT", "POPCORN", "PUMPKIN",
  "RABBIT", "RAINBOW", "RING", "ROBOT", "ROCKET", "SAILBOAT", "SANDWICH", "SCARECROW",
  "SCISSORS", "SEAHORSE", "SHARK", "SHIELD", "SHIP", "SHOE", "SKATEBOARD", "SKELETON",
  "SNAKE", "SNOWMAN", "SOCCER", "SPIDER", "STAR", "STRAWBERRY", "SUN", "SUNGLASSES",
  "SWORD", "TELESCOPE", "TIGER", "TOOTHBRUSH", "TRAIN", "TREE", "TURTLE", "UMBRELLA",
  "UNICORN", "VOLCANO", "WATCH", "WATERFALL", "WATERMELON", "WHALE", "WINDMILL", "WIZARD",
  "WOLF", "ZEBRA"
];

export function getRandomWord() {
  const index = Math.floor(Math.random() * WORD_LIST.length);
  return WORD_LIST[index];
}

export function getRandomWordSuggestions(count = 3) {
  const shuffled = [...WORD_LIST].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
