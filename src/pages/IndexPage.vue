<template>
  <q-page class="q-pa-md">
    <div class="column q-gutter-y-md" style="max-width: 1400px; width: 100%; margin: 0 auto">
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

      <!-- Hoofdcontent: Linker kolom met drie tabellen en rechter kolom met Live Feed -->
      <div class="row q-col-gutter-lg q-mt-lg">
        <!-- Linker kolom: Events van vandaag, Top 5 scores deze week, Top 5 scores deze maand -->
        <div class="col-12 col-md-6">
          <div class="column q-gutter-y-lg">
            <!-- Events van vandaag -->
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

            <!-- Top 5 scores deze week -->
            <q-card class="scores-card">
              <q-card-section>
                <div class="row items-center q-mb-md">
                  <q-icon name="leaderboard" color="warning" size="md" class="q-mr-sm" />
                  <h2 class="text-h6 q-ma-none">Top 5 Scores Deze Week</h2>
                  <q-space />
                  <q-btn
                    flat
                    round
                    icon="refresh"
                    @click="loadWeeklyScores"
                    :loading="loadingWeeklyScores"
                    size="sm"
                  >
                    <q-tooltip>Vernieuwen</q-tooltip>
                  </q-btn>
                </div>

                <!-- Loading state -->
                <div v-if="loadingWeeklyScores" class="text-center q-pa-lg">
                  <q-spinner color="warning" size="2em" />
                  <p class="text-grey-6 q-mt-md">Scores laden...</p>
                </div>

                <!-- Weekly scores tabel -->
                <div v-else-if="weeklyScores.length > 0" class="scores-table">
                  <q-table
                    :rows="weeklyScores"
                    :columns="scoreColumns"
                    row-key="id"
                    flat
                    bordered
                    hide-pagination
                    hide-bottom
                    class="scores-table-custom"
                  >
                    <template v-slot:body-cell-player="props">
                      <q-td :props="props">
                        <div class="row items-center">
                          <q-avatar size="32px" class="q-mr-sm">
                            <img
                              v-if="props.row.avatarUrl"
                              :src="props.row.avatarUrl"
                              :alt="props.row.playerName"
                            />
                            <q-icon v-else name="person" color="grey-4" />
                          </q-avatar>
                          <div>
                            <div class="text-weight-medium">{{ props.row.playerName }}</div>
                            <div class="text-caption text-grey-6">{{ props.row.courseName }}</div>
                            <div class="text-caption text-grey-5">
                              {{ props.row.eventName || 'Oefenronde' }}
                            </div>
                          </div>
                        </div>
                      </q-td>
                    </template>

                    <template v-slot:body-cell-score="props">
                      <q-td :props="props">
                        <div
                          class="text-weight-medium"
                          :class="getScoreTextColor(props.row.scoreVsPar)"
                        >
                          {{ props.row.scoreVsPar > 0 ? '+' : '' }}{{ props.row.scoreVsPar }}
                        </div>
                      </q-td>
                    </template>
                  </q-table>
                </div>

                <!-- Geen weekly scores -->
                <div v-else class="text-center q-pa-lg">
                  <q-icon name="leaderboard" size="64px" color="grey-4" />
                  <p class="text-grey-6 q-mt-md">Geen scores deze week</p>
                </div>
              </q-card-section>
            </q-card>

            <!-- Top 5 scores deze maand -->
            <q-card class="scores-card">
              <q-card-section>
                <div class="row items-center q-mb-md">
                  <q-icon name="emoji_events" color="deep-orange" size="md" class="q-mr-sm" />
                  <h2 class="text-h6 q-ma-none">Top 5 Scores Deze Maand</h2>
                  <q-space />
                  <q-btn
                    flat
                    round
                    icon="refresh"
                    @click="loadMonthlyScores"
                    :loading="loadingMonthlyScores"
                    size="sm"
                  >
                    <q-tooltip>Vernieuwen</q-tooltip>
                  </q-btn>
                </div>

                <!-- Loading state -->
                <div v-if="loadingMonthlyScores" class="text-center q-pa-lg">
                  <q-spinner color="deep-orange" size="2em" />
                  <p class="text-grey-6 q-mt-md">Scores laden...</p>
                </div>

                <!-- Monthly scores tabel -->
                <div v-else-if="monthlyScores.length > 0" class="scores-table">
                  <q-table
                    :rows="monthlyScores"
                    :columns="scoreColumns"
                    row-key="id"
                    flat
                    bordered
                    hide-pagination
                    hide-bottom
                    class="scores-table-custom"
                  >
                    <template v-slot:body-cell-player="props">
                      <q-td :props="props">
                        <div class="row items-center">
                          <q-avatar size="32px" class="q-mr-sm">
                            <img
                              v-if="props.row.avatarUrl"
                              :src="props.row.avatarUrl"
                              :alt="props.row.playerName"
                            />
                            <q-icon v-else name="person" color="grey-4" />
                          </q-avatar>
                          <div>
                            <div class="text-weight-medium">{{ props.row.playerName }}</div>
                            <div class="text-caption text-grey-6">{{ props.row.courseName }}</div>
                            <div class="text-caption text-grey-5">
                              {{ props.row.eventName || 'Oefenronde' }}
                            </div>
                          </div>
                        </div>
                      </q-td>
                    </template>

                    <template v-slot:body-cell-score="props">
                      <q-td :props="props">
                        <div
                          class="text-weight-medium"
                          :class="getScoreTextColor(props.row.scoreVsPar)"
                        >
                          {{ props.row.scoreVsPar > 0 ? '+' : '' }}{{ props.row.scoreVsPar }}
                        </div>
                      </q-td>
                    </template>
                  </q-table>
                </div>

                <!-- Geen monthly scores -->
                <div v-else class="text-center q-pa-lg">
                  <q-icon name="emoji_events" size="64px" color="grey-4" />
                  <p class="text-grey-6 q-mt-md">Geen scores deze maand</p>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Rechter kolom: Live Feed -->
        <div class="col-12 col-md-6">
          <q-card class="live-feed-card">
            <q-card-section>
              <div class="row items-center q-mb-md">
                <q-icon name="rss_feed" color="positive" size="md" class="q-mr-sm" />
                <h2 class="text-h6 q-ma-none">Live Feed</h2>
                <q-space />
                <q-chip
                  :color="liveFeedSubscription ? 'positive' : 'grey'"
                  :icon="liveFeedSubscription ? 'wifi' : 'wifi_off'"
                  size="sm"
                  dense
                >
                  {{ liveFeedSubscription ? 'Live' : 'Polling' }}
                </q-chip>
                <q-btn
                  flat
                  round
                  icon="refresh"
                  @click="loadLiveFeedData"
                  :loading="loadingLiveFeed"
                  size="sm"
                  class="q-ml-sm"
                >
                  <q-tooltip>Vernieuwen</q-tooltip>
                </q-btn>
              </div>

              <!-- Loading state -->
              <div v-if="loadingLiveFeed" class="text-center q-pa-lg">
                <q-spinner color="positive" size="2em" />
                <p class="text-grey-6 q-mt-md">Live feed laden...</p>
              </div>

              <!-- Live feed content -->
              <div v-else-if="liveFeedItems.length > 0" class="live-feed-content">
                <div
                  v-for="item in liveFeedItems"
                  :key="item.id"
                  class="feed-item q-pa-md q-mb-md bg-grey-1 rounded-borders"
                  :class="{ 'new-item': item.isNew }"
                >
                  <div class="row items-center">
                    <!-- Avatar/Logo links -->
                    <div class="col-auto q-mr-md">
                      <q-avatar size="48px" class="feed-avatar">
                        <img v-if="item.avatarUrl" :src="item.avatarUrl" :alt="item.playerName" />
                        <q-icon
                          v-else
                          :name="getFeedItemIcon(item.type)"
                          :color="getFeedItemColor(item.type)"
                          size="24px"
                        />
                      </q-avatar>
                    </div>

                    <!-- Content in het midden -->
                    <div class="col">
                      <div class="text-weight-medium">
                        {{ item.playerName || item.title }}: {{ item.description }}
                      </div>
                      <div class="text-caption text-grey-6">
                        <span v-if="item.type === 'event_start' && item.courseName">
                          {{ item.title }} | {{ item.courseName }}
                        </span>
                        <span v-else-if="item.eventName && item.courseName">
                          {{ item.eventName }} | {{ item.courseName }}
                        </span>
                        <span v-else-if="item.category && item.courseName">
                          {{ item.category }} ronde | {{ item.courseName }}
                        </span>
                        <span v-else-if="item.courseName">
                          Oefenronde | {{ item.courseName }}
                        </span>
                      </div>
                      <div class="text-caption text-grey-5">
                        {{ formatTimeAgo(item.timestamp) }}
                      </div>
                    </div>

                    <!-- Vlag rechts -->
                    <div class="col-auto q-ml-md">
                      <div class="country-flag">
                        <img
                          v-if="item.countryFlagUrl"
                          :src="item.countryFlagUrl"
                          :alt="item.countryName"
                        />
                        <q-icon v-else name="flag" color="grey-4" size="20px" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Geen live feed items -->
              <div v-else class="text-center q-pa-lg">
                <q-icon name="rss_feed" size="64px" color="grey-4" />
                <p class="text-grey-6 q-mt-md">Geen recente activiteit</p>
                <p class="text-caption text-grey-5 q-mt-sm">
                  Vandaag: {{ new Date().toLocaleDateString('nl-NL') }}
                </p>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Development mode content -->
      <div v-if="isDevelopment" class="row q-col-gutter-lg q-mt-lg">
        <!-- Live statistieken -->
        <div class="col-12 col-md-6">
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

        <!-- Recente activiteit -->
        <div class="col-12 col-md-6">
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
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { usePocketbase } from 'src/composables/usePocketbase';

import {
  getTodayEventsFilter,
  getTodayStart,
  getTomorrowStart,
  formatDateSQL,
} from 'src/utils/dateUtils';
import { getFileUrl } from 'src/utils/pocketbase-helpers';

const $q = useQuasar();
const router = useRouter();
const pb = usePocketbase();

// Computed property om te controleren of we in development mode zijn
const isDevelopment = computed(() => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
});

// State voor events van vandaag
const activeEvents = ref([]);
const loadingActiveEvents = ref(false);

// State voor live feed
const liveFeedItems = ref([]);
const loadingLiveFeed = ref(false);
const liveFeedSubscription = ref(null);

// State voor scores tabellen
const weeklyScores = ref([]);
const monthlyScores = ref([]);
const loadingWeeklyScores = ref(false);
const loadingMonthlyScores = ref(false);

// Auto-refresh interval voor live feed
let liveFeedInterval = null;

// Score tabel kolommen definitie
const scoreColumns = [
  {
    name: 'player',
    label: 'Speler',
    field: 'playerName',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'score',
    label: '',
    field: 'scoreVsPar',
    align: 'center' as const,
    sortable: true,
  },
];

// Interface voor live feed items
interface LiveFeedItem {
  id: string;
  type:
    | 'round_start'
    | 'round_finalized'
    | 'score'
    | 'event_start'
    | 'hole_in_one'
    | 'birdie'
    | 'par';
  title: string;
  description: string;
  timestamp: Date;
  playerName?: string;
  playerId?: string;
  courseName?: string;
  courseId?: string;
  eventName?: string;
  eventId?: string;
  category?: string;
  totalScore?: number;
  scoreVsPar?: number;
  countryName?: string;
  countryId?: string;
  avatarUrl?: string;
  countryFlagUrl?: string;
  isNew?: boolean;
}

// Functie om live feed data te laden
async function loadLiveFeedData() {
  try {
    loadingLiveFeed.value = true;

    const todayStart = getTodayStart();
    const tomorrowStart = getTomorrowStart();

    // Haal alle activiteit van vandaag op
    const feedItems: LiveFeedItem[] = [];

    // 1. Nieuwe rondes gestart vandaag
    try {
      const roundsResult = await pb.collection('rounds').getList(1, 50, {
        filter: `created >= "${formatDateSQL(todayStart)}" && created < "${formatDateSQL(tomorrowStart)}"`,
        sort: '-created',
        expand: 'player,player.homecourse,player.homecourse.country,course,event',
      });

      roundsResult.items.forEach((round) => {
        const playerName = round.expand?.player?.name || 'Onbekende speler';
        const courseName = round.expand?.course?.name || 'Onbekende baan';
        const eventName = round.expand?.event?.name;
        const category = round.category;
        const countryName = round.expand?.player?.expand?.homecourse?.expand?.country?.name;
        const countryId = round.expand?.player?.expand?.homecourse?.country;
        const countryFlag = round.expand?.player?.expand?.homecourse?.expand?.country?.flag;

        // Bepaal type ronde
        let roundType = 'oefenronde';
        if (eventName) {
          roundType = 'event ronde';
        } else if (category) {
          roundType = `${category} ronde`;
        }

        feedItems.push({
          id: `round_start_${round.id}`,
          type: 'round_start',
          title: playerName,
          description: `Startte een ${roundType} op ${courseName}`,
          timestamp: new Date(round.created),
          playerName,
          playerId: round.player,
          courseName,
          courseId: round.course,
          eventName,
          eventId: round.event,
          category,
          countryName,
          countryId,
          avatarUrl: round.expand?.player?.avatar
            ? getFileUrl('users', round.player, round.expand.player.avatar)
            : undefined,
          countryFlagUrl: getCountryFlagDataUrl(countryFlag) || getCountryFlagUrl(countryId),
        });
      });
    } catch (error) {
      console.error('Error loading rounds:', error);
    }

    // 1b. Gefinaliseerde rondes vandaag
    try {
      const finalizedRoundsResult = await pb.collection('rounds').getList(1, 50, {
        filter: `updated >= "${formatDateSQL(todayStart)}" && updated < "${formatDateSQL(tomorrowStart)}" && is_finalized = true`,
        sort: '-updated',
        expand: 'player,player.homecourse,player.homecourse.country,course,event',
      });

      for (const round of finalizedRoundsResult.items) {
        const playerName = round.expand?.player?.name || 'Onbekende speler';
        const courseName = round.expand?.course?.name || 'Onbekende baan';
        const eventName = round.expand?.event?.name;
        const category = round.category;
        const countryName = round.expand?.player?.expand?.homecourse?.expand?.country?.name;
        const countryId = round.expand?.player?.expand?.homecourse?.country;
        const countryFlag = round.expand?.player?.expand?.homecourse?.expand?.country?.flag;

        // Bereken totale score vs par
        const totalPar = 54; // Par voor 18 holes (par 3 per hole)
        const totalScore = await calculateTotalScore(round.id);
        const scoreVsPar = totalScore - totalPar;

        let scoreDescription = '';
        if (scoreVsPar < 0) {
          scoreDescription = `${scoreVsPar} vs par`;
        } else if (scoreVsPar === 0) {
          scoreDescription = `Par`;
        } else {
          scoreDescription = `+${scoreVsPar} vs par`;
        }

        feedItems.push({
          id: `round_finalized_${round.id}`,
          type: 'round_finalized',
          title: playerName,
          description: `Beëindigt de ronde met ${scoreDescription}`,
          timestamp: new Date(round.updated),
          playerName,
          playerId: round.player,
          courseName,
          courseId: round.course,
          eventName,
          eventId: round.event,
          category,
          totalScore,
          scoreVsPar,
          countryName,
          countryId,
          avatarUrl: round.expand?.player?.avatar
            ? getFileUrl('users', round.player, round.expand.player.avatar)
            : undefined,
          countryFlagUrl: getCountryFlagDataUrl(countryFlag) || getCountryFlagUrl(countryId),
        });
      }
    } catch (error) {
      console.error('Error loading finalized rounds:', error);
    }

    // 2. Nieuwe en bijgewerkte scores van vandaag
    try {
      const scoresResult = await pb.collection('round_scores').getList(1, 100, {
        filter: `(created >= "${formatDateSQL(todayStart)}" && created < "${formatDateSQL(tomorrowStart)}") || (updated >= "${formatDateSQL(todayStart)}" && updated < "${formatDateSQL(tomorrowStart)}")`,
        sort: '-updated',
        expand:
          'round,round.player,round.player.homecourse,round.player.homecourse.country,round.course,round.event,hole',
      });

      scoresResult.items.forEach((score) => {
        const playerName = score.expand?.round?.expand?.player?.name || 'Onbekende speler';
        const holeNumber = score.expand?.hole?.hole || 'onbekende hole';
        const scoreValue = score.score_player || 3;
        const eventName = score.expand?.round?.expand?.event?.name;
        const countryName =
          score.expand?.round?.expand?.player?.expand?.homecourse?.expand?.country?.name;
        const countryId = score.expand?.round?.expand?.player?.expand?.homecourse?.country;
        const countryFlag =
          score.expand?.round?.expand?.player?.expand?.homecourse?.expand?.country?.flag;

        // Bepaal of dit een nieuwe score is of een bijgewerkte score
        const isUpdated = score.updated !== score.created;
        const updateSuffix = isUpdated ? ' (updated)' : '';

        let type: LiveFeedItem['type'] = 'score';
        let description = `Scoorde een ${scoreValue} op hole ${holeNumber}${updateSuffix}`;

        // Bepaal type op basis van score (Pitch & Putt: par = 3)
        if (scoreValue === 1) {
          type = 'hole_in_one';
          description = `Hole-in-one op hole ${holeNumber}! 🎉${updateSuffix}`;
        } else if (scoreValue === 2) {
          type = 'birdie';
          description = `Birdie op hole ${holeNumber}! 🐦${updateSuffix}`;
        } else if (scoreValue === 3) {
          type = 'par';
          description = `Par op hole ${holeNumber}${updateSuffix}`;
        } else if (scoreValue === 4) {
          description = `Bogey op hole ${holeNumber}${updateSuffix}`;
        } else if (scoreValue === 5) {
          description = `Double bogey op hole ${holeNumber}${updateSuffix}`;
        } else if (scoreValue === 8) {
          description = `Snowman op hole ${holeNumber} ☃️${updateSuffix}`;
        } else if (scoreValue > 8) {
          description = `${scoreValue} slagen op hole ${holeNumber}${updateSuffix}`;
        }

        feedItems.push({
          id: `score_${score.id}`,
          type,
          title: playerName,
          description,
          timestamp: new Date(isUpdated ? score.updated : score.created),
          playerName,
          playerId: score.expand?.round?.player,
          courseName: score.expand?.round?.expand?.course?.name || 'Onbekende baan',
          courseId: score.expand?.round?.course,
          eventName,
          eventId: score.expand?.round?.event,
          countryName,
          countryId,
          avatarUrl: score.expand?.round?.expand?.player?.avatar
            ? getFileUrl(
                'users',
                score.expand.round.player,
                score.expand.round.expand.player.avatar,
              )
            : undefined,
          countryFlagUrl: getCountryFlagDataUrl(countryFlag) || getCountryFlagUrl(countryId),
        });
      });
    } catch (error) {
      console.error('Error loading scores:', error);
    }

    // 3. Events gestart vandaag
    try {
      const eventsResult = await pb.collection('events').getList(1, 20, {
        filter: `startdate >= "${formatDateSQL(todayStart)}" && startdate < "${formatDateSQL(tomorrowStart)}"`,
        sort: '-startdate',
        expand: 'course,course.country',
      });

      eventsResult.items.forEach((event) => {
        const courseName = event.expand?.course?.name || 'Onbekende baan';
        const countryName = event.expand?.course?.expand?.country?.name;
        const countryId = event.expand?.course?.country;
        const countryFlag = event.expand?.course?.expand?.country?.flag;

        feedItems.push({
          id: `event_${event.id}`,
          type: 'event_start',
          title: event.name,
          description: `Event gestart op ${courseName}`,
          timestamp: new Date(event.startdate),
          courseName,
          courseId: event.course,
          countryName,
          countryId,
          countryFlagUrl: getCountryFlagDataUrl(countryFlag) || getCountryFlagUrl(countryId),
        });
      });
    } catch (error) {
      console.error('Error loading events:', error);
    }

    // Sorteer op timestamp (nieuwste eerst) en beperk tot 10 items
    feedItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    liveFeedItems.value = feedItems.slice(0, 10);
  } catch (error) {
    console.error('Fout bij laden live feed data:', error);

    // Toon alleen notificatie als het geen auto-cancellation is
    if (!error.message?.includes('autocancelled')) {
      $q.notify({
        color: 'negative',
        message: 'Fout bij laden live feed',
        icon: 'error',
      });
    }
  } finally {
    loadingLiveFeed.value = false;
  }
}

// Functie om icoon te bepalen voor feed item type
function getFeedItemIcon(type: LiveFeedItem['type']): string {
  switch (type) {
    case 'round_start':
      return 'play_arrow';
    case 'round_finalized':
      return 'flag';
    case 'score':
      return 'sports_golf';
    case 'event_start':
      return 'event';
    case 'hole_in_one':
      return 'emoji_events';
    case 'birdie':
      return 'sports_golf';
    case 'par':
      return 'sports_golf';
    default:
      return 'info';
  }
}

// Functie om kleur te bepalen voor feed item type
function getFeedItemColor(type: LiveFeedItem['type']): string {
  switch (type) {
    case 'round_start':
      return 'primary';
    case 'round_finalized':
      return 'positive';
    case 'score':
      return 'grey-7';
    case 'event_start':
      return 'positive';
    case 'hole_in_one':
      return 'warning';
    case 'birdie':
      return 'blue';
    case 'par':
      return 'green';
    default:
      return 'grey-7';
  }
}

// Functie om tijd geleden te formatteren
function formatTimeAgo(timestamp: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) {
    return 'Zojuist';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minuten geleden`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} uur geleden`;
  } else {
    return timestamp.toLocaleDateString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

// Functie om score tekst kleur te bepalen
function getScoreTextColor(scoreVsPar: number): string {
  if (scoreVsPar < 0) {
    return 'text-positive'; // Groen voor onder par
  } else if (scoreVsPar === 0) {
    return 'text-grey-7'; // Grijs voor par
  } else {
    return 'text-negative'; // Rood voor boven par
  }
}

// Helper functie om vlag URL te genereren met fallback
function getCountryFlagUrl(countryId: string): string | undefined {
  if (!countryId) return undefined;

  try {
    // Probeer verschillende mogelijke vlag bestandsnamen
    const flagNames = ['flag.png', 'flag.jpg', 'flag.svg', 'flag.jpeg'];

    for (const flagName of flagNames) {
      const flagUrl = getFileUrl('countries', countryId, flagName);
      if (flagUrl) {
        return flagUrl;
      }
    }

    // Als geen vlag gevonden, return undefined (fallback naar icoon)
    return undefined;
  } catch (error) {
    console.warn('Error getting country flag URL:', error);
    return undefined;
  }
}

// Helper functie om totale score van een ronde te berekenen
async function calculateTotalScore(roundId: string): Promise<number> {
  try {
    const roundScores = await pb.collection('round_scores').getList(1, 50, {
      filter: `round = "${roundId}"`,
    });
    return roundScores.items.reduce((sum, score) => sum + (score.score_player || 0), 0);
  } catch (error) {
    console.warn('Could not load round scores for total calculation:', error);
    return 0;
  }
}

// Helper functie om base64 vlag data URL te genereren
function getCountryFlagDataUrl(flagBase64: string): string | undefined {
  if (!flagBase64) return undefined;

  try {
    // Controleer of het al een data URL is
    if (flagBase64.startsWith('data:')) {
      return flagBase64;
    }

    // Controleer of het een geldige base64 string is
    if (flagBase64.length > 0) {
      // Voeg data URL prefix toe (aanname dat het PNG is)
      return `data:image/png;base64,${flagBase64}`;
    }

    return undefined;
  } catch (error) {
    console.warn('Error creating flag data URL:', error);
    return undefined;
  }
}

// Start websocket subscription voor real-time updates
function startLiveFeedSubscription() {
  try {
    // Subscribe to rounds changes (create en update)
    liveFeedSubscription.value = pb.collection('rounds').subscribe('*', (e) => {
      if (e.action === 'create' || e.action === 'update') {
        // Reload live feed data
        void loadLiveFeedData().catch((error) => {
          console.error('Error reloading live feed data:', error);
        });
      }
    });

    // Subscribe to scores changes (create en update)
    void pb.collection('round_scores').subscribe('*', (e) => {
      if (e.action === 'create' || e.action === 'update') {
        // Reload live feed data
        void loadLiveFeedData().catch((error) => {
          console.error('Error reloading live feed data:', error);
        });
      }
    });
  } catch {
    // Fallback naar polling bij websocket errors
    startLiveFeedPolling();
  }
}

// Stop websocket subscription
function stopLiveFeedSubscription() {
  try {
    if (liveFeedSubscription.value) {
      void pb.collection('rounds').unsubscribe(liveFeedSubscription.value);
      liveFeedSubscription.value = null;
    }
  } catch {
    // Ignore cleanup errors
  }
}

// Start polling als fallback
function startLiveFeedPolling() {
  liveFeedInterval = setInterval(() => {
    void loadLiveFeedData().catch(() => {
      // Silent fail voor polling errors
    });
  }, 30000); // Elke 30 seconden
}

// Stop polling
function stopLiveFeedPolling() {
  if (liveFeedInterval) {
    clearInterval(liveFeedInterval);
    liveFeedInterval = null;
  }
}

// Functie om actieve events op te halen voor homepage
async function loadActiveEvents() {
  try {
    loadingActiveEvents.value = true;

    // Gebruik utility functie voor filter
    const filter = getTodayEventsFilter();

    // Haal events van vandaag op
    const result = await pb.collection('events').getList(1, 50, {
      filter,
      sort: 'startdate',
      expand: 'course,status',
    });

    // Toon alle events van vandaag
    activeEvents.value = result.items;
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
function goToLivePage(event: Record<string, unknown>) {
  // Navigeer naar live pagina met event parameters
  void router.push({
    path: '/live',
    query: {
      course: (event.course as string[])?.[0] || '',
      event: event.id as string,
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

// Functie om weekly scores te laden
async function loadWeeklyScores() {
  try {
    loadingWeeklyScores.value = true;

    // Bereken start van deze week (maandag)
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Maandag = 1, zondag = 0
    startOfWeek.setDate(now.getDate() - daysToSubtract);
    startOfWeek.setHours(0, 0, 0, 0);

    // Haal gefinaliseerde rondes van deze week op
    const result = await pb.collection('rounds').getList(1, 50, {
      filter: `is_finalized = true && updated >= "${formatDateSQL(startOfWeek)}"`,
      sort: '-updated',
      expand: 'player,player.homecourse,player.homecourse.country,course,event',
    });

    // Verwerk de scores
    const scores = [];
    for (const round of result.items) {
      const totalScore = await calculateTotalScore(round.id);
      const totalPar = 54; // Par voor 18 holes (par 3 per hole)
      const scoreVsPar = totalScore - totalPar;

      scores.push({
        id: round.id,
        playerName: round.expand?.player?.name || 'Onbekende speler',
        totalScore,
        scoreVsPar,
        courseName: round.expand?.course?.name || 'Onbekende baan',
        eventName: round.expand?.event?.name,
        avatarUrl: round.expand?.player?.avatar
          ? getFileUrl('users', round.player, round.expand.player.avatar)
          : undefined,
      });
    }

    // Sorteer op score (laagste eerst) en neem top 5
    scores.sort((a, b) => a.totalScore - b.totalScore);
    weeklyScores.value = scores.slice(0, 5);
  } catch (error) {
    console.error('Fout bij laden weekly scores:', error);
    weeklyScores.value = [];

    // Toon alleen notificatie als het geen auto-cancellation is
    if (!error.message?.includes('autocancelled')) {
      $q.notify({
        color: 'negative',
        message: 'Fout bij laden weekly scores',
        icon: 'error',
      });
    }
  } finally {
    loadingWeeklyScores.value = false;
  }
}

// Functie om monthly scores te laden
async function loadMonthlyScores() {
  try {
    loadingMonthlyScores.value = true;

    // Bereken start van deze maand
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Haal gefinaliseerde rondes van deze maand op
    const result = await pb.collection('rounds').getList(1, 50, {
      filter: `is_finalized = true && updated >= "${formatDateSQL(startOfMonth)}"`,
      sort: '-updated',
      expand: 'player,player.homecourse,player.homecourse.country,course,event',
    });

    // Verwerk de scores
    const scores = [];
    for (const round of result.items) {
      const totalScore = await calculateTotalScore(round.id);
      const totalPar = 54; // Par voor 18 holes (par 3 per hole)
      const scoreVsPar = totalScore - totalPar;

      scores.push({
        id: round.id,
        playerName: round.expand?.player?.name || 'Onbekende speler',
        totalScore,
        scoreVsPar,
        courseName: round.expand?.course?.name || 'Onbekende baan',
        eventName: round.expand?.event?.name,
        avatarUrl: round.expand?.player?.avatar
          ? getFileUrl('users', round.player, round.expand.player.avatar)
          : undefined,
      });
    }

    // Sorteer op score (laagste eerst) en neem top 5
    scores.sort((a, b) => a.totalScore - b.totalScore);
    monthlyScores.value = scores.slice(0, 5);
  } catch (error) {
    console.error('Fout bij laden monthly scores:', error);
    monthlyScores.value = [];

    // Toon alleen notificatie als het geen auto-cancellation is
    if (!error.message?.includes('autocancelled')) {
      $q.notify({
        color: 'negative',
        message: 'Fout bij laden monthly scores',
        icon: 'error',
      });
    }
  } finally {
    loadingMonthlyScores.value = false;
  }
}

onMounted(async () => {
  // Laad initiële data - gebruik individuele calls om beter om te gaan met errors
  try {
    await loadActiveEvents();
  } catch (error) {
    console.warn('Error loading active events:', error);
  }

  try {
    await loadLiveFeedData();
  } catch (error) {
    console.warn('Error loading live feed data:', error);
  }

  try {
    await loadWeeklyScores();
  } catch (error) {
    console.warn('Error loading weekly scores:', error);
  }

  try {
    await loadMonthlyScores();
  } catch (error) {
    console.warn('Error loading monthly scores:', error);
  }

  // Start real-time updates
  startLiveFeedSubscription();
});

onUnmounted(() => {
  stopLiveFeedSubscription();
  stopLiveFeedPolling();
});
</script>

<style lang="scss" scoped>
.live-card,
.live-feed-card,
.scores-card {
  height: 100%;
  min-height: 300px;
}

.live-card .q-card__section,
.live-feed-card .q-card__section,
.scores-card .q-card__section {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.scores-table {
  flex: 1;
  overflow: hidden;
}

.scores-table-custom {
  height: 100%;

  .q-table__top {
    display: none;
  }

  .q-table__bottom {
    display: none;
  }
}

.live-feed-content {
  max-height: 500px;
  overflow-y: auto;
}

.feed-item {
  transition: all 0.3s ease;
  border: 1px solid transparent;

  &:hover {
    background-color: rgba(76, 175, 80, 0.05) !important;
    border-color: rgba(76, 175, 80, 0.2);
  }

  &.new-item {
    animation: highlightNew 2s ease-in-out;
  }
}

@keyframes highlightNew {
  0% {
    background-color: rgba(76, 175, 80, 0.2);
    transform: scale(1.02);
  }
  100% {
    background-color: rgba(76, 175, 80, 0.05);
    transform: scale(1);
  }
}

.feed-avatar {
  border: 2px solid #e0e0e0;

  img {
    object-fit: cover;
  }
}

.country-flag {
  width: 32px;
  height: 24px;
  border: 1px solid #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
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

/* Responsive aanpassingen */
@media (max-width: 1023px) {
  .live-card,
  .live-feed-card,
  .scores-card {
    min-height: 250px;
  }

  .live-feed-content {
    max-height: 400px;
  }
}
</style>
