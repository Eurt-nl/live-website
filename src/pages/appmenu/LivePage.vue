<template>
  <q-page class="q-pa-md">
    <!-- Header sectie -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 text-weight-bold q-mb-sm">Live Tracking</h1>
        <p class="text-body1 text-grey-7">Volg spelers live tijdens events</p>
      </div>
    </div>

    <!-- Cascade filter: Baan en Event selectie -->
    <div class="row q-col-gutter-md q-mb-lg">
      <!-- Baan selectie -->
      <div class="col-12 col-md-6">
        <q-select
          v-model="selectedCourse"
          :options="availableCoursesWithEvents"
          option-label="name"
          option-value="id"
          label="Selecteer Baan"
          outlined
          emit-value
          map-options
          clearable
          use-input
          input-debounce="300"
          @update:model-value="onCourseChange"
        >
          <template v-slot:option="{ opt, selected, toggleOption }">
            <q-item clickable @click="toggleOption(opt)">
              <q-item-section>
                <q-item-label>{{ opt.name }}</q-item-label>
                <q-item-label caption>
                  {{ opt.city }}{{ opt.countryName ? `, ${opt.countryName}` : '' }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-checkbox :model-value="selected" />
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <!-- Event selectie -->
      <div class="col-12 col-md-6">
        <q-select
          v-model="selectedEvent"
          :options="filteredEvents"
          option-label="name"
          option-value="id"
          label="Selecteer Event"
          outlined
          emit-value
          map-options
          clearable
          use-input
          input-debounce="300"
          :disable="!selectedCourse"
          @update:model-value="onEventChange"
        >
          <template v-slot:option="{ opt, selected, toggleOption }">
            <q-item clickable @click="toggleOption(opt)">
              <q-item-section>
                <q-item-label>{{ opt.name }}</q-item-label>
                <q-item-label caption>
                  {{ formatDate(opt.startdate) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-checkbox :model-value="selected" />
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
    </div>

    <!-- Live content - alleen tonen als event geselecteerd -->
    <div v-if="selectedEvent">
      <!-- Baan Informatie - over de hele breedte -->
      <div class="row q-mb-lg">
        <div class="col-12">
          <!-- Gebruik de herbruikbare CourseInfoCard component voor volledige baaninformatie -->
          <CourseInfoCard
            :baan="selectedEventCourse"
            :holes="courseHoles"
            :country="selectedEventCourseCountry"
          />
        </div>
      </div>

      <!-- Leaderboard en Favoriete Spelers - 50-50 verdeling -->
      <div class="row q-col-gutter-lg">
        <!-- Kolom 1: Live Leaderboard -->
        <div class="col-12 col-lg-6">
          <q-card>
            <q-card-section>
              <div class="row items-center q-mb-md">
                <div class="col">
                  <div class="row items-center">
                    <q-icon name="leaderboard" color="primary" size="md" class="q-mr-sm" />
                    <h2 class="text-h6 q-ma-none">Live Leaderboard</h2>
                  </div>
                </div>
                <div class="col-auto">
                  <q-select
                    v-model="selectedCategory"
                    :options="categoryFilterOptions"
                    option-label="label"
                    option-value="value"
                    label="Categorie"
                    outlined
                    dense
                    emit-value
                    map-options
                    style="min-width: 120px"
                  />
                </div>
                <div class="col-auto">
                  <q-btn
                    flat
                    round
                    icon="refresh"
                    @click="refreshLiveData"
                    :loading="refreshing"
                    size="sm"
                  >
                    <q-tooltip>Vernieuwen</q-tooltip>
                  </q-btn>
                </div>
              </div>

              <!-- Leaderboard tabel -->
              <div v-if="leaderboard.length > 0" class="leaderboard-table">
                <!-- Kolomkoppen -->
                <div class="leaderboard-header q-pa-sm q-mb-sm bg-grey-2 rounded-borders">
                  <div class="row items-center text-caption text-weight-medium">
                    <div class="col-1 text-center">#</div>
                    <div class="col-7">Speler</div>
                    <div class="col-2 text-center">Na</div>
                    <div class="col-1 text-right">Score</div>
                    <div class="col-1 text-center">♥</div>
                  </div>
                </div>

                <!-- Spelers rijen -->
                <div
                  v-for="player in leaderboard"
                  :key="player.id"
                  class="leaderboard-row q-pa-xs q-mb-none rounded-borders cursor-pointer"
                  :class="{ 'bg-primary text-white': selectedPlayer?.id === player.id }"
                  @click="selectPlayer(player)"
                >
                  <div class="row items-center">
                    <!-- Kolom 1: Ranking -->
                    <div class="col-1 text-center">
                      <div class="text-weight-bold">{{ player.currentRank }}</div>
                    </div>

                    <!-- Kolom 2: Naam en categorie -->
                    <div class="col-7">
                      <div class="text-weight-medium">
                        {{ player.name }} ({{ player.category }})
                      </div>
                    </div>

                    <!-- Kolom 3: Holes gespeeld -->
                    <div class="col-2 text-center">
                      <div class="text-weight-bold">{{ player.holesPlayed }}</div>
                    </div>

                    <!-- Kolom 4: Score vs par -->
                    <div class="col-1 text-right">
                      <div class="text-weight-bold">
                        {{ player.score >= 0 ? '+' : '' }}{{ player.score }}
                      </div>
                    </div>

                    <!-- Kolom 5: Favoriet hartje -->
                    <div class="col-1 text-center">
                      <q-btn
                        flat
                        round
                        :icon="
                          favoritePlayers.find((p) => p.id === player.id)
                            ? 'favorite'
                            : 'favorite_border'
                        "
                        :color="
                          favoritePlayers.find((p) => p.id === player.id) ? 'warning' : 'grey'
                        "
                        size="sm"
                        @click.stop="
                          favoritePlayers.find((p) => p.id === player.id)
                            ? removeFavoritePlayer(player.id)
                            : addFavoritePlayer(player)
                        "
                      >
                        <q-tooltip>{{
                          favoritePlayers.find((p) => p.id === player.id)
                            ? 'Verwijderen uit favorieten'
                            : 'Toevoegen aan favorieten'
                        }}</q-tooltip>
                      </q-btn>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center q-pa-lg">
                <q-icon name="people" size="64px" color="grey-4" />
                <p class="text-grey-6 q-mt-md">Geen actieve spelers gevonden</p>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Kolom 2: Favoriete Spelers -->
        <div class="col-12 col-lg-6">
          <q-card>
            <q-card-section>
              <div class="row items-center q-mb-md">
                <q-icon name="favorite" color="warning" size="md" class="q-mr-sm" />
                <h2 class="text-h6 q-ma-none">Favoriete Spelers</h2>
              </div>

              <!-- Favoriete spelers lijst -->
              <div v-if="favoritePlayers.length > 0" class="favorite-players">
                <div
                  v-for="player in favoritePlayers"
                  :key="player.id"
                  class="favorite-player-card q-pa-md q-mb-md bg-grey-1 rounded-borders"
                >
                  <!-- Speler header met avatar, naam, homecourse en score -->
                  <div class="row items-center q-mb-md">
                    <q-avatar size="48px" class="q-mr-md">
                      <img :src="getPlayerAvatarUrl(player)" />
                    </q-avatar>
                    <div class="col">
                      <div class="text-weight-medium">{{ player.name }}</div>
                      <div class="text-caption text-grey-6">
                        {{ getPlayerHomecourse(player) || 'Geen thuisbaan' }}
                      </div>
                    </div>
                    <div class="text-right q-mr-md">
                      <div
                        class="text-h6 text-weight-bold"
                        :class="getScoreColorClass(player.score)"
                      >
                        {{ player.score >= 0 ? '+' : '' }}{{ player.score }}
                      </div>
                      <div class="text-caption text-grey-6">vs par</div>
                    </div>
                    <q-btn
                      flat
                      round
                      icon="close"
                      size="sm"
                      @click="removeFavoritePlayer(player.id)"
                    >
                      <q-tooltip>Verwijderen</q-tooltip>
                    </q-btn>
                  </div>

                  <!-- Hole scores per ronde -->
                  <div v-if="getPlayerRounds(player).length > 0" class="player-rounds">
                    <!-- Scores tabel -->
                    <div class="scores-table q-mt-md">
                      <!-- Tabel header -->
                      <div class="table-header q-pa-xs bg-grey-2 rounded-borders q-mb-xs">
                        <div class="row items-center text-caption text-weight-medium">
                          <div class="round-col">Ronde</div>
                          <div v-for="hole in courseHoles" :key="hole.hole" class="hole-col">
                            {{ hole.hole }}
                          </div>
                          <div class="total-col">Totaal</div>
                        </div>
                      </div>

                      <!-- Tabel rijen -->
                      <div
                        v-for="(round, roundIndex) in getPlayerRounds(player)"
                        :key="round.id"
                        class="table-row q-pa-xs q-mb-xs rounded-borders"
                        :class="roundIndex % 2 === 0 ? 'bg-grey-1' : 'bg-white'"
                      >
                        <div class="row items-center">
                          <div class="round-col">
                            {{ roundIndex + 1 }}
                          </div>
                          <div v-for="hole in courseHoles" :key="hole.hole" class="hole-col">
                            <div
                              class="hole-score-table"
                              :class="getHoleScoreClass(getHoleScore(player, round.id, hole.hole))"
                            >
                              {{ getHoleScoreDisplay(getHoleScore(player, round.id, hole.hole)) }}
                            </div>
                          </div>
                          <div class="total-col">
                            <div
                              class="text-caption text-weight-bold"
                              :class="getScoreColorClass(getRoundTotalScore(player, round.id))"
                            >
                              {{ getRoundTotalScoreDisplay(getRoundTotalScore(player, round.id)) }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center q-pa-lg">
                <q-icon name="favorite_border" size="64px" color="grey-4" />
                <p class="text-grey-6 q-mt-md">Geen favoriete spelers</p>
                <p class="text-caption text-grey-5">
                  Klik op spelers in het leaderboard om ze toe te voegen
                </p>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Placeholder als geen event geselecteerd -->
    <div v-else class="row items-center justify-center" style="min-height: 60vh">
      <div class="col-12 col-md-6 text-center">
        <q-icon name="event" size="120px" color="grey-4" class="q-mb-lg" />
        <h2 class="text-h5 text-weight-bold q-mb-md">Selecteer een Event</h2>
        <p class="text-body1 text-grey-7 q-mb-lg">
          Kies een event uit de dropdown hierboven om live tracking te starten.
        </p>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useRoute } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getScoreColor } from 'src/constants/scoreColors';
import { getFileUrl } from 'src/utils/pocketbase-helpers';
import CourseInfoCard from 'src/components/CourseInfoCard.vue';

const $q = useQuasar();
const pb = usePocketbase();
const route = useRoute();

// State
const selectedCourse = ref(null);
const selectedEvent = ref(null);
const availableCourses = ref([]);
const availableEvents = ref([]);
const loading = ref(false);
const refreshing = ref(false);
const selectedPlayer = ref(null);
const favoritePlayers = ref([]);
const selectedEventCourse = ref(null);
const categoryMapping = ref({}); // Mapping van categorie ID naar naam
const selectedCategory = ref('all'); // Categorie filter

// Map state
const mapContainer = ref(null);
let map = null;
const playerMarkers = {};
let courseMarkers = [];
let courseLines = [];

// Data state
const eventRounds = ref([]);
const eventScores = ref([]);
const courseHoles = ref([]);
const totalHoles = ref(0);

// Computed properties
const filteredEvents = computed(() => {
  if (!selectedCourse.value) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset naar begin van de dag

  return availableEvents.value
    .filter((event) => {
      // Filter op geselecteerde baan
      const eventCourseId = Array.isArray(event.course) ? event.course[0] : event.course;
      if (eventCourseId !== selectedCourse.value) return false;

      // Filter op datum (tot en met vandaag)
      if (event.startdate) {
        const eventDate = new Date(event.startdate);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate <= today;
      }

      return false;
    })
    .sort((a, b) => new Date(b.startdate) - new Date(a.startdate)); // Nieuwste eerst
});

const availableCoursesWithEvents = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Bepaal welke banen events hebben (tot en met vandaag)
  const coursesWithEvents = new Set();

  availableEvents.value.forEach((event) => {
    if (event.startdate) {
      const eventDate = new Date(event.startdate);
      eventDate.setHours(0, 0, 0, 0);
      if (eventDate <= today) {
        const eventCourseId = Array.isArray(event.course) ? event.course[0] : event.course;
        if (eventCourseId) {
          coursesWithEvents.add(eventCourseId);
        }
      }
    }
  });

  // Filter banen op basis van events
  return availableCourses.value.filter((course) => coursesWithEvents.has(course.id));
});

const categoryFilterOptions = [
  { label: 'Alles', value: 'all' },
  { label: 'Heren', value: 'heren' },
  { label: 'Dames', value: 'dames' },
  { label: 'Senioren', value: 'senioren' },
  { label: 'Junioren', value: 'junioren' },
];

const leaderboard = computed(() => {
  if (!eventRounds.value.length) return [];

  const currentLeaderboard = eventRounds.value
    .map((round) => {
      const playerScores = eventScores.value.filter((s) => s.round === round.id);
      const totalScore = playerScores.reduce((sum, score) => {
        return sum + ((score.score_player || 3) - 3); // T.o.v. par
      }, 0);

      // Bepaal huidige hole (laatste hole met score + 1)
      const lastScoredHole = Math.max(...playerScores.map((s) => s.hole_number), 0);
      const currentHole = lastScoredHole < totalHoles.value ? lastScoredHole + 1 : totalHoles.value;

      const playerCategoryId = round.expand?.player?.category;
      const playerCategoryName = getCategoryName(playerCategoryId);

      return {
        id: round.player,
        name: round.expand?.player?.name || 'Onbekende speler',
        score: totalScore,
        holesPlayed: playerScores.length,
        currentHole: currentHole,
        roundId: round.id,
        category: getCategoryFirstLetter(playerCategoryId), // Eerste letter van categorienaam
        categoryName: playerCategoryName, // Volledige categorienaam voor filtering
      };
    })
    .filter((player) => {
      // Filter op geselecteerde categorie
      console.log(
        `Debug - Filtering player ${player.name}: categoryName="${player.categoryName}", selectedCategory="${selectedCategory.value}"`,
      );
      if (selectedCategory.value === 'all') return true;
      const matches = player.categoryName?.toLowerCase() === selectedCategory.value;
      console.log(`Debug - Match result: ${matches}`);
      return matches;
    })
    .sort((a, b) => {
      // Eerst sorteren op holes gespeeld (meeste bovenaan)
      if (b.holesPlayed !== a.holesPlayed) {
        return b.holesPlayed - a.holesPlayed;
      }
      // Dan sorteren op score (laagste eerst)
      return a.score - b.score;
    });

  return currentLeaderboard.map((player, currentIndex) => ({
    ...player,
    currentRank: currentIndex + 1,
  }));
});

// Verwijderd omdat niet meer gebruikt

// Helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getCourseName = (course: unknown) => {
  if (!course) return null;

  // Als course een array is, neem de eerste
  if (Array.isArray(course)) {
    return course[0]?.name || null;
  }

  // Als course een enkel object is
  return course.name || null;
};

// Verwijderd omdat niet meer gebruikt

// Helper functie om categorie mapping bij te werken
const updateCategoryMapping = async () => {
  const uniqueCategoryIds = [
    ...new Set(eventRounds.value.map((round) => round.expand?.player?.category).filter(Boolean)),
  ];

  for (const categoryId of uniqueCategoryIds) {
    if (!categoryMapping.value[categoryId]) {
      try {
        const category = await pb.collection('categories').getOne(categoryId);
        categoryMapping.value[categoryId] = category.name.charAt(0).toUpperCase();
      } catch (error) {
        console.error('Error loading category:', error);
        categoryMapping.value[categoryId] = 'H';
      }
    }
  }
};

// Helper functie om eerste letter van categorienaam op te halen
const getCategoryFirstLetter = (categoryId: string) => {
  if (!categoryId) return 'H';
  return categoryMapping.value[categoryId] || 'H';
};

// Helper functie om volledige categorienaam op te halen
const getCategoryName = (categoryId: string) => {
  if (!categoryId) return null;

  // Zoek de volledige categorienaam op basis van de eerste letter
  const firstLetter = categoryMapping.value[categoryId];
  if (!firstLetter) return null;

  // Mapping van eerste letter naar volledige naam
  const categoryNames = {
    H: 'heren',
    D: 'dames',
    S: 'senioren',
    J: 'junioren',
  };

  return categoryNames[firstLetter] || null;
};

// Helper functies voor favoriete spelers
const getPlayerAvatarUrl = (player) => {
  const playerData = eventRounds.value.find((r) => r.player === player.id)?.expand?.player;
  if (playerData?.avatar) {
    return getFileUrl('users', playerData.id, playerData.avatar);
  }
  return 'https://cdn.quasar.dev/img/avatar.png';
};

const getPlayerHomecourse = (player) => {
  const playerData = eventRounds.value.find((r) => r.player === player.id)?.expand?.player;
  return playerData?.expand?.homecourse?.name || null;
};

const getPlayerRounds = (player) => {
  const rounds = eventRounds.value
    .filter((r) => r.player === player.id)
    .sort((a, b) => {
      // Sorteer op starttijd van de ronde (eerste gestart bovenaan)
      if (a.time && b.time) {
        return new Date(a.time).getTime() - new Date(b.time).getTime();
      }
      return 0;
    });
  console.log(`Debug - Rondes voor speler ${player.name}:`, rounds);
  return rounds;
};

const getHoleScore = (player, roundId, holeNumber) => {
  const score = eventScores.value.find((s) => s.round === roundId && s.hole_number === holeNumber);
  console.log(
    `Debug - Hole score voor speler ${player.name}, ronde ${roundId}, hole ${holeNumber}:`,
    score?.score_player || null,
  );
  return score?.score_player || null;
};

const getHoleScoreDisplay = (score) => {
  if (score === null || score === undefined) return '-';
  return score.toString();
};

const getHoleScoreClass = (score) => {
  if (score === null || score === undefined) return 'hole-score-empty';
  if (score <= 2) return 'hole-score-eagle';
  if (score === 3) return 'hole-score-par';
  if (score === 4) return 'hole-score-bogey';
  if (score === 5) return 'hole-score-double';
  return 'hole-score-triple';
};

const getScoreColorClass = (score) => {
  if (score < 0) return 'text-positive';
  if (score === 0) return 'text-grey-8';
  return 'text-negative';
};

const getRoundTotalScore = (player, roundId) => {
  const roundScores = eventScores.value.filter((s) => s.round === roundId);
  const totalScore = roundScores.reduce((sum, score) => {
    return sum + ((score.score_player || 3) - 3); // T.o.v. par
  }, 0);
  return totalScore;
};

const getRoundTotalScoreDisplay = (score) => {
  if (score === 0) return 'E';
  return score >= 0 ? `+${score}` : `${score}`;
};

// Map functions
const initMap = () => {
  if (!mapContainer.value) {
    return;
  }

  map = L.map(mapContainer.value).setView([52.3676, 4.9041], 15);

  // Voeg satellietlaag toe
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 19,
      attribution: '© Esri',
    },
  ).addTo(map);
};

const clearMap = () => {
  if (!map) return;

  // Verwijder alleen course markers en lijnen
  courseMarkers.forEach((marker) => {
    map.removeLayer(marker);
  });
  courseMarkers = [];

  courseLines.forEach((line) => {
    map.removeLayer(line);
  });
  courseLines = [];
};

const addCourseToMapVisual = () => {
  if (!map || !courseHoles.value.length) return;

  // Voeg holes toe aan kaart
  courseHoles.value.forEach((hole) => {
    if (hole.gps_tee?.latitude && hole.gps_tee?.longitude) {
      // Tee marker
      const teeMarker = L.marker([hole.gps_tee.latitude, hole.gps_tee.longitude], {
        icon: L.divIcon({
          className: 'tee-marker',
          html: '<div class="tee-marker-inner"></div>',
          iconSize: [10, 10],
        }),
      }).addTo(map);
      courseMarkers.push(teeMarker);

      if (hole.gps_green?.latitude && hole.gps_green?.longitude) {
        // Green marker
        const greenMarker = L.marker([hole.gps_green.latitude, hole.gps_green.longitude], {
          icon: L.divIcon({
            className: 'green-marker',
            html: '<div class="green-marker-inner"></div>',
            iconSize: [15, 15],
          }),
        }).addTo(map);
        courseMarkers.push(greenMarker);

        // Lijn tussen tee en green
        const line = L.polyline(
          [
            [hole.gps_tee.latitude, hole.gps_tee.longitude],
            [hole.gps_green.latitude, hole.gps_green.longitude],
          ],
          {
            color: '#1976D2',
            weight: 2,
          },
        ).addTo(map);
        courseLines.push(line);

        // Hole label
        const label = L.marker(
          [
            (hole.gps_tee.latitude + hole.gps_green.latitude) / 2,
            (hole.gps_tee.longitude + hole.gps_green.longitude) / 2,
          ],
          {
            icon: L.divIcon({
              className: 'hole-label',
              html: `<div class="hole-label-inner">${hole.hole}</div>`,
              iconSize: [30, 20],
            }),
          },
        ).addTo(map);
        courseMarkers.push(label);
      }
    }
  });

  // Fit map to course bounds
  if (courseMarkers.length > 0) {
    const group = L.featureGroup(courseMarkers);
    const bounds = group.getBounds();
    map.fitBounds(bounds, { padding: [50, 50] });
  }
};

const loadCourseData = async () => {
  if (!selectedEvent.value) {
    return;
  }

  try {
    const event = await pb.collection('events').getOne(selectedEvent.value, {
      expand: 'course',
    });

    const courseId = Array.isArray(event.course) ? event.course[0] : event.course;

    if (!courseId) {
      return;
    }

    // Laad baan informatie
    try {
      const courseData = await pb.collection('courses').getOne(courseId, {
        expand: 'owner,moderators,category',
      });
      selectedEventCourse.value = courseData;

      // Laad country data als deze beschikbaar is
      if (courseData.country) {
        try {
          selectedEventCourseCountry.value = await pb
            .collection('countries')
            .getOne(courseData.country);
        } catch (countryError) {
          console.error('Error loading country data:', countryError);
        }
      }
    } catch (error) {
      console.error('Error loading course data:', error);
    }

    // Haal holes op
    const holesResult = await pb.collection('course_detail').getList(1, 50, {
      filter: `course = "${courseId}"`,
      sort: 'hole',
    });

    courseHoles.value = holesResult.items;
    totalHoles.value = holesResult.items.length;
  } catch (error) {
    console.error('Error loading course data:', error);
  }
};

// Speler posities worden niet meer op de kaart getoond

// Data loading functions
const loadAvailableCourses = async () => {
  try {
    // Laad eerst alle banen
    const result = await pb.collection('courses').getList(1, 200, {
      sort: 'name',
    });

    // Laad alle landen voor mapping
    const countriesResult = await pb.collection('countries').getList(1, 200, {
      sort: 'name',
    });

    // Maak een mapping van country ID naar naam
    const countryMapping = {};
    countriesResult.items.forEach((country) => {
      countryMapping[country.id] = country.name;
    });

    availableCourses.value = result.items.map((course) => ({
      id: course.id,
      name: course.name,
      city: course.city,
      country: course.country,
      countryName: countryMapping[course.country] || course.country,
    }));
  } catch (error) {
    console.error('Error loading courses:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij laden banen',
      icon: 'error',
    });
  }
};

const loadAvailableEvents = async () => {
  try {
    loading.value = true;

    const result = await pb.collection('events').getList(1, 200, {
      sort: '-startdate',
      expand: 'course,status',
    });

    // Laad alle events (worden gefilterd door computed property)
    availableEvents.value = result.items.map((event) => ({
      id: event.id,
      name: event.name,
      startdate: event.startdate,
      course: event.course,
      expand: event.expand,
    }));
  } catch (error) {
    console.error('Error loading events:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij laden events',
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};

const loadEventData = async () => {
  if (!selectedEvent.value) {
    return;
  }

  try {
    refreshing.value = true;

    // Haal alle rondes van het event op
    const roundsResult = await pb.collection('rounds').getList(1, 200, {
      filter: `event = "${selectedEvent.value}"`,
      expand: 'player,player.homecourse',
    });
    eventRounds.value = roundsResult.items;

    // Haal alle scores op
    const roundIds = roundsResult.items.map((r) => r.id);
    let allScores = [];

    if (roundIds.length > 0) {
      for (let i = 0; i < roundIds.length; i += 50) {
        const batchIds = roundIds.slice(i, i + 50);
        const filter = batchIds.map((id) => `round = "${id}"`).join(' || ');
        const scoresResult = await pb.collection('round_scores').getList(1, 200, {
          filter,
          expand: 'hole',
        });
        allScores = allScores.concat(scoresResult.items);
      }
    }

    // Voeg hole_number toe aan scores (alleen als courseHoles beschikbaar zijn)
    eventScores.value = allScores.map((score) => ({
      ...score,
      hole_number: courseHoles.value.find((h) => h.id === score.hole)?.hole || 0,
    }));

    // Update categorie mapping
    await updateCategoryMapping();
  } catch (error) {
    console.error('Error loading event data:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij laden event data',
      icon: 'error',
    });
  } finally {
    refreshing.value = false;
  }
};

// Event handlers
const onCourseChange = () => {
  // Reset event en gerelateerde data wanneer baan verandert
  selectedEvent.value = null;
  selectedPlayer.value = null;
  favoritePlayers.value = [];
  clearMap();
};

const onEventChange = async () => {
  selectedPlayer.value = null;
  favoritePlayers.value = []; // Reset favoriete spelers bij event wissel
  clearMap();

  if (selectedEvent.value) {
    try {
      // Laad eerst baan informatie
      await loadCourseData();

      // Dan event data laden
      await loadEventData();

      // Voeg baan visueel toe aan map (alleen als map beschikbaar is)
      if (map) {
        addCourseToMapVisual();
      }
    } catch (error) {
      console.error('Error in onEventChange:', error);
      $q.notify({
        color: 'negative',
        message: 'Fout bij laden event data',
        icon: 'error',
      });
    }
  }
};

const selectPlayer = (player) => {
  selectedPlayer.value = player;
};

const addFavoritePlayer = (player) => {
  if (favoritePlayers.value.length >= 5) {
    $q.notify({
      color: 'warning',
      message: 'Maximum 5 favoriete spelers toegestaan',
      icon: 'warning',
    });
    return;
  }

  if (!favoritePlayers.value.find((p) => p.id === player.id)) {
    favoritePlayers.value.push(player);
    $q.notify({
      color: 'positive',
      message: `${player.name} toegevoegd aan favorieten`,
      icon: 'favorite',
    });
  }
};

const removeFavoritePlayer = (playerId) => {
  const index = favoritePlayers.value.findIndex((p) => p.id === playerId);
  if (index > -1) {
    const player = favoritePlayers.value[index];
    favoritePlayers.value.splice(index, 1);
    $q.notify({
      color: 'info',
      message: `${player.name} verwijderd uit favorieten`,
      icon: 'close',
    });
  }
};

const refreshLiveData = async () => {
  await loadEventData();
};

// Auto-refresh interval
let refreshInterval = null;

const startAutoRefresh = () => {
  refreshInterval = setInterval(async () => {
    if (selectedEvent.value) {
      await loadEventData();
    }
  }, 30000); // Elke 30 seconden
};

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

// Lifecycle
onMounted(async () => {
  await Promise.all([loadAvailableCourses(), loadAvailableEvents()]);

  // Controleer query parameters voor automatische selectie
  const queryCourse = route.query.course as string;
  const queryEvent = route.query.event as string;

  if (queryCourse && queryEvent) {
    // Wacht even tot de data geladen is
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Selecteer automatisch de course en event
    selectedCourse.value = queryCourse;

    // Zoek het event in de beschikbare events
    const event = availableEvents.value.find((e) => e.id === queryEvent);
    if (event) {
      selectedEvent.value = queryEvent;
      console.log('Event automatisch geselecteerd via query parameter:', event.name);

      try {
        // Laad eerst baan informatie
        await loadCourseData();

        // Dan event data laden
        await loadEventData();

        // Voeg baan visueel toe aan map (alleen als map beschikbaar is)
        if (map) {
          addCourseToMapVisual();
        }
      } catch (error) {
        console.error('Error bij laden data via query parameters:', error);
        $q.notify({
          color: 'negative',
          message: 'Fout bij laden event data',
          icon: 'error',
        });
      }
    }
  }

  startAutoRefresh();
});

// Watch voor map initialisatie
watch(
  () => mapContainer.value,
  (newValue) => {
    if (newValue && !map) {
      initMap();
    }
  },
  { immediate: true },
);

// Watch voor course holes om baan toe te voegen aan map
watch(
  () => courseHoles.value,
  () => {
    if (courseHoles.value.length > 0 && map) {
      addCourseToMapVisual();
    }
  },
);

onUnmounted(() => {
  stopAutoRefresh();
});

// Watchers - verwijderd omdat spelerposities niet meer op de kaart worden getoond
// Zorg dat selectedEventCourseCountry correct wordt gevuld bij het laden van de baan (zoals in BaanDetailPage)
const selectedEventCourseCountry = ref(null);
// In loadCourseData, na het ophalen van de baan:
// if (selectedEventCourse.value?.country) {
//   selectedEventCourseCountry.value = await pb.collection('countries').getOne(selectedEventCourse.value.country)
// }
</script>

<style lang="scss" scoped>
.live-map-container {
  aspect-ratio: 1;
  width: 100%;
  max-height: 600px;
  border-radius: 8px;
  overflow: hidden;
}

.mini-map-container {
  height: 200px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.mini-map {
  height: 100%;
  width: 100%;
}

.hole-card {
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}

.hole-card:hover {
  background-color: #f5f5f5;
  border-color: #1976d2;
}

.favorite-player-card {
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.favorite-player-card:hover {
  border-color: #ff9800;
  background-color: rgba(255, 152, 0, 0.05);
}

.leaderboard-table {
  max-height: 400px;
  overflow-y: auto;
}

.leaderboard-row {
  transition: all 0.2s ease;
  border: 1px solid transparent;
  padding: 2px 8px !important;

  &:hover {
    background-color: rgba(25, 118, 210, 0.1);
    border-color: rgba(25, 118, 210, 0.3);
  }
}

.leaderboard-table {
  max-height: 500px;
  overflow-y: auto;
}

:deep(.tee-marker) {
  background-color: #1976d2;
  border-radius: 4px;
  width: 10px;
  height: 10px;
}

:deep(.green-marker) {
  background-color: #4caf50;
  border-radius: 50%;
  width: 15px;
  height: 15px;
}

:deep(.hole-label) {
  background: white;
  border: 1px solid #1976d2;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 12px;
  font-weight: bold;
  color: #1976d2;
  text-align: center;
  white-space: nowrap;
}

:deep(.player-marker) {
  background-color: #ff5722;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  .player-marker-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: white;
    font-weight: bold;
    font-size: 12px;
  }
}

:deep(.player-popup) {
  padding: 8px;
  min-width: 150px;
}

/* Hole score styling */
.hole-score {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  border: 1px solid #e0e0e0;
}

.hole-score-empty {
  background-color: #f5f5f5;
  color: #999;
}

.hole-score-eagle {
  background-color: #4caf50;
  color: white;
}

.hole-score-par {
  background-color: #2196f3;
  color: white;
}

.hole-score-bogey {
  background-color: #ff9800;
  color: white;
}

.hole-score-double {
  background-color: #f44336;
  color: white;
}

.hole-score-triple {
  background-color: #9c27b0;
  color: white;
}

.player-rounds {
  border-top: 1px solid #e0e0e0;
  padding-top: 8px;
}

.round-scores {
  background-color: rgba(255, 255, 255, 0.5);
  padding: 8px;
  border-radius: 4px;
}

/* Tabel styling */
.scores-table {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  border-bottom: 2px solid #e0e0e0;
}

.table-row {
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: rgba(25, 118, 210, 0.05) !important;
}

.hole-score-table {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: bold;
  border: 1px solid #e0e0e0;
  margin: 0 auto;
}

.scores-table {
  max-width: 100vw;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
}

.scores-table .table-header,
.scores-table .table-row {
  min-width: 600px;
  width: max-content;
  display: flex;
  flex-wrap: nowrap; /* Zorgt dat alles op één regel blijft */
}

@media (min-width: 900px) {
  .scores-table {
    max-width: none;
    overflow-x: visible;
    white-space: normal;
  }
  .scores-table .table-header,
  .scores-table .table-row {
    min-width: 0;
    width: 100%;
    display: flex;
  }
}

.hole-col {
  min-width: 24px; /* was 48px */
  width: 24px;
  text-align: center;
  flex: 0 0 24px;
}

.round-col {
  min-width: 40px;
  width: 40px;
  text-align: center;
  flex: 0 0 40px;
}

.total-col {
  min-width: 40px;
  width: 40px;
  text-align: center;
  flex: 0 0 40px;
}
</style>
