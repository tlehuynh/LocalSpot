const apiKey = "aa6eab39509244e8bdc84a5dd03b1226";


const searchInput = document.getElementById("searchInput");
const locationInput = document.getElementById("locationInput");
const searchButton = document.getElementById("searchButton");
const message = document.getElementById("message");
const results = document.getElementById("results");
const favoritesList = document.getElementById("favoritesList");
const categoryButtons = document.querySelectorAll(".categories button");

let favorites = JSON.parse(localStorage.getItem("localSpotFavorites")) || [];

let selectedCategory =
    "catering.restaurant,catering.cafe,entertainment,leisure.park";

const allButton = document.querySelector(
    '[data-category="catering.restaurant,catering.cafe,entertainment,leisure.park"]'
);

if (allButton) {
    allButton.classList.add("active");
}


// Categories

categoryButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        selectedCategory = button.dataset.category;

        categoryButtons.forEach(function (btn) {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        if (locationInput.value.trim() !== "") {
            searchPlaces();
        }
    });
});


// Favorites

function saveFavorites() {
    localStorage.setItem(
        "localSpotFavorites",
        JSON.stringify(favorites)
    );
}

function isFavorite(placeId) {
    return favorites.some(function (favorite) {
        return favorite.id === placeId;
    });
}

function saveFavorite(place, website, photo) {
    const placeInfo = {
        id: place.properties.place_id,
        name: place.properties.name,
        address: place.properties.formatted || "Address unavailable",
        website: website || null,
        photo: photo || null
    };

    if (isFavorite(placeInfo.id)) {
        return;
    }

    favorites.push(placeInfo);
    saveFavorites();
    renderFavorites();
}

function createAddressLink(addressText) {
    const address = document.createElement("a");

    address.textContent = addressText;

    address.href =
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(addressText);

    address.target = "_blank";
    address.rel = "noopener noreferrer";
    address.classList.add("address-link");

    return address;
}

function renderFavorites() {
    favoritesList.innerHTML = "";

    if (favorites.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "No favorites yet.";
        favoritesList.appendChild(emptyMessage);
        return;
    }

    favorites.forEach(function (place) {
        const card = document.createElement("div");
        card.classList.add("place-card");

        if (place.photo) {
            const image = document.createElement("img");
            image.src = place.photo;
            image.alt = place.name;
            image.classList.add("place-photo");
            card.appendChild(image);
        } else {
            const fallback = document.createElement("div");
            fallback.classList.add("place-photo-fallback");
            fallback.textContent = "🐱";
            card.appendChild(fallback);
        }

        const name = document.createElement("h3");
        name.textContent = place.name;

        const address = createAddressLink(place.address);

        card.appendChild(name);
        card.appendChild(address);

        if (place.website) {
            const websiteLink = document.createElement("a");
            websiteLink.href = place.website;
            websiteLink.target = "_blank";
            websiteLink.rel = "noopener noreferrer";
            websiteLink.textContent = "Visit Website";
            websiteLink.classList.add("place-link");
            card.appendChild(websiteLink);
        }

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.classList.add("favorite-button");

        removeButton.addEventListener("click", function () {
            favorites = favorites.filter(function (favorite) {
                return favorite.id !== place.id;
            });

            saveFavorites();
            renderFavorites();
        });

        card.appendChild(removeButton);
        favoritesList.appendChild(card);
    });
}


// Place details

async function getPlaceDetails(placeId) {
    if (!placeId) {
        return {
            website: null,
            photo: null
        };
    }

    try {
        const detailsURL =
            "https://api.geoapify.com/v2/place-details?id=" +
            encodeURIComponent(placeId) +
            "&features=details" +
            "&apiKey=" +
            apiKey;

        const response = await fetch(detailsURL);
        const data = await response.json();

        if (!response.ok) {
            return {
                website: null,
                photo: null
            };
        }

        const detailsFeature = data.features.find(function (feature) {
            return feature.properties.feature_type === "details";
        });

        if (!detailsFeature) {
            return {
                website: null,
                photo: null
            };
        }

        const details = detailsFeature.properties;

        return {
            website:
                details.website ||
                details.brand_details?.website ||
                null,

            photo:
                details.wiki_and_media?.image ||
                null
        };

    } catch (error) {
        console.error("Place details error:", error);

        return {
            website: null,
            photo: null
        };
    }
}


// Search

async function searchPlaces() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const location = locationInput.value.trim();

    if (location === "") {
        message.textContent = "Please enter a location first! 🐱";
        return;
    }

    message.textContent = "Searching in " + location + "... 🐾";
    results.innerHTML = "";

    try {
        const locationURL =
            "https://api.geoapify.com/v1/geocode/search?text=" +
            encodeURIComponent(location) +
            "&limit=1" +
            "&apiKey=" +
            apiKey;

        const response = await fetch(locationURL);
        const data = await response.json();

        if (!response.ok) {
            message.textContent =
                "There was a problem with the location search.";
            return;
        }

        if (!data.features || data.features.length === 0) {
            message.textContent =
                "I couldn't find that location 😿";
            return;
        }

        const latitude = data.features[0].properties.lat;
        const longitude = data.features[0].properties.lon;

        const placesURL =
            "https://api.geoapify.com/v2/places?categories=" +
            selectedCategory +
            "&filter=circle:" +
            longitude +
            "," +
            latitude +
            ",15000" +
            "&bias=proximity:" +
            longitude +
            "," +
            latitude +
            "&limit=100" +
            "&apiKey=" +
            apiKey;

        const placesResponse = await fetch(placesURL);
        const placesData = await placesResponse.json();

        if (!placesResponse.ok) {
            message.textContent =
                "There was a problem finding places.";
            return;
        }

        let filteredPlaces = placesData.features.filter(function (place) {
            return place.properties.name;
        });

        if (searchTerm !== "") {
            filteredPlaces = filteredPlaces.filter(function (place) {
                const name =
                    place.properties.name.toLowerCase();

                const address =
                    (place.properties.formatted || "").toLowerCase();

                return (
                    name.includes(searchTerm) ||
                    address.includes(searchTerm)
                );
            });
        }

        const shownPlaces = filteredPlaces.slice(0, 12);

        results.innerHTML = "";

        if (shownPlaces.length === 0) {
            message.textContent =
                "No matching places found 😿";
            return;
        }

        message.textContent =
            "Found " + shownPlaces.length + " places! 🐾";

        shownPlaces.forEach(async function (place) {
            const placeId = place.properties.place_id;
            const placeName = place.properties.name;
            const placeAddress =
                place.properties.formatted || "Address unavailable";

            const card = document.createElement("div");
            card.classList.add("place-card");

            const photoArea = document.createElement("div");
            photoArea.classList.add("place-photo-fallback");
            photoArea.textContent = "Loading...";
            card.appendChild(photoArea);

            const name = document.createElement("h3");
            name.textContent = placeName;

            const address = createAddressLink(placeAddress);

            const saveButton = document.createElement("button");
            saveButton.classList.add("favorite-button");

            saveButton.textContent =
                isFavorite(placeId)
                    ? "Saved"
                    : "Save";

            card.appendChild(name);
            card.appendChild(address);
            card.appendChild(saveButton);

            results.appendChild(card);

            const details =
                await getPlaceDetails(placeId);

            if (details.photo) {
                const image = document.createElement("img");
                image.src = details.photo;
                image.alt = placeName;
                image.classList.add("place-photo");

                card.replaceChild(
                    image,
                    photoArea
                );
            } else {
                photoArea.textContent = "🐱";
            }

            if (details.website) {
                const websiteLink =
                    document.createElement("a");

                websiteLink.href =
                    details.website;

                websiteLink.target =
                    "_blank";

                websiteLink.rel =
                    "noopener noreferrer";

                websiteLink.textContent =
                    "Visit Website";

                websiteLink.classList.add(
                    "place-link"
                );

                card.insertBefore(
                    websiteLink,
                    saveButton
                );
            }

            saveButton.addEventListener("click", function () {
                saveFavorite(
                    place,
                    details.website,
                    details.photo
                );

                saveButton.textContent = "Saved";
            });
        });

    } catch (error) {
        console.error(error);

        message.textContent =
            "Something went wrong with the search 😿";
    }
}


// Events

searchButton.addEventListener(
    "click",
    searchPlaces
);

searchInput.addEventListener(
    "keydown",
    function (event) {
        if (event.key === "Enter") {
            searchPlaces();
        }
    }
);

locationInput.addEventListener(
    "keydown",
    function (event) {
        if (event.key === "Enter") {
            searchPlaces();
        }
    }
);

renderFavorites();