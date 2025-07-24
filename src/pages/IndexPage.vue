<template>
  <q-page class="q-pa-md">
    <div class="column q-gutter-y-md" style="max-width: 800px; width: 100%; margin: 0 auto">
      <!-- Logo en "is live!" tekst in een rij -->
      <div class="row items-center q-mb-md" style="width: 100%">
        <img src="/logo.png" alt="Logo" style="max-width: 150px; height: auto" />
        <div
          class="text-h2 text-negative q-ml-md"
          style="font-weight: bold; font-family: 'Caveat', cursive"
        >
          is live!
        </div>
      </div>

      <!-- Development mode indicator -->
      <div v-if="isDevelopment" class="dev-mode-banner q-pa-sm q-mb-md">
        <q-banner class="bg-red-1 text-red-8">
          <template v-slot:avatar>
            <q-icon name="developer_mode" color="red-8" />
          </template>
          <strong>Development Mode</strong> - Voorbeelden en test content zijn zichtbaar
        </q-banner>
      </div>

      <!-- Actieve Events sectie - Altijd zichtbaar -->
      <div class="row q-col-gutter-md full-width custom-gutter q-mt-lg">
        <!-- Actieve events -->
        <div class="col-12 col-md-6">
          <q-card class="live-card">
            <q-card-section>
              <div class="row items-center q-mb-md">
                <q-icon name="event" color="primary" size="md" class="q-mr-sm" />
                <h2 class="text-h6 q-ma-none">Events van Vandaag</h2>
                <q-space />
                <q-btn
                  flat
                  round
                  icon="refresh"
                  @click="loadActiveEvents"
                  :loading="loadingActiveEvents"
                  size="sm"
                >
                  <q-tooltip>Vernieuwen</q-tooltip>
                </q-btn>
              </div>

              <!-- Loading state -->
              <div v-if="loadingActiveEvents" class="text-center q-pa-lg">
                <q-spinner color="primary" size="2em" />
                <p class="text-grey-6 q-mt-md">Events laden...</p>
              </div>

              <!-- Actieve events lijst -->
              <div v-else-if="activeEvents.length > 0" class="active-events-list">
                <div
                  v-for="event in activeEvents"
                  :key="event.id"
                  class="event-item q-pa-md q-mb-md bg-grey-1 rounded-borders cursor-pointer"
                  @click="goToLivePage(event)"
                >
                  <div class="row items-center">
                    <div class="col">
                      <div class="text-weight-medium text-primary">{{ event.name }}</div>
                      <div class="text-caption text-grey-6">
                        {{ formatEventDate(event.startdate) }}
                        <span v-if="event.starttime">
                          - {{ formatEventTime(event.starttime) }}</span
                        >
                      </div>
                      <div class="text-caption text-grey-5">
                        {{ event.expand?.course?.[0]?.name || 'Onbekende baan' }}
                      </div>
                    </div>
                    <div class="col-auto">
                      <q-icon name="live_tv" color="positive" size="sm" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Geen events van vandaag -->
              <div v-else class="text-center q-pa-lg">
                <q-icon name="event_busy" size="64px" color="grey-4" />
                <p class="text-grey-6 q-mt-md">Geen events van vandaag</p>
                <p class="text-caption text-grey-5 q-mt-sm">
                  Vandaag: {{ new Date().toLocaleDateString('nl-NL') }}
                </p>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Live statistieken - Alleen in development mode -->
        <div v-if="isDevelopment" class="col-12 col-md-6">
          <q-card class="dev-example-card">
            <q-card-section>
              <div class="row items-center q-mb-md">
                <q-icon name="analytics" color="primary" size="md" class="q-mr-sm" />
                <h2 class="text-h6 q-ma-none">Live Statistieken (Development)</h2>
              </div>

              <!-- Placeholder voor live statistieken -->
              <div class="text-center q-pa-lg">
                <q-icon name="trending_up" size="64px" color="grey-4" />
                <p class="text-grey-6 q-mt-md">Live statistieken worden hier getoond</p>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Recente activiteit - Alleen in development mode -->
        <div v-if="isDevelopment" class="col-12">
          <q-card class="dev-example-card">
            <q-card-section>
              <div class="row items-center q-mb-md">
                <q-icon name="update" color="primary" size="md" class="q-mr-sm" />
                <h2 class="text-h6 q-ma-none">Recente Activiteit (Development)</h2>
              </div>

              <!-- Placeholder voor recente activiteit -->
              <div class="text-center q-pa-lg">
                <q-icon name="history" size="64px" color="grey-4" />
                <p class="text-grey-6 q-mt-md">Recente activiteit wordt hier getoond</p>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Live Feed sectie - Alleen in development mode -->
      <div v-if="isDevelopment" class="row q-col-gutter-lg q-mt-lg">
        <!-- Live feed -->
        <div class="col-12 col-lg-8">
          <q-card class="dev-example-card">
            <q-card-section>
              <div class="row items-center q-mb-md">
                <q-icon name="rss_feed" color="primary" size="md" class="q-mr-sm" />
                <h2 class="text-h6 q-ma-none">Live Feed (Development)</h2>
              </div>

              <!-- Live feed content -->
              <div class="live-feed">
                <div class="feed-item q-pa-md q-mb-md bg-grey-1 rounded-borders">
                  <div class="row items-center">
                    <q-avatar color="primary" text-color="white" class="q-mr-md">
                      <q-icon name="person" />
                    </q-avatar>
                    <div class="col">
                      <div class="text-weight-medium">Jan Jansen</div>
                      <div class="text-caption text-grey-6">Startte een oefenronde op Baan 1</div>
                      <div class="text-caption text-grey-5">2 minuten geleden</div>
                    </div>
                  </div>
                </div>

                <div class="feed-item q-pa-md q-mb-md bg-grey-1 rounded-borders">
                  <div class="row items-center">
                    <q-avatar color="positive" text-color="white" class="q-mr-md">
                      <q-icon name="event" />
                    </q-avatar>
                    <div class="col">
                      <div class="text-weight-medium">Weekend Tournament</div>
                      <div class="text-caption text-grey-6">Event gestart met 12 deelnemers</div>
                      <div class="text-caption text-grey-5">5 minuten geleden</div>
                    </div>
                  </div>
                </div>

                <div class="feed-item q-pa-md q-mb-md bg-grey-1 rounded-borders">
                  <div class="row items-center">
                    <q-avatar color="warning" text-color="white" class="q-mr-md">
                      <q-icon name="sports_golf" />
                    </q-avatar>
                    <div class="col">
                      <div class="text-weight-medium">Piet Pietersen</div>
                      <div class="text-caption text-grey-6">Scoorde een hole-in-one op hole 3!</div>
                      <div class="text-caption text-grey-5">8 minuten geleden</div>
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Sidebar met statistieken - Alleen in development mode -->
        <div class="col-12 col-lg-4">
          <div class="column q-gutter-md">
            <!-- Actieve gebruikers -->
            <q-card class="dev-example-card">
              <q-card-section>
                <div class="row items-center q-mb-sm">
                  <q-icon name="people" color="primary" size="sm" class="q-mr-sm" />
                  <h3 class="text-subtitle1 q-ma-none">Actieve Gebruikers (Dev)</h3>
                </div>
                <div class="text-h4 text-primary q-mt-sm">24</div>
                <div class="text-caption text-grey-6">Momenteel online</div>
              </q-card-section>
            </q-card>

            <!-- Actieve rondes -->
            <q-card class="dev-example-card">
              <q-card-section>
                <div class="row items-center q-mb-sm">
                  <q-icon name="sports_golf" color="positive" size="sm" class="q-mr-sm" />
                  <h3 class="text-subtitle1 q-ma-none">Actieve Rondes (Dev)</h3>
                </div>
                <div class="text-h4 text-positive q-mt-sm">8</div>
                <div class="text-caption text-grey-6">Rondes in progress</div>
              </q-card-section>
            </q-card>

            <!-- Events vandaag -->
            <q-card class="dev-example-card">
              <q-card-section>
                <div class="row items-center q-mb-sm">
                  <q-icon name="event" color="warning" size="sm" class="q-mr-sm" />
                  <h3 class="text-subtitle1 q-ma-none">Events Vandaag (Dev)</h3>
                </div>
                <div class="text-h4 text-warning q-mt-sm">3</div>
                <div class="text-caption text-grey-6">Geplande events</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Productie content - Alleen in productie mode -->
      <div v-if="!isDevelopment" class="row q-col-gutter-lg q-mt-lg">
        <div class="col-12">
          <q-card>
            <q-card-section>
              <div class="text-center q-pa-lg">
                <q-icon name="construction" size="64px" color="primary" />
                <h3 class="text-h5 q-mt-md">Welkom bij Pitch & Putt</h3>
                <p class="text-body1 q-mt-md">
                  De live content wordt hier binnenkort getoond. Blijf op de hoogte van de laatste
                  updates!
                </p>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useAuthStore } from 'stores/auth';
import { getTodayEventsFilter } from 'src/utils/dateUtils';

const $q = useQuasar();
const router = useRouter();
const pb = usePocketbase();
const authStore = useAuthStore();

// Computed property om te controleren of we in development mode zijn
const isDevelopment = computed(() => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
});

const userLocation = ref<{ latitude: number; longitude: number } | null>(null);
const allEvents = ref([]);
const loading = ref(false);
const userActiveRounds = ref([]);
const userAllRounds = ref([]); // Alle rondes van de gebruiker (actief en afgerond)

// Actieve events voor homepage
const activeEvents = ref([]);
const loadingActiveEvents = ref(false);

// Computed property voor events in de buurt
const nearbyEvents = computed(() => {
  if (!userLocation.value || allEvents.value.length === 0) return [];

  const now = new Date();
  const thirtyMinutes = 30 * 60 * 1000; // 30 minuten in milliseconden

  return allEvents.value
    .filter((event) => {
      // Filter op afstand (300m = 0.3km)
      if (event.expand?.course?.[0]?.gps) {
        const distance = getDistance(
          userLocation.value.latitude,
          userLocation.value.longitude,
          event.expand.course[0].gps.latitude,
          event.expand.course[0].gps.longitude,
        );
        if (distance > 0.3) return false; // Meer dan 300m
      }

      // Filter op datum (vandaag)
      if (event.startdate) {
        const eventDate = new Date(event.startdate);
        const today = new Date();
        if (eventDate.toDateString() !== today.toDateString()) return false;
      }

      // Filter op tijd (30 minuten marge voor en na)
      if (event.starttime) {
        const eventTime = new Date(event.starttime);
        const timeDiff = Math.abs(eventTime.getTime() - now.getTime());
        if (timeDiff > thirtyMinutes) return false;
      } else {
        // Als er geen specifieke tijd is, toon het event alleen op de datum
        // (geen tijdfiltering)
      }

      return true;
    })
    .sort((a, b) => {
      // Sorteer op tijd van aanvang
      if (a.starttime && b.starttime) {
        return new Date(a.starttime).getTime() - new Date(b.starttime).getTime();
      }
      return 0;
    });
});

// Functie om afstand tussen twee GPS-punten te berekenen (Haversine-formule)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Functie om tijd te formatteren
function formatTime(timeString: string): string {
  if (!timeString) return '';
  const time = new Date(timeString);
  return time.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Functie om event kleur te bepalen
function getEventColor(event: any): string {
  // Als gebruiker het maximum heeft bereikt of een actieve ronde heeft, toon grijze kleur
  if (hasActiveRoundForEvent(event.id) || hasReachedMaxRounds(event.id)) {
    return 'grey';
  }

  if (event.expand?.status?.name?.toLowerCase() === 'actief') return 'positive';
  if (event.expand?.status?.name?.toLowerCase() === 'concept') return 'grey';
  return 'primary';
}

// Functie om event icoon te bepalen
function getEventIcon(event: any): string {
  return 'event';
}

// Functie om een event ronde te starten
async function startEventRound(event: any) {
  try {
    // Controleer of gebruiker al een actieve ronde heeft of het maximaal aantal ronden heeft bereikt
    if (hasActiveRoundForEvent(event.id) || hasReachedMaxRounds(event.id)) {
      const message = `Je hebt nog een actieve ronde of je hebt het maximaal aantal ronden (${event.rounds}) bereikt. Je kunt je rondes checken onder Mijn rondes in het usermenu aan de rechterkant.`;

      $q.notify({
        color: 'warning',
        message,
        icon: 'warning',
        timeout: 5000,
      });
      return;
    }

    // Maak een nieuwe ronde aan met event_id
    const roundData = {
      course: event.course[0], // Gebruik de course van het event
      created_by: authStore.user?.id,
      date: new Date().toISOString().split('T')[0], // Huidige datum
      time: new Date().toISOString(), // Huidige tijd
      event: event.id, // Link naar het event
      player: authStore.user?.id, // Speler is de huidige gebruiker
      public: false,
      notes: `Event: ${event.name}`,
    };

    const newRound = await pb.collection('rounds').create(roundData);

    $q.notify({
      color: 'positive',
      message: `Event ronde gestart voor ${event.name}`,
      icon: 'check',
    });

    // Navigeer naar de ronde scores pagina
    router.push({ name: 'ronde-scores', params: { id: newRound.id } });
  } catch (error) {
    console.error('Fout bij starten event ronde:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij starten van de event ronde',
      icon: 'error',
    });
  }
}

// Functie om gebruikerslocatie op te halen
function getUserLocation(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocatie niet beschikbaar'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation.value = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        resolve();
      },
      (error) => {
        console.warn('Kon locatie niet ophalen:', error);
        resolve(); // Resolve zonder locatie
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minuten cache
      },
    );
  });
}

// Functie om actieve rondes van de gebruiker op te halen
async function loadUserActiveRounds() {
  try {
    if (!authStore.user?.id) {
      userActiveRounds.value = [];
      return;
    }

    // Haal alle rondes van de gebruiker op en filter in JavaScript
    const result = await pb.collection('rounds').getList(1, 100, {
      filter: `player = "${authStore.user.id}"`,
      expand: 'event,status',
    });

    // Filter op niet-afgeronde status in JavaScript
    userActiveRounds.value = result.items.filter((round) => {
      return round.status !== '9hi1lv607ibh7kz'; // Niet afgerond
    });

    console.log('Actieve rondes geladen:', userActiveRounds.value.length);
  } catch (error) {
    console.error('Fout bij laden actieve rondes:', error);
    userActiveRounds.value = [];
  }
}

// Functie om alle rondes van de gebruiker op te halen (voor maximum controle)
async function loadUserAllRounds() {
  try {
    if (!authStore.user?.id) {
      userAllRounds.value = [];
      return;
    }

    const result = await pb.collection('rounds').getList(1, 200, {
      filter: `player = "${authStore.user.id}"`, // Alle rondes
      expand: 'event,status',
    });

    userAllRounds.value = result.items;
    console.log('Alle rondes geladen:', result.items.length);
  } catch (error) {
    console.error('Fout bij laden alle rondes:', error);
    userAllRounds.value = [];
  }
}

// Functie om te controleren of gebruiker al een actieve ronde heeft voor een event
function hasActiveRoundForEvent(eventId: string): boolean {
  return userActiveRounds.value.some((round) => round.event === eventId);
}

// Functie om te controleren of gebruiker het maximaal aantal ronden heeft bereikt
function hasReachedMaxRounds(eventId: string): boolean {
  const event = allEvents.value.find((e) => e.id === eventId);
  if (!event || !event.rounds) return false;

  // Tel alle rondes (actief en afgerond) voor dit event
  const userRoundsForEvent = userAllRounds.value.filter((round) => round.event === eventId);
  return userRoundsForEvent.length >= event.rounds;
}

// Functie om alle events op te halen
async function loadEvents() {
  try {
    loading.value = true;

    const result = await pb.collection('events').getList(1, 50, {
      sort: 'startdate',
      expand: 'course,status',
      // Toon alle events voor nu (voor homepage overzicht)
    });

    allEvents.value = result.items;
    console.log('Events geladen:', result.items.length);
  } catch (error) {
    console.error('Fout bij laden events:', error);
    // Stel een lege array in bij fout
    allEvents.value = [];
  } finally {
    loading.value = false;
  }
}

// Functie om events van vandaag op te halen voor homepage
async function loadActiveEvents() {
  try {
    loadingActiveEvents.value = true;

    // Gebruik utility functie voor filter
    const filter = getTodayEventsFilter();
    console.log('Filter voor events van vandaag:', filter);

    // Haal events van vandaag op
    const result = await pb.collection('events').getList(1, 50, {
      filter,
      sort: 'startdate',
      expand: 'course,status',
    });

    // Toon alle events van vandaag
    activeEvents.value = result.items;

    console.log('Events van vandaag geladen:', activeEvents.value.length);
  } catch (error) {
    console.error('Fout bij laden events van vandaag:', error);
    // Stel een lege array in bij fout
    activeEvents.value = [];

    // Toon alleen een notificatie als het geen auto-cancellation is
    if (!error.message?.includes('autocancelled')) {
      $q.notify({
        color: 'negative',
        message: 'Fout bij laden van events van vandaag',
        icon: 'error',
      });
    }
  } finally {
    loadingActiveEvents.value = false;
  }
}

// Functie om naar live pagina te navigeren met event data
function goToLivePage(event: any) {
  // Navigeer naar live pagina met event parameters
  router.push({
    path: '/live',
    query: {
      course: event.course?.[0] || '',
      event: event.id,
    },
  });
}

// Functie om event datum te formatteren
function formatEventDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// Functie om event tijd te formatteren
function formatEventTime(timeString: string): string {
  if (!timeString) return '';
  const time = new Date(timeString);
  return time.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(async () => {
  // Haal alleen events op voor de homepage (zonder geolocatie en rondes)
  await Promise.all([loadEvents(), loadActiveEvents()]);

  // Geolocatie alleen ophalen als gebruiker interactie heeft gehad
  // Dit voorkomt de violation warning
});
</script>

<style>
.custom-gutter > .col-12 {
  padding-left: 0 !important;
}

.live-card {
  height: 100%;
  min-height: 200px;
}

.live-card .q-card__section {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Development mode styling */
.dev-example-card {
  background-color: #ffebee !important; /* Licht rode achtergrond */
  border: 2px solid #ffcdd2 !important; /* Donkerdere rode border */
}

.dev-example-card .q-card__section {
  background-color: #ffebee !important;
}

.dev-mode-banner {
  border-radius: 8px;
  overflow: hidden;
}
</style>
