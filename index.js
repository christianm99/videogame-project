const RAWG_API_KEY = "a2561719714843748c904cec88fbc08d";

const API_URL = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&dates=2019-09-01,2019-09-30&platforms=18,1&page_size=40`;

const PLATFORMS_API_URL = `https://api.rawg.io/api/platforms?key=${RAWG_API_KEY}`;


/* ================================
   DOM ELEMENTS
================================ */

const searchInput = document.querySelector("#search__input");
const searchButton = document.querySelector("#search__button");
const sortSelect = document.querySelector("#sort__select");

const gamesList = document.querySelector("#games__list");
const loadingState = document.querySelector("#loading__state");
const apiError = document.querySelector("#api__error");
const apiErrorMessage = document.querySelector("#api__error--message");
const retryButton = document.querySelector("#retry__button");
const resultsCount = document.querySelector("#results__count");
const noResults = document.querySelector("#no__results");

const navMenu = document.querySelector(".nav__menu");
const navLinks = document.querySelector(".nav__link--list");


/* ================================
   STATE
================================ */

let allGames = [];
let allPlatforms = [];
let selectedPlatform = "all";


/* ================================
   START APPLICATION
================================ */

document.addEventListener("DOMContentLoaded", () => {
  createPlatformFilter();
  setupEventListeners();
  fetchData();
});


/* ================================
   FETCH GAMES + PLATFORMS
================================ */

async function fetchData() {
  showLoading();
  hideError();
  hideNoResults();

  try {
    const [gamesResponse, platformsResponse] = await Promise.all([
      fetch(API_URL),
      fetch(PLATFORMS_API_URL)
    ]);

    if (!gamesResponse.ok) {
      throw new Error("Unable to load the games from RAWG.");
    }

    if (!platformsResponse.ok) {
      throw new Error("Unable to load the platforms from RAWG.");
    }

    const gamesData = await gamesResponse.json();
    const platformsData = await platformsResponse.json();

    if (!gamesData.results) {
      throw new Error("The games API returned an unexpected response.");
    }

    if (!platformsData.results) {
      throw new Error("The platforms API returned an unexpected response.");
    }

    allGames = gamesData.results;
    allPlatforms = platformsData.results;

    updatePlatformFilter();

    filterAndRenderGames();
  } catch (error) {
    console.error("RAWG API Error:", error);

    showError(
      error.message ||
      "Something went wrong while loading the games."
    );
  }
}


/* ================================
   PLATFORM FILTER
================================ */

function createPlatformFilter() {
  const filtersContainer = document.querySelector(".games__filters");

  if (!filtersContainer) {
    return;
  }

  const platformSelect = document.createElement("select");

  platformSelect.className = "sort__select";
  platformSelect.id = "platform__select";
  platformSelect.setAttribute("aria-label", "Filter games by platform");

  platformSelect.innerHTML = `
    <option value="all">All Platforms</option>
  `;

  filtersContainer.insertBefore(
    platformSelect,
    sortSelect
  );

  platformSelect.addEventListener("change", (event) => {
    selectedPlatform = event.target.value;
    filterAndRenderGames();
  });
}


function updatePlatformFilter() {
  const platformSelect = document.querySelector("#platform__select");

  if (!platformSelect) {
    return;
  }

  /*
    Get the platform IDs that actually appear
    in the games returned by the Games API.
  */

  const platformIds = new Set();

  allGames.forEach((game) => {
    if (!game.platforms) {
      return;
    }

    game.platforms.forEach((item) => {
      if (item.platform && item.platform.id) {
        platformIds.add(item.platform.id);
      }
    });
  });

  /*
    Match those IDs with the names returned
    by the Platforms API.
  */

  const availablePlatforms = allPlatforms
    .filter((platform) => platformIds.has(platform.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  platformSelect.innerHTML = `
    <option value="all">All Platforms</option>
  `;

  availablePlatforms.forEach((platform) => {
    const option = document.createElement("option");

    option.value = platform.id;
    option.textContent = platform.name;

    platformSelect.appendChild(option);
  });

  platformSelect.value = selectedPlatform;
}


/* ================================
   EVENT LISTENERS
================================ */

function setupEventListeners() {
  searchButton.addEventListener("click", () => {
    filterAndRenderGames();
  });

  searchInput.addEventListener("input", () => {
    filterAndRenderGames();
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      filterAndRenderGames();
    }
  });

  sortSelect.addEventListener("change", () => {
    filterAndRenderGames();
  });

  retryButton.addEventListener("click", () => {
    fetchData();
  });

  if (navMenu && navLinks) {
    navMenu.addEventListener("click", () => {
      navLinks.classList.toggle("nav__link--list--open");
    });
  }
}


/* ================================
   FILTER + SORT + RENDER
================================ */

function filterAndRenderGames() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  let filteredGames = allGames.filter((game) => {
    const matchesSearch = game.name
      .toLowerCase()
      .includes(searchTerm);

    const matchesPlatform =
      selectedPlatform === "all" ||
      game.platforms?.some(
        (item) =>
          item.platform &&
          item.platform.id === Number(selectedPlatform)
      );

    return matchesSearch && matchesPlatform;
  });

  filteredGames = sortGames(filteredGames);

  renderGames(filteredGames);
}


/* ================================
   SORT GAMES
================================ */

function sortGames(games) {
  const sortedGames = [...games];

  switch (sortSelect.value) {
    case "az":
      return sortedGames.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

    case "za":
      return sortedGames.sort((a, b) =>
        b.name.localeCompare(a.name)
      );

    case "newest":
      return sortedGames.sort((a, b) => {
        const dateA = new Date(a.released || 0);
        const dateB = new Date(b.released || 0);

        return dateB - dateA;
      });

    case "oldest":
      return sortedGames.sort((a, b) => {
        const dateA = new Date(a.released || 0);
        const dateB = new Date(b.released || 0);

        return dateA - dateB;
      });

    default:
      return sortedGames;
  }
}


/* ================================
   RENDER GAMES
================================ */

function renderGames(games) {
  hideLoading();

  gamesList.innerHTML = "";

  resultsCount.textContent =
    `${games.length} game${games.length === 1 ? "" : "s"} found`;

  if (games.length === 0) {
    hideGamesList();
    showNoResults();
    return;
  }

  showGamesList();
  hideNoResults();

  games.forEach((game) => {
    gamesList.insertAdjacentHTML(
      "beforeend",
      createGameCard(game)
    );
  });
}


/* ================================
   CREATE GAME CARD
================================ */

function createGameCard(game) {
  const image = game.background_image || createPlaceholder();

  const title = escapeHTML(game.name || "Unknown Game");

  const releaseDate = game.released
    ? formatDate(game.released)
    : "Release date unavailable";

  const rating = game.rating
    ? `${game.rating.toFixed(1)} / 5`
    : "No rating";

  return `
    <article class="game">
      <div class="game__image--wrapper">
        <img
          class="game__image"
          src="${image}"
          alt="${title}"
          loading="lazy"
        >
      </div>

      <div class="game__content">
        <h3 class="game__title">
          ${title}
        </h3>

        <div class="game__meta">
          <span class="game__rating">
            ★ ${rating}
          </span>

          <span class="game__date">
            ${releaseDate}
          </span>
        </div>
      </div>
    </article>
  `;
}


/* ================================
   FORMAT DATE
================================ */

function formatDate(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}


/* ================================
   ESCAPE HTML
================================ */

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* ================================
   PLACEHOLDER IMAGE
================================ */

function createPlaceholder() {
  return "https://placehold.co/600x400/171b1e/8cff00?text=Pixel+Vault";
}


/* ================================
   LOADING
================================ */

function showLoading() {
  loadingState.hidden = false;
  gamesList.hidden = true;
  noResults.hidden = true;
  apiError.hidden = true;
}

function hideLoading() {
  loadingState.hidden = true;
}


/* ================================
   ERROR
================================ */

function showError(message) {
  loadingState.hidden = true;
  gamesList.hidden = true;
  noResults.hidden = true;
  apiError.hidden = false;

  apiErrorMessage.textContent = message;
}

function hideError() {
  apiError.hidden = true;
}


/* ================================
   NO RESULTS
================================ */

function showNoResults() {
  noResults.hidden = false;
}

function hideNoResults() {
  noResults.hidden = true;
}


/* ================================
   GAMES LIST VISIBILITY
================================ */

function showGamesList() {
  gamesList.hidden = false;
}

function hideGamesList() {
  gamesList.hidden = true;
}