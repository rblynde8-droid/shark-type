export const passages = [
  "The ocean whispers ancient secrets to those who dare to listen beneath the waves. Sunlight filters through the blue depths, casting dancing shadows on the coral below. Fish dart between the swaying anemones, their scales shimmering like scattered coins.",

  "A lone shark glides through the midnight waters, its grey form barely visible in the inky dark. The ocean floor stretches endlessly below, littered with the bones of sunken ships and forgotten treasure chests from centuries past.",

  "Waves crash against the rocky shore with tremendous force, sending white foam high into the salty air. The tide pulls back to reveal tide pools teeming with crabs, starfish, and tiny translucent shrimp hiding beneath smooth stones.",

  "Deep beneath the surface, bioluminescent creatures light up the ocean like a living constellation. Anglerfish dangle their glowing lures, jellyfish pulse with soft blue light, and entire schools of fish flash in unison when startled.",

  "The coral reef is a city beneath the sea, bustling with activity from dawn until dusk. Parrotfish nibble at coral branches while moray eels peer from rocky crevices, their jaws opening and closing in silent rhythm with the current.",

  "Sailors once feared the kraken, a mythical beast said to drag entire ships beneath the waves with its massive tentacles. Today we know the ocean is home to giant squid, creatures that can grow longer than a school bus.",

  "Sea turtles navigate the vast Pacific using the Earth's magnetic field as a compass, returning to the exact beach where they hatched decades before. They glide effortlessly through the water, ancient and patient as the ocean itself.",

  "The humpback whale sings a haunting melody that travels hundreds of miles through the deep ocean. Its song changes each season as other whales add new phrases, creating a living symphony that spans entire ocean basins.",

  "Storm waves can tower thirty meters high in the open ocean, massive walls of dark green water moving at incredible speed. Sailors who witness these rogue waves describe them as mountains rising suddenly from a flat sea.",

  "The Mariana Trench plunges nearly eleven kilometers below the ocean surface, deeper than Mount Everest is tall. Strange pale creatures without eyes drift through the crushing darkness, feeding on the snow of organic particles that falls from above.",

  "Dolphins communicate using a complex system of clicks, whistles, and body language that researchers are still struggling to decode. They work together to herd fish into tight balls near the surface where each dolphin takes turns feeding.",

  "The tidal bore rushes upriver twice each day in the Bay of Fundy, a wall of water that can reach five meters high. Surfers travel from around the world to ride this rare phenomenon, which reverses the flow of the entire river.",
];

export function getRandomPassage() {
  return passages[Math.floor(Math.random() * passages.length)];
}
