const STATIC_POOLS = {
    masterpieces: [
        { id: 6000, title: "The Godfather" },
        { id: 6001, title: "The Dark Knight" }
    ]
};
const movieId = 6001;
let movie = null;
for (const poolKey of Object.keys(STATIC_POOLS)) {
    const found = STATIC_POOLS[poolKey].find(m => m.id === movieId);
    if (found) {
        console.log("Found in pool:", poolKey);
        movie = found;
        break;
    }
}
if (!movie) console.log("Not found");
else console.log("Movie:", movie.title);
