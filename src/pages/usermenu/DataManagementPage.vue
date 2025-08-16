<template>
  <q-page class="q-pa-md">
    <!-- Header sectie -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 text-weight-bold q-mb-sm">Data Beheer</h1>
        <p class="text-body1 text-grey-7">Beheer en controleer database records</p>
      </div>
    </div>

    <!-- Tabs voor verschillende collecties -->
    <q-tabs
      v-model="activeTab"
      dense
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="justify"
      narrow-indicator
    >
      <q-tab name="events" label="Events" />
      <q-tab name="rounds" label="Rondes" />
    </q-tabs>

    <q-separator class="q-mb-lg" />

    <!-- Events Tab Content -->
    <div v-if="activeTab === 'events'">
      <div class="row items-center q-mb-md">
        <div class="col">
          <h2 class="text-h6 q-ma-none">Events zonder Rondes</h2>
          <p class="text-caption text-grey-6">
            Events van gisteren en eerder die geen gekoppelde rondes hebben
          </p>
        </div>
        <div class="col-auto">
          <q-btn
            color="primary"
            icon="refresh"
            label="Vernieuwen"
            @click="loadEventsWithoutRounds"
            :loading="loadingEvents"
          />
        </div>
      </div>

      <!-- Events zonder rondes -->
      <div v-if="eventsWithoutRounds.length > 0">
        <q-list bordered separator>
          <q-item v-for="event in eventsWithoutRounds" :key="event.id" class="q-py-md">
            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ event.name }}
              </q-item-label>
              <q-item-label caption>
                {{ formatDate(event.startdate) }} - {{ formatDate(event.enddate) }}
              </q-item-label>
              <q-item-label caption>
                Baan: {{ courseNameCache[event.course] || 'Laden...' }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                flat
                round
                color="negative"
                icon="delete"
                size="sm"
                @click="deleteEvent(event)"
              >
                <q-tooltip>Verwijderen</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div v-else-if="!loadingEvents" class="text-center q-pa-lg">
        <q-icon name="check_circle" size="64px" color="positive" />
        <p class="text-grey-6 q-mt-md">Geen events zonder rondes gevonden</p>
      </div>
    </div>

    <!-- Rounds Tab Content -->
    <div v-if="activeTab === 'rounds'">
      <!-- Tabs voor verschillende ronde types -->
      <q-tabs
        v-model="activeRoundTab"
        dense
        class="text-grey q-mb-md"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="no-scores" label="Geen Scores" />
        <q-tab name="incomplete" label="Onvolledig" />
        <q-tab name="not-finished" label="Niet Afgesloten" />
      </q-tabs>

      <q-separator class="q-mb-md" />

      <!-- Geen Scores Tab -->
      <div v-if="activeRoundTab === 'no-scores'">
        <div class="row items-center q-mb-md">
          <div class="col">
            <h2 class="text-h6 q-ma-none">Rondes zonder Scores</h2>
            <p class="text-caption text-grey-6">
              Rondes van gisteren en eerder die geen gekoppelde scores hebben
            </p>
          </div>
          <div class="col-auto">
            <q-btn
              color="primary"
              icon="refresh"
              label="Vernieuwen"
              @click="loadRoundsWithoutScores"
              :loading="loadingRounds"
            />
          </div>
        </div>

        <div v-if="roundsWithoutScores.length > 0">
          <q-list bordered separator>
            <q-item v-for="round in roundsWithoutScores" :key="round.id" class="q-py-md">
              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ playerNameCache[round.player] || 'Laden...' }}
                </q-item-label>
                <q-item-label caption>
                  Event: {{ eventNameCache[round.event] || 'Laden...' }}
                </q-item-label>
                <q-item-label caption> Gestart: {{ formatDateTime(round.time) }} </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="delete"
                  size="sm"
                  @click="deleteRound(round)"
                >
                  <q-tooltip>Verwijderen</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div v-else-if="!loadingRounds" class="text-center q-pa-lg">
          <q-icon name="check_circle" size="64px" color="positive" />
          <p class="text-grey-6 q-mt-md">Geen rondes zonder scores gevonden</p>
        </div>
      </div>

      <!-- Onvolledige Rondes Tab -->
      <div v-if="activeRoundTab === 'incomplete'">
        <div class="row items-center q-mb-md">
          <div class="col">
            <h2 class="text-h6 q-ma-none">Onvolledige Rondes</h2>
            <p class="text-caption text-grey-6">
              Rondes van gisteren en eerder die niet alle holes hebben gescoord
            </p>
          </div>
          <div class="col-auto">
            <q-btn
              color="primary"
              icon="refresh"
              label="Vernieuwen"
              @click="loadIncompleteRounds"
              :loading="loadingRounds"
            />
          </div>
        </div>

        <div v-if="incompleteRounds.length > 0">
          <q-list bordered separator>
            <q-item v-for="round in incompleteRounds" :key="round.id" class="q-py-md">
              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ playerNameCache[round.player] || 'Laden...' }}
                </q-item-label>
                <q-item-label caption>
                  Event: {{ eventNameCache[round.event] || 'Laden...' }}
                </q-item-label>
                <q-item-label caption> Gestart: {{ formatDateTime(round.time) }} </q-item-label>
                <q-item-label caption>
                  Holes gescoord: {{ round.holesScored }}/{{ round.totalHoles }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="delete"
                  size="sm"
                  @click="deleteRound(round)"
                >
                  <q-tooltip>Verwijderen</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div v-else-if="!loadingRounds" class="text-center q-pa-lg">
          <q-icon name="check_circle" size="64px" color="positive" />
          <p class="text-grey-6 q-mt-md">Geen onvolledige rondes gevonden</p>
        </div>
      </div>

      <!-- Niet Afgesloten Rondes Tab -->
      <div v-if="activeRoundTab === 'not-finished'">
        <div class="row items-center q-mb-md">
          <div class="col">
            <h2 class="text-h6 q-ma-none">Niet Afgesloten Rondes</h2>
            <p class="text-caption text-grey-6">
              Rondes van gisteren en eerder die alle holes hebben maar niet gefinaliseerd zijn
            </p>
          </div>
          <div class="col-auto">
            <q-btn
              color="primary"
              icon="refresh"
              label="Vernieuwen"
              @click="loadUnfinishedRounds"
              :loading="loadingRounds"
            />
          </div>
        </div>

        <div v-if="unfinishedRounds.length > 0">
          <q-list bordered separator>
            <q-item v-for="round in unfinishedRounds" :key="round.id" class="q-py-md">
              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ playerNameCache[round.player] || 'Laden...' }}
                </q-item-label>
                <q-item-label caption>
                  Event: {{ eventNameCache[round.event] || 'Laden...' }}
                </q-item-label>
                <q-item-label caption> Gestart: {{ formatDateTime(round.time) }} </q-item-label>
                <q-item-label caption>
                  Status: {{ round.is_active ? 'Actief' : 'Inactief' }} |
                  {{ round.is_finalized ? 'Gefinaliseerd' : 'Niet gefinaliseerd' }}
                </q-item-label>

                <!-- Hole scores -->
                <div v-if="round.holeScores && round.holeScores.length > 0" class="q-mt-sm">
                  <q-item-label caption class="text-weight-medium">Hole Scores:</q-item-label>
                  <div class="row q-gutter-xs q-mt-xs">
                    <div
                      v-for="score in round.holeScores"
                      :key="score.hole_number"
                      class="col-auto"
                    >
                      <q-chip
                        :label="`${score.hole_number}: ${score.score_player}`"
                        size="sm"
                        :color="getHoleScoreColor(score.score_player)"
                        text-color="white"
                      />
                    </div>
                  </div>
                </div>
              </q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn
                    flat
                    round
                    color="positive"
                    icon="check"
                    size="sm"
                    @click="finalizeRound(round)"
                  >
                    <q-tooltip>Finalizeren</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    round
                    color="negative"
                    icon="delete"
                    size="sm"
                    @click="deleteRound(round)"
                  >
                    <q-tooltip>Verwijderen</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div v-else-if="!loadingRounds" class="text-center q-pa-lg">
          <q-icon name="check_circle" size="64px" color="positive" />
          <p class="text-grey-6 q-mt-md">Geen niet afgesloten rondes gevonden</p>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { usePocketbase } from 'src/composables/usePocketbase';

const $q = useQuasar();
const pb = usePocketbase();

// State
const activeTab = ref('events');
const activeRoundTab = ref('no-scores');
const loadingEvents = ref(false);
const loadingRounds = ref(false);
const eventsWithoutRounds = ref([]);
const roundsWithoutScores = ref([]);
const incompleteRounds = ref([]);
const unfinishedRounds = ref([]);

// Helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return 'Geen datum';
  return new Date(dateString).toLocaleDateString('nl-NL');
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return 'Geen datum';
  return new Date(dateString).toLocaleString('nl-NL');
};

// Cache voor banen namen
const courseNameCache = ref<Record<string, string>>({});

const getCourseName = async (courseId: string) => {
  if (!courseId) return 'Onbekende baan';

  // Check cache eerst
  if (courseNameCache.value[courseId]) {
    return courseNameCache.value[courseId];
  }

  try {
    // Haal baan naam op van PocketBase
    const course = await pb.collection('courses').getOne(courseId);
    const courseName = course.name || 'Onbekende baan';

    // Sla op in cache
    courseNameCache.value[courseId] = courseName;

    return courseName;
  } catch (error) {
    console.error('Error loading course name:', error);
    return 'Onbekende baan';
  }
};

// Cache voor speler namen
const playerNameCache = ref<Record<string, string>>({});

// Cache voor event namen
const eventNameCache = ref<Record<string, string>>({});

const getPlayerName = async (playerId: string) => {
  if (!playerId) return 'Onbekende speler';

  // Check cache eerst
  if (playerNameCache.value[playerId]) {
    return playerNameCache.value[playerId];
  }

  try {
    // Haal speler naam op van PocketBase
    const player = await pb.collection('users').getOne(playerId);
    const playerName = player.name || 'Onbekende speler';

    // Sla op in cache
    playerNameCache.value[playerId] = playerName;

    return playerName;
  } catch (error) {
    console.error('Error loading player name:', error);
    return 'Onbekende speler';
  }
};

const getEventName = async (eventId: string) => {
  if (!eventId) return 'Onbekend event';

  // Check cache eerst
  if (eventNameCache.value[eventId]) {
    return eventNameCache.value[eventId];
  }

  try {
    // Haal event naam op van PocketBase
    const event = await pb.collection('events').getOne(eventId);
    const eventName = event.name || 'Onbekend event';

    // Sla op in cache
    eventNameCache.value[eventId] = eventName;

    return eventName;
  } catch (error) {
    console.error('Error loading event name:', error);
    return 'Onbekend event';
  }
};

// Data loading functions
const loadEventsWithoutRounds = async () => {
  try {
    loadingEvents.value = true;

    // Bereken datum van gisteren (1 dag oud en eerder)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999); // Einde van gisteren

    // Haal alle events op
    const events = await pb.collection('events').getList(1, 1000, {
      sort: '-startdate',
    });

    // Haal alle rondes op
    const rounds = await pb.collection('rounds').getList(1, 1000);

    // Maak een set van event IDs die rondes hebben
    const eventsWithRounds = new Set(rounds.items.map((round) => round.event));

    // Filter events zonder rondes en alleen van gisteren en eerder
    eventsWithoutRounds.value = events.items.filter((event) => {
      // Check of event geen rondes heeft
      const hasNoRounds = !eventsWithRounds.has(event.id);

      // Check of event van gisteren of eerder is
      const eventDate = new Date(event.startdate);
      const isOldEnough = eventDate <= yesterday;

      return hasNoRounds && isOldEnough;
    });

    // Laad baan namen voor alle events
    for (const event of eventsWithoutRounds.value) {
      if (event.course && !courseNameCache.value[event.course]) {
        await getCourseName(event.course);
      }
    }
  } catch (error) {
    console.error('Error loading events without rounds:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij laden events',
      icon: 'error',
    });
  } finally {
    loadingEvents.value = false;
  }
};

const loadRoundsWithoutScores = async () => {
  try {
    loadingRounds.value = true;

    // Bereken datum van gisteren (1 dag oud en eerder)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    // Haal alle rondes op
    const rounds = await pb.collection('rounds').getList(1, 1000);

    // Haal alle scores op
    const scores = await pb.collection('round_scores').getList(1, 1000);

    // Maak een set van round IDs die scores hebben
    const roundsWithScores = new Set(scores.items.map((score) => score.round));

    // Filter rondes zonder scores en van gisteren en eerder
    roundsWithoutScores.value = rounds.items.filter((round) => {
      const hasNoScores = !roundsWithScores.has(round.id);
      const roundDate = new Date(round.time);
      const isOldEnough = roundDate <= yesterday;

      return hasNoScores && isOldEnough;
    });

    // Laad speler en event namen voor alle rondes
    for (const round of roundsWithoutScores.value) {
      if (round.player && !playerNameCache.value[round.player]) {
        await getPlayerName(round.player);
      }
      if (round.event && !eventNameCache.value[round.event]) {
        await getEventName(round.event);
      }
    }
  } catch (error) {
    console.error('Error loading rounds without scores:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij laden rondes',
      icon: 'error',
    });
  } finally {
    loadingRounds.value = false;
  }
};

const loadIncompleteRounds = async () => {
  try {
    loadingRounds.value = true;

    // Bereken datum van gisteren (1 dag oud en eerder)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    // Haal alle rondes op
    const rounds = await pb.collection('rounds').getList(1, 1000);

    // Haal alle scores op
    const scores = await pb.collection('round_scores').getList(1, 1000);

    // Haal alle events op om het aantal holes per event te bepalen
    const events = await pb.collection('events').getList(1, 1000, {
      expand: 'course',
    });

    // Haal alle course_detail op om het aantal holes per baan te bepalen
    const courseDetails = await pb.collection('course_detail').getList(1, 1000);

    // Groepeer scores per ronde
    const scoresPerRound = {};
    scores.items.forEach((score) => {
      if (!scoresPerRound[score.round]) {
        scoresPerRound[score.round] = [];
      }
      scoresPerRound[score.round].push(score);
    });

    // Filter onvolledige rondes
    incompleteRounds.value = rounds.items.filter((round) => {
      const roundDate = new Date(round.time);
      const isOldEnough = roundDate <= yesterday;

      if (!isOldEnough) return false;

      // Zoek het event en de baan
      const event = events.items.find((e) => e.id === round.event);
      if (!event) return false;

      const courseId = Array.isArray(event.course) ? event.course[0] : event.course;
      const holesForCourse = courseDetails.items.filter((h) => h.course === courseId);
      const totalHoles = holesForCourse.length;

      const roundScores = scoresPerRound[round.id] || [];
      const holesScored = roundScores.length;

      // Ronde is onvolledig als er minder holes zijn gescoord dan totaal
      const isIncomplete = holesScored < totalHoles && holesScored > 0;

      if (isIncomplete) {
        round.holesScored = holesScored;
        round.totalHoles = totalHoles;
      }

      return isIncomplete;
    });

    // Laad speler en event namen voor alle onvolledige rondes
    for (const round of incompleteRounds.value) {
      if (round.player && !playerNameCache.value[round.player]) {
        await getPlayerName(round.player);
      }
      if (round.event && !eventNameCache.value[round.event]) {
        await getEventName(round.event);
      }
    }
  } catch (error) {
    console.error('Error loading incomplete rounds:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij laden onvolledige rondes',
      icon: 'error',
    });
  } finally {
    loadingRounds.value = false;
  }
};

const loadUnfinishedRounds = async () => {
  try {
    loadingRounds.value = true;

    // Bereken datum van gisteren (1 dag oud en eerder)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    // Haal alle rondes op
    const rounds = await pb.collection('rounds').getList(1, 1000);

    // Haal alle scores op
    const scores = await pb.collection('round_scores').getList(1, 1000);

    // Haal alle events op om het aantal holes per event te bepalen
    const events = await pb.collection('events').getList(1, 1000, {
      expand: 'course',
    });

    // Haal alle course_detail op om het aantal holes per baan te bepalen
    const courseDetails = await pb.collection('course_detail').getList(1, 1000);

    // Groepeer scores per ronde
    const scoresPerRound = {};
    scores.items.forEach((score) => {
      if (!scoresPerRound[score.round]) {
        scoresPerRound[score.round] = [];
      }
      scoresPerRound[score.round].push(score);
    });

    // Filter niet gefinaliseerde rondes
    unfinishedRounds.value = rounds.items.filter((round) => {
      const roundDate = new Date(round.time);
      const isOldEnough = roundDate <= yesterday;

      if (!isOldEnough) return false;

      // Zoek het event en de baan
      const event = events.items.find((e) => e.id === round.event);
      if (!event) return false;

      const courseId = Array.isArray(event.course) ? event.course[0] : event.course;
      const holesForCourse = courseDetails.items.filter((h) => h.course === courseId);
      const totalHoles = holesForCourse.length;

      const roundScores = scoresPerRound[round.id] || [];
      const holesScored = roundScores.length;

      // Ronde heeft alle holes maar is niet gefinaliseerd
      const hasAllHoles = holesScored >= totalHoles;
      const isNotFinalized = !round.is_finalized;

      if (hasAllHoles && isNotFinalized) {
        // Voeg hole scores toe aan de ronde
        round.holeScores = roundScores.sort((a, b) => a.hole_number - b.hole_number);
        return true;
      }

      return false;
    });

    // Laad speler en event namen voor alle niet gefinaliseerde rondes
    for (const round of unfinishedRounds.value) {
      if (round.player && !playerNameCache.value[round.player]) {
        await getPlayerName(round.player);
      }
      if (round.event && !eventNameCache.value[round.event]) {
        await getEventName(round.event);
      }
    }
  } catch (error) {
    console.error('Error loading unfinished rounds:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij laden niet gefinaliseerde rondes',
      icon: 'error',
    });
  } finally {
    loadingRounds.value = false;
  }
};

// Delete functions
const deleteEvent = async (event: any) => {
  try {
    await $q.dialog({
      title: 'Event verwijderen',
      message: `Weet je zeker dat je het event "${event.name}" wilt verwijderen?`,
      cancel: true,
      persistent: true,
    });

    await pb.collection('events').delete(event.id);

    $q.notify({
      color: 'positive',
      message: 'Event succesvol verwijderd',
      icon: 'check',
    });

    // Herlaad de data
    await loadEventsWithoutRounds();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting event:', error);
      $q.notify({
        color: 'negative',
        message: 'Fout bij verwijderen event',
        icon: 'error',
      });
    }
  }
};

// Helper functie voor hole score kleuren
const getHoleScoreColor = (score) => {
  if (score <= 2) return 'positive'; // Eagle of beter
  if (score === 3) return 'primary'; // Par
  if (score === 4) return 'warning'; // Bogey
  if (score === 5) return 'orange'; // Double bogey
  return 'negative'; // Triple bogey of slechter
};

const deleteRound = async (round: any) => {
  try {
    await $q.dialog({
      title: 'Ronde verwijderen',
      message: `Weet je zeker dat je deze ronde wilt verwijderen?`,
      cancel: true,
      persistent: true,
    });

    await pb.collection('rounds').delete(round.id);

    $q.notify({
      color: 'positive',
      message: 'Ronde succesvol verwijderd',
      icon: 'check',
    });

    // Herlaad de data
    await loadRoundsWithoutScores();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting round:', error);
      $q.notify({
        color: 'negative',
        message: 'Fout bij verwijderen ronde',
        icon: 'error',
      });
    }
  }
};

const finalizeRound = async (round: any) => {
  try {
    await $q.dialog({
      title: 'Ronde finalizeren',
      message: `Weet je zeker dat je deze ronde wilt finalizeren? Dit maakt de ronde inactief en gefinaliseerd.`,
      cancel: true,
      persistent: true,
    });

    // Update de ronde: is_active = 0, is_finalized = 1
    await pb.collection('rounds').update(round.id, {
      is_active: 0,
      is_finalized: 1,
    });

    $q.notify({
      color: 'positive',
      message: 'Ronde succesvol gefinaliseerd',
      icon: 'check',
    });

    // Herlaad de data
    await loadUnfinishedRounds();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error finalizing round:', error);
      $q.notify({
        color: 'negative',
        message: 'Fout bij finalizeren ronde',
        icon: 'error',
      });
    }
  }
};

// Lifecycle
onMounted(() => {
  loadEventsWithoutRounds();
  loadRoundsWithoutScores();
});
</script>

<style lang="scss" scoped>
.q-tabs {
  border-bottom: 1px solid #e0e0e0;
}
</style>
