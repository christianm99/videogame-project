
// ==========================================
// RAWG API
// ==========================================

// Replace this with your NEW RAWG API key.
const RAWG_API_KEY = "a2561719714843748c904cec88fbc08d";

const API_URL =
  `https://api.rawg.io/api/games?key=${RAWG_API_KEY}` +
  `&dates=2019-09-01,2019-09-30&platforms=18,1&page_size=40`;

// ==========================================
// DOM ELEMENTS
// ==========================================

const gamesList = document.getElementById("games__list");
const searchInput = document.getElementById("search__input");
const searchButton = document.getElementById("search__button");
const sortSelect = document.getElementById("sort__select");

const loadingState = document.getElementById("loading__state");
const apiError = document.getElementById("api__error");
const apiErrorMessage = document.getElementById("api__error--message");
const retryButton = document.getElementById("retry__button");

const noResults = document.getElementById("no__results");
const resultsCount = document.getElementById("results__count");

const navMenu = document.getElementById("nav__menu");
const navLinkList = document.querySelector(".nav__link--list");

// ======================================
// STATE
// ==========================================

let allGames = [];

// ==========================================
// START
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  fetchGames();
  setupEventListeners();
});

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
  if (searchButton) {
    searchButton.addEventListener("click", handleSearch);
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        handleSearch();
      }
    });

    searchInput.addEventListener("input", filterAndRenderGames);
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", filterAndRenderGames);
  }

  if (retryButton) {
    retryButton.addEventListener("click", fetchGames);
  }

  if (navMenu && navLinkList) {
    navMenu.addEventListener("click", () => {
      navLinkList.classList.toggle("nav__link--list--open");
    });

    document.querySelectorAll(".nav__link").forEach((link) => {
      link.addEventListener("click", () => {
        navLinkList.classList.remove("nav__link--list--open");
      });
    });
  }
}

// ==========================================
// FETCH GAMES FROM RAWG API
// ==========================================

async function fetchGames() {
  showLoading();
  hideError();
  hideNoResults();

  if (gamesList) {
    gamesList.innerHTML = "";
  }

  if (resultsCount) {
    resultsCount.textContent = "";
  }

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(
        `The API returned an error (${response.status}).`
      );
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      throw new Error("The API returned an unexpected response.");
    }

    allGames = data.results;

    hideLoading();
    filterAndRenderGames();

  } catch (error) {
    console.error("RAWG API Error:", error);

    hideLoading();

    showError(
      error.message ||
        "Something went wrong while loading the games."
    );
  }
}

// ==========================================
// SEARCH
// ==========================================

function handleSearch() {
  filterAndRenderGames();

  const gamesSection = document.getElementById("games");

  if (gamesSection) {
    gamesSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

function filterGames(games, searchTerm) {
  if (!searchTerm) {
    return games;
  }

  return games.filter((game) =>
    game.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );
}

// ==========================================
// SORTING
// ==========================================

function sortGames(games, sortType) {
  const sortedGames = [...games];

  switch (sortType) {

    case "az":
      return sortedGames.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

    case "za":
      return sortedGames.sort((a, b) =>
        b.name.localeCompare(a.name)
      );

    case "newest":
      return sortedGames.sort(
        (a, b) =>
          getDateValue(b.released) -
          getDateValue(a.released)
      );

    case "oldest":
      return sortedGames.sort(
        (a, b) =>
          getDateValue(a.released) -
          getDateValue(b.released)
      );

    default:
      return sortedGames;
  }
}

function getDateValue(date) {
  if (!date) {
    return 0;
  }

  const timestamp = new Date(date).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

// ==========================================
// FILTER + SORT + RENDER
// ==========================================

function filterAndRenderGames() {
  const searchTerm = searchInput
    ? searchInput.value.trim()
    : "";

  const sortType = sortSelect
    ? sortSelect.value
    : "default";

  let filteredGames = filterGames(
    allGames,
    searchTerm
  );

  filteredGames = sortGames(
    filteredGames,
    sortType
  );

  renderGames(filteredGames);
}

// ==========================================
// CREATE GAME CARDS
// ==========================================

function renderGames(games) {
  if (!gamesList) {
    return;
  }

  gamesList.innerHTML = "";

  if (resultsCount) {
    resultsCount.textContent =
      games.length === 1
        ? "Showing 1 game"
        : `Showing ${games.length} games`;
  }

  if (games.length === 0) {

    if (noResults) {
      noResults.hidden = false;
    }

    return;
  }

  hideNoResults();

  games.forEach((game) => {
    gamesList.insertAdjacentHTML(
      "beforeend",
      createGameCard(game)
    );
  });
}

function createGameCard(game) {

  const title = escapeHTML(
    game.name || "Unknown Game"
  );

  const image =
    game.background_image ||
    createPlaceholder(title);

  const rating =
    typeof game.rating === "number"
      ? game.rating.toFixed(1)
      : "N/A";

  const releaseDate = game.released
    ? formatDate(game.released)
    : "Release date unavailable";

  const safeImage = escapeHTML(image);

  return `
    <article class="game">

      <div class="game__image--wrapper">

        <img
          src="${safeImage}"
          alt="${title} cover art"
          class="game__image"
          loading="lazy"
          onerror="this.src='${createPlaceholder(title)}'"
        />

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

// ==========================================
// LOADING STATE
// ==========================================

function showLoading() {

  if (loadingState) {
    loadingState.hidden = false;
  }

}

function hideLoading() {

  if (loadingState) {
    loadingState.hidden = true;
  }

}

// ==========================================
// ERROR STATE
// ==========================================

function showError(message) {

  if (apiError) {
    apiError.hidden = false;
  }

  if (apiErrorMessage) {
    apiErrorMessage.textContent = message;
  }

}

function hideError() {

  if (apiError) {
    apiError.hidden = true;
  }

}

// ==========================================
// NO RESULTS
// ==========================================

function hideNoResults() {

  if (noResults) {
    noResults.hidden = true;
  }

}

// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(dateString) {

  const date = new Date(
    `${dateString}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

}

// ==========================================
// HTML SAFETY
// ==========================================

function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

// ==========================================
// IMAGE FALLBACK
// ==========================================

function createPlaceholder(title) {

  const safeTitle = String(title)
    .replace(/&/g, "and")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .slice(0, 28);

  return (
    "https://placehold.co/800x500/171b1e/8cff00?text=" +
    encodeURIComponent(safeTitle || "Game")
  );

}