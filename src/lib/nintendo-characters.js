/**
 * List of popular Nintendo characters for test user generation
 * Organized by franchise for easy maintenance
 */
const nintendoCharacters = [
    // Mario franchise
    { name: "Mario", franchise: "Mario" },
    { name: "Luigi", franchise: "Mario" },
    { name: "Princess Peach", franchise: "Mario" },
    { name: "Bowser", franchise: "Mario" },
    { name: "Yoshi", franchise: "Mario" },
    { name: "Toad", franchise: "Mario" },
    { name: "Wario", franchise: "Mario" },
    { name: "Waluigi", franchise: "Mario" },
    { name: "Daisy", franchise: "Mario" },
    { name: "Rosalina", franchise: "Mario" },
    { name: "Donkey Kong", franchise: "Mario" },
    { name: "Diddy Kong", franchise: "Mario" },
    { name: "Birdo", franchise: "Mario" },
    { name: "Bowser Jr", franchise: "Mario" },
    { name: "Kamek", franchise: "Mario" },
    { name: "Shy Guy", franchise: "Mario" },
    { name: "Boo", franchise: "Mario" },
    { name: "Goomba", franchise: "Mario" },
    { name: "Koopa Troopa", franchise: "Mario" },
    { name: "Toadette", franchise: "Mario" },

    // Zelda franchise
    { name: "Link", franchise: "Zelda" },
    { name: "Zelda", franchise: "Zelda" },
    { name: "Ganondorf", franchise: "Zelda" },
    { name: "Impa", franchise: "Zelda" },
    { name: "Mipha", franchise: "Zelda" },
    { name: "Revali", franchise: "Zelda" },
    { name: "Urbosa", franchise: "Zelda" },
    { name: "Daruk", franchise: "Zelda" },
    { name: "Sidon", franchise: "Zelda" },
    { name: "Tingle", franchise: "Zelda" },
    { name: "Midna", franchise: "Zelda" },
    { name: "Skull Kid", franchise: "Zelda" },
    { name: "Sheik", franchise: "Zelda" },
    { name: "Tetra", franchise: "Zelda" },
    { name: "Riju", franchise: "Zelda" },

    // Pokémon franchise
    { name: "Pikachu", franchise: "Pokémon" },
    { name: "Charizard", franchise: "Pokémon" },
    { name: "Mewtwo", franchise: "Pokémon" },
    { name: "Jigglypuff", franchise: "Pokémon" },
    { name: "Eevee", franchise: "Pokémon" },
    { name: "Lucario", franchise: "Pokémon" },
    { name: "Greninja", franchise: "Pokémon" },
    { name: "Snorlax", franchise: "Pokémon" },
    { name: "Bulbasaur", franchise: "Pokémon" },
    { name: "Squirtle", franchise: "Pokémon" },
    { name: "Charmander", franchise: "Pokémon" },
    { name: "Meowth", franchise: "Pokémon" },
    { name: "Gengar", franchise: "Pokémon" },
    { name: "Gyarados", franchise: "Pokémon" },
    { name: "Gardevoir", franchise: "Pokémon" },

    // Animal Crossing
    { name: "Isabelle", franchise: "Animal Crossing" },
    { name: "Tom Nook", franchise: "Animal Crossing" },
    { name: "K.K. Slider", franchise: "Animal Crossing" },
    { name: "Blathers", franchise: "Animal Crossing" },
    { name: "Celeste", franchise: "Animal Crossing" },
    { name: "Timmy", franchise: "Animal Crossing" },
    { name: "Tommy", franchise: "Animal Crossing" },
    { name: "Mabel", franchise: "Animal Crossing" },
    { name: "Sable", franchise: "Animal Crossing" },
    { name: "Gulliver", franchise: "Animal Crossing" },

    // Splatoon
    { name: "Inkling", franchise: "Splatoon" },
    { name: "Octoling", franchise: "Splatoon" },
    { name: "Callie", franchise: "Splatoon" },
    { name: "Marie", franchise: "Splatoon" },
    { name: "Pearl", franchise: "Splatoon" },
    { name: "Marina", franchise: "Splatoon" },

    // Metroid
    { name: "Samus", franchise: "Metroid" },
    { name: "Ridley", franchise: "Metroid" },
    { name: "Dark Samus", franchise: "Metroid" },

    // Star Fox
    { name: "Fox", franchise: "Star Fox" },
    { name: "Falco", franchise: "Star Fox" },
    { name: "Wolf", franchise: "Star Fox" },
    { name: "Slippy", franchise: "Star Fox" },
    { name: "Peppy", franchise: "Star Fox" },

    // Fire Emblem
    { name: "Marth", franchise: "Fire Emblem" },
    { name: "Roy", franchise: "Fire Emblem" },
    { name: "Ike", franchise: "Fire Emblem" },
    { name: "Lucina", franchise: "Fire Emblem" },
    { name: "Robin", franchise: "Fire Emblem" },
    { name: "Byleth", franchise: "Fire Emblem" },
    { name: "Corrin", franchise: "Fire Emblem" },

    // Kirby
    { name: "Kirby", franchise: "Kirby" },
    { name: "King Dedede", franchise: "Kirby" },
    { name: "Meta Knight", franchise: "Kirby" },
    { name: "Waddle Dee", franchise: "Kirby" },

    // Miscellaneous
    { name: "Captain Falcon", franchise: "F-Zero" },
    { name: "Olimar", franchise: "Pikmin" },
    { name: "Villager", franchise: "Animal Crossing" },
    { name: "Wii Fit Trainer", franchise: "Wii Fit" },
    { name: "Little Mac", franchise: "Punch-Out!!" },
    { name: "Shulk", franchise: "Xenoblade" },
    { name: "Pit", franchise: "Kid Icarus" },
    { name: "Palutena", franchise: "Kid Icarus" },
    { name: "Ice Climbers", franchise: "Ice Climber" },
    { name: "Mr. Game & Watch", franchise: "Game & Watch" },
    { name: "R.O.B.", franchise: "R.O.B." },
    { name: "Duck Hunt", franchise: "Duck Hunt" },
    { name: "Min Min", franchise: "ARMS" },
    { name: "Spring Man", franchise: "ARMS" },
    { name: "Ribbon Girl", franchise: "ARMS" },
];

/**
 * Get a random Nintendo character
 * @returns {Object} A character object with name and franchise
 */
export function getRandomCharacter() {
    const randomIndex = Math.floor(Math.random() * nintendoCharacters.length);
    return nintendoCharacters[randomIndex];
}

/**
 * Get multiple random Nintendo characters
 * @param {number} count - Number of characters to get
 * @param {boolean} unique - Whether characters should be unique
 * @returns {Array} Array of character objects
 */
export function getRandomCharacters(count, unique = true) {
    if (!unique) {
        return Array.from({ length: count }, () => getRandomCharacter());
    }

    // For unique characters
    const shuffled = [...nintendoCharacters].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, nintendoCharacters.length));
}

export default nintendoCharacters; 