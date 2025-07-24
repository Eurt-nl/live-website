<template>
  <q-page padding>
    <!-- Baanfilter: keuze uit alle banen of een specifieke baan -->
    <div class="row items-center q-mb-md">
      <q-select
        v-model="selectedCourseId"
        :options="courseOptions"
        label="Toon statistieken voor"
        dense
        outlined
        emit-value
        map-options
        style="min-width: 220px; max-width: 350px"
        clearable
        @update:model-value="onCourseFilterChange"
        class="q-mr-md"
      />
    </div>
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div class="text-subtitle1 row items-center">
            Mijn handicap:
            <!-- Info-icoon met tooltip en dialog -->
            <q-btn
              flat
              dense
              round
              icon="info"
              size="sm"
              class="q-ml-xs"
              @click="showInfoDialog = true"
            >
              <q-tooltip> Uitleg over de handicapberekening </q-tooltip>
            </q-btn>
          </div>
          <div class="text-h4 text-right" v-if="handicap !== null">
            {{ handicap > 0 ? '+' : '' }}{{ handicap.toFixed(1) }}
          </div>
          <div class="text-grey text-right" v-else>-</div>
        </div>
        <div v-if="loading" class="q-mt-md"><q-spinner size="md" color="primary" /></div>
        <!-- Tabel met handicap-ontwikkeling -->
        <div v-else>
          <div v-if="handicapTableData.length > 0">
            <q-table
              :rows="handicapTableData"
              :columns="handicapTableColumns"
              row-key="id"
              dense
              flat
              hide-bottom
              class="q-mb-md"
            >
              <template v-slot:body-cell-verschil="props">
                <q-td :props="props">
                  <span
                    :class="{ 'text-negative': props.value > 0, 'text-positive': props.value < 0 }"
                  >
                    {{ props.value > 0 ? '+' : '' }}{{ props.value }}
                  </span>
                </q-td>
              </template>
            </q-table>
          </div>
          <div v-if="filteredRounds.length < 5" class="text-grey q-mt-md">
            Je hebt nog niet genoeg afgeronde rondes om een handicap te berekenen (minimaal 5
            vereist).
          </div>
          <div v-else>
            <div class="text-subtitle2 q-mb-sm">Handicap ontwikkeling</div>
            <!-- Line chart van vue-chartjs, altijd up-to-date -->
            <Line
              :key="lineChartKey"
              :data="lineChartData"
              :options="lineChartOptions"
              style="max-width: 100%; min-height: 120px; height: 140px"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Dialog met uitleg over de handicapberekening -->
    <q-dialog v-model="showInfoDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Uitleg handicapberekening</div>
        </q-card-section>
        <q-card-section>
          <div>
            Je handicap wordt als volgt berekend:
            <ul>
              <li>Je moet minimaal 5 afgeronde rondes hebben.</li>
              <li>Bij 10 of minder rondes: het gemiddelde van de beste 5 scores t.o.v. par.</li>
              <li>
                Bij meer dan 10 rondes: het gemiddelde van de beste 5 scores uit de laatste 10
                rondes.
              </li>
              <li>
                De score per ronde is het totaal van je scores min het totaal par (aantal holes ×
                3).
              </li>
              <li>Een negatieve handicap betekent gemiddeld onder par, positief is boven par.</li>
            </ul>
            De grafiek toont de ontwikkeling van je handicap per gespeelde ronde.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Sluiten" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog met rondegegevens bij klik op grafiekpunt -->
    <q-dialog v-model="showRoundDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Ronde details</div>
        </q-card-section>
        <q-card-section v-if="selectedRound">
          <div><b>Datum:</b> {{ formatDate(selectedRound.date) }}</div>
          <div>
            <b>Baan:</b>
            {{
              (() => {
                const exp = selectedRound.round.expand;
                if (
                  exp &&
                  typeof exp === 'object' &&
                  'course' in exp &&
                  typeof exp.course === 'object' &&
                  exp.course &&
                  'name' in exp.course &&
                  typeof exp.course.name === 'string'
                ) {
                  return exp.course.name;
                }
                return '-';
              })()
            }}
          </div>
          <div><b>Score:</b> {{ selectedRound.totaalScore }}</div>
          <div><b>Par:</b> {{ selectedRound.par }}</div>
          <div>
            <b>Verschil:</b> {{ selectedRound.verschil > 0 ? '+' : '' }}{{ selectedRound.verschil }}
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Sluiten" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-subtitle2 row items-center">
            Per hole
            <q-btn
              flat
              dense
              round
              icon="info"
              size="sm"
              class="q-ml-xs"
              @click="showStatsInfoDialog = true"
            >
              <q-tooltip> Uitleg over de statistieken </q-tooltip>
            </q-btn>
          </div>
        </div>
        <div class="stats-table-wrap">
          <table class="stats-table compact-stats-table modern-stats-table">
            <thead>
              <tr>
                <th class="stat-label">Hole-in-one</th>
                <th class="stat-label">Birdie</th>
                <th class="stat-label">Par</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="stat-cell">
                  <span class="text-h6">{{ holeInOnes }}</span
                  ><br /><span class="stat-perc">{{ avgValues[0] }}</span>
                </td>
                <td class="stat-cell">
                  <span class="text-h6">{{ birdies }}</span
                  ><br /><span class="stat-perc">{{ avgValues[1] }}</span>
                </td>
                <td class="stat-cell">
                  <span class="text-h6">{{ pars }}</span
                  ><br /><span class="stat-perc">{{ avgValues[2] }}</span>
                </td>
              </tr>
            </tbody>
            <thead>
              <tr>
                <th class="stat-label">Bogey</th>
                <th class="stat-label">Dbl bogey</th>
                <th class="stat-label">Worse (&gt;5)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="stat-cell">
                  <span class="text-h6">{{ bogeys }}</span
                  ><br /><span class="stat-perc">{{ avgValues[3] }}</span>
                </td>
                <td class="stat-cell">
                  <span class="text-h6">{{ dblBogeys }}</span
                  ><br /><span class="stat-perc">{{ avgValues[4] }}</span>
                </td>
                <td class="stat-cell">
                  <span class="text-h6">{{ worse }}</span
                  ><br /><span class="stat-perc">{{ avgValues[5] }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </q-card-section>
    </q-card>

    <!-- Voeg de info-dialog toe voor uitleg over het gemiddelde per hole -->
    <q-dialog v-model="showStatsInfoDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Uitleg statistieken per hole</div>
        </q-card-section>
        <q-card-section>
          <div>
            In de tabel zie je per categorie het totaal aantal keer dat je deze score hebt behaald,
            en daaronder het percentage ten opzichte van het totaal aantal gespeelde holes.<br />
            Zo kun je eenvoudig zien hoe vaak je bijvoorbeeld een birdie of bogey slaat per hole.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Sluiten" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';
import { usePocketbase } from 'src/composables/usePocketbase';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { Course } from 'src/components/models';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  ChartDataLabels,
);

const $q = useQuasar();
const authStore = useAuthStore();
const pb = usePocketbase();

// Definieer een type voor een ronde-statistiek
interface RoundStat {
  id: string;
  date: string;
  verschil: number;
  totaalScore: number;
  aantalHoles: number;
  par: number;
  round: Record<string, unknown>;
  status: string;
  courseId: string;
}

const loading = ref(true);
const handicap = ref<number | null>(null);
const handicapRondes = ref<RoundStat[]>([]);
const handicapHistory = ref<{ date: string; handicap: number; roundStat: RoundStat }[]>([]);
const showRoundDialog = ref(false);
const selectedRound = ref<RoundStat | null>(null);
const showInfoDialog = ref(false);
const showStatsInfoDialog = ref(false);
const holeInOnes = ref(0);
const birdies = ref(0);
const pars = ref(0);
const bogeys = ref(0);
const dblBogeys = ref(0);
const worse = ref(0);
const selectedIndex = ref<number | null>(null);
const handicapRoundsCount = ref(0);

// Reactieve variabelen voor de baanfilter
const selectedCourseId = ref(''); // '' betekent alle banen
const courseOptions = ref<{ label: string; value: string }[]>([]);
const allCourses = ref<Course[]>([]);

// Verzamel alle rondes voor statistieken (ook als <5 rondes)
const allStatsRounds = ref<RoundStat[]>([]);

// Maak allScores een ref zodat deze overal beschikbaar is
const allScores = ref<{ round: string; score_player: number }[]>([]);

// Pas de berekening van avgValues aan zodat het percentage per scorecategorie wordt gedeeld door het totaal aantal gespeelde holes (allScores.length):
const totalScores = ref(1); // totaal aantal gespeelde holes (voor percentage)

// Reactieve array met de laatste 10 afgeronde rondes, gesorteerd op datum
const filteredRounds = computed(() => {
  // Filter op afgeronde rondes en eventueel op geselecteerde baan
  let rounds = allStatsRounds.value.filter((r) => r.status === 'afgerond');
  if (selectedCourseId.value) {
    rounds = rounds.filter((r) => r.courseId === selectedCourseId.value);
  }
  // Sorteer op datum (nieuwste eerst)
  rounds.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  // Pak de laatste 10 rondes (nieuwste eerst, daarna omdraaien voor grafiek)
  return rounds.slice(0, 10).reverse();
});

// Computed property voor de data-array van de grafiek (altijd alleen getallen)
const handicapData = computed(() => {
  // Map naar array van getallen (verschil t.o.v. par)
  return filteredRounds.value.map((r) => {
    // Zorg dat het altijd een getal is
    const diff = Number(r.verschil);
    return isNaN(diff) ? 0 : diff;
  });
});

// Unieke key voor de Line chart, zodat deze altijd forced re-rendered bij filter-wijzigingen
const lineChartKey = computed(() => {
  // Combineer courseId en aantal rondes voor unieke key
  return `${selectedCourseId.value || 'all'}-${handicapData.value.length}-${handicapData.value.join(',')}`;
});

// Opties voor de grafiek (minimalistisch, modern)
const lineChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (ctx) => `Handicap: ${ctx.parsed.y > 0 ? '+' : ''}${ctx.parsed.y}`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: false,
      ticks: {
        callback: (v) => (v > 0 ? '+' : '') + v,
      },
    },
  },
};

// Debug: log handicapData bij elke update
watch(handicapData, (val) => {
  console.debug('Handicap data voor grafiek:', val);
});

// Haal alle banen op waar de gebruiker rondes heeft gespeeld (of alle banen)
async function loadCoursesForStats(userId: string) {
  // Haal alle rondes op van de gebruiker (max 100)
  const roundsResult = await pb.collection('rounds').getList(1, 100, {
    filter: `player = "${userId}"`,
    expand: 'course',
    sort: '-date',
  });
  // Verzamel unieke course-ids
  const courseMap: Record<string, Course> = {};
  for (const round of roundsResult.items) {
    if (round.expand?.course) {
      courseMap[round.expand.course.id] = round.expand.course;
    }
  }
  // Zet opties voor QSelect
  const courseArr = Object.values(courseMap);
  allCourses.value = courseArr;
  courseOptions.value = [
    { label: 'Alle banen', value: '' },
    ...courseArr.map((c) => ({ label: c.name, value: c.id })),
  ];
}

// Formatteer datum als dd-mm-yyyy
function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('nl-NL');
}

// Haal alle afgeronde rondes van de gebruiker op en bereken de handicap + geschiedenis
onMounted(async () => {
  try {
    loading.value = true;
    const userId = authStore.user?.id;
    if (!userId) throw new Error('Geen gebruiker gevonden');
    // Laad de banen voor de QSelect
    await loadCoursesForStats(userId);
    // Status-id voor "afgerond" ophalen
    const statusResult = await pb
      .collection('categories')
      .getFirstListItem('cat_type="status" && name~"Afgerond"');
    if (!statusResult?.id) throw new Error('Status "Afgerond" niet gevonden');
    // Haal maximaal de laatste 30 afgeronde rondes op (voor grafiek/statistiek)
    const roundsResult = await pb.collection('rounds').getList(1, 30, {
      filter: `player = "${userId}" && status = "${statusResult.id}"`,
      sort: '-date',
      expand: 'course,category',
    });
    const rounds = roundsResult.items;
    if (!rounds.length || rounds.length < 5) {
      handicap.value = null;
      handicapRondes.value = [];
      handicapHistory.value = [];
      holeInOnes.value = 0;
      birdies.value = 0;
      pars.value = 0;
      bogeys.value = 0;
      dblBogeys.value = 0;
      worse.value = 0;
      return;
    }
    // Haal alle scores op voor deze rondes
    const roundIds = rounds.map((r) => r.id);
    let allScoresArr: { round: string; score_player: number }[] = [];
    for (let i = 0; i < roundIds.length; i += 10) {
      const batchIds = roundIds.slice(i, i + 10);
      const filter = batchIds.map((id) => `round = "${id}"`).join(' || ');
      const scoresResult = await pb.collection('round_scores').getList(1, 200, { filter });
      allScoresArr = allScoresArr.concat(
        (scoresResult.items as unknown[]).map((s) => {
          if (typeof s === 'object' && s !== null && 'round' in s && 'score_player' in s) {
            return {
              round: (s as { round: string }).round,
              score_player: (s as { score_player: number }).score_player,
            };
          }
          return { round: '', score_player: 0 };
        }),
      );
    }
    allScores.value = allScoresArr;
    totalScores.value = allScoresArr.length > 0 ? allScoresArr.length : 1;
    // Bereken per ronde het verschil t.o.v. par
    const roundStats = rounds
      .map((round) => {
        const scores = allScoresArr.filter(
          (s) => s.round === round.id && typeof s.score_player === 'number',
        );
        const totaalScore = scores.reduce((sum, s) => sum + s.score_player, 0);
        const aantalHoles = scores.length;
        const par = aantalHoles * 3;
        const verschil = aantalHoles > 0 ? totaalScore - par : null;
        return {
          id: round.id,
          date: round.date,
          totaalScore,
          aantalHoles,
          par,
          verschil,
          round,
          status: round.status,
          courseId: round.course,
        };
      })
      .filter((r) => r.verschil !== null);
    // Sorteer op datum (nieuwste eerst)
    roundStats.sort((a, b) => (b.date > a.date ? 1 : -1));
    // Selecteer de laatste 10 rondes (of minder)
    const laatste10 = roundStats.slice(0, 10);
    // Sorteer deze op verschil (beste eerst, dus laagste verschil)
    const beste5 = [...laatste10].sort((a, b) => a.verschil - b.verschil).slice(0, 5);
    if (beste5.length < 5) {
      handicap.value = null;
      handicapRondes.value = [];
      handicapHistory.value = [];
      holeInOnes.value = 0;
      birdies.value = 0;
      pars.value = 0;
      bogeys.value = 0;
      dblBogeys.value = 0;
      worse.value = 0;
      return;
    }
    handicap.value = beste5.reduce((sum, r) => sum + r.verschil, 0) / 5;
    handicapRondes.value = beste5;
    // Handicap-ontwikkeling berekenen: voor elke ronde vanaf de 5e, bereken het gemiddelde van de beste 5 van de laatste 10 tot dat moment
    const history: { date: string; handicap: number; roundStat: RoundStat }[] = [];
    for (let i = roundStats.length - 1; i >= 4; i--) {
      const slice = roundStats.slice(Math.max(0, i - 9), i + 1);
      const beste5hist = [...slice].sort((a, b) => a.verschil - b.verschil).slice(0, 5);
      if (beste5hist.length === 5) {
        const avg = beste5hist.reduce((sum, r) => sum + r.verschil, 0) / 5;
        // Koppel de ronde van het laatst toegevoegde punt (laatste in slice)
        history.push({
          date: slice[slice.length - 1].date,
          handicap: avg,
          roundStat: slice[slice.length - 1],
        });
      }
    }
    handicapHistory.value = [...history.reverse()];
    console.log('Handicap history lengte:', handicapHistory.value.length, handicapHistory.value);
    // Statistieken: tel aantal hole-in-ones (score 1), birdies (2), pars (3), bogeys (4), dbl bogeys (5), worse (>5)
    holeInOnes.value = allScoresArr.filter((s) => s.score_player === 1).length;
    birdies.value = allScoresArr.filter((s) => s.score_player === 2).length;
    pars.value = allScoresArr.filter((s) => s.score_player === 3).length;
    bogeys.value = allScoresArr.filter((s) => s.score_player === 4).length;
    dblBogeys.value = allScoresArr.filter((s) => s.score_player === 5).length;
    worse.value = allScoresArr.filter(
      (s) => typeof s.score_player === 'number' && s.score_player > 5,
    ).length;
    handicapRoundsCount.value = rounds.length;
    selectedIndex.value = maxIndexDisplay.value;
  } catch (error: unknown) {
    handicap.value = null;
    handicapRondes.value = [];
    handicapHistory.value = [];
    holeInOnes.value = 0;
    birdies.value = 0;
    pars.value = 0;
    bogeys.value = 0;
    dblBogeys.value = 0;
    worse.value = 0;
    handicapRoundsCount.value = 0;
    $q.notify({
      color: 'negative',
      message:
        'Fout bij berekenen handicap: ' +
        (error instanceof Error ? error.message : JSON.stringify(error)),
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
});

const avgValues = computed(() => {
  const n = totalScores.value || 1;
  return [
    ((holeInOnes.value / n) * 100).toFixed(1) + '%',
    ((birdies.value / n) * 100).toFixed(1) + '%',
    ((pars.value / n) * 100).toFixed(1) + '%',
    ((bogeys.value / n) * 100).toFixed(1) + '%',
    ((dblBogeys.value / n) * 100).toFixed(1) + '%',
    ((worse.value / n) * 100).toFixed(1) + '%',
  ];
});

const maxIndexDisplay = computed(() => {
  const vals = avgValues.value.map((v) => Number(v.replace('%', '')));
  let max = 0;
  let idx = 0;
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] > max) {
      max = vals[i];
      idx = i;
    }
  }
  return idx;
});

// Voeg in script setup een onCourseFilterChange functie toe die loadStats aanroept:
function onCourseFilterChange(val) {
  // Zorg dat wissen altijd '' wordt
  if (!val) selectedCourseId.value = '';
  loading.value = true;
  void loadStats().finally(() => {
    loading.value = false;
  });
}

// Pas loadStats aan zodat allStatsRounds altijd gevuld wordt met alle geselecteerde rondes
async function loadStats() {
  const userId = authStore.user?.id;
  if (!userId) return;
  // Status-id voor "afgerond" ophalen
  const statusResult = await pb
    .collection('categories')
    .getFirstListItem('cat_type="status" && name~"Afgerond"');
  if (!statusResult?.id) return;
  // Bouw filter op basis van gekozen baan
  let filter = `player = "${userId}" && status = "${statusResult.id}"`;
  if (
    selectedCourseId.value &&
    typeof selectedCourseId.value === 'string' &&
    selectedCourseId.value !== ''
  ) {
    filter += ` && course = "${selectedCourseId.value}"`;
  }
  // Haal maximaal de laatste 30 afgeronde rondes op (voor grafiek/statistiek)
  const roundsResult = await pb.collection('rounds').getList(1, 30, {
    filter,
    sort: '-date',
    expand: 'course,category',
  });
  const rounds = roundsResult.items;
  console.log('Aantal rondes voor handicap-berekening:', rounds.length, 'Filter:', filter);

  // Haal alle scores op voor deze rondes
  const roundIds = rounds.map((r) => r.id);
  let allScoresArr = [];
  for (let i = 0; i < roundIds.length; i += 10) {
    const batchIds = roundIds.slice(i, i + 10);
    const scoreFilter = batchIds.map((id) => `round = "${id}"`).join(' || ');
    const scoresResult = await pb
      .collection('round_scores')
      .getList(1, 200, { filter: scoreFilter });
    allScoresArr = allScoresArr.concat(
      (scoresResult.items as unknown[]).map((s) => {
        if (typeof s === 'object' && s !== null && 'round' in s && 'score_player' in s) {
          return {
            round: (s as { round: string }).round,
            score_player: (s as { score_player: number }).score_player,
          };
        }
        return { round: '', score_player: 0 };
      }),
    );
  }

  // Vul allStatsRounds met objecten die altijd een 'verschil' veld bevatten
  // Dit is essentieel voor de handicap-grafiek!
  const roundStats = rounds
    .map((round) => {
      const scores = allScoresArr.filter(
        (s) => s.round === round.id && typeof s.score_player === 'number',
      );
      const totaalScore = scores.reduce((sum, s) => sum + s.score_player, 0);
      const aantalHoles = scores.length;
      const par = aantalHoles * 3;
      const verschil = aantalHoles > 0 ? totaalScore - par : null;
      return {
        id: round.id,
        date: round.date,
        verschil,
        totaalScore,
        aantalHoles,
        par,
        round,
        status: round.status,
        courseId: round.course,
      };
    })
    .filter((r) => r.verschil !== null);
  allStatsRounds.value = roundStats;

  // Statistieken: tel aantal hole-in-ones (score 1), birdies (2), pars (3), bogeys (4), dbl bogeys (5), worse (>5) over alle rondes
  holeInOnes.value = allScoresArr.filter((s) => s.score_player === 1).length;
  birdies.value = allScoresArr.filter((s) => s.score_player === 2).length;
  pars.value = allScoresArr.filter((s) => s.score_player === 3).length;
  bogeys.value = allScoresArr.filter((s) => s.score_player === 4).length;
  dblBogeys.value = allScoresArr.filter((s) => s.score_player === 5).length;
  worse.value = allScoresArr.filter(
    (s) => typeof s.score_player === 'number' && s.score_player > 5,
  ).length;

  // Handicap en grafiek alleen tonen als er minimaal 5 rondes zijn
  if (!rounds.length || rounds.length < 5) {
    handicap.value = null;
    handicapRondes.value = [];
    handicapHistory.value = [];
    handicapRoundsCount.value = 0;
    return;
  }
  // ... bestaande code handicap/grafiek ...
  handicapRoundsCount.value = rounds.length;
}

// Computed property voor de tabeldata: laatste 10 afgeronde rondes, gesorteerd op datum (oud -> nieuw)
const handicapTableData = computed(() => {
  // Gebruik exact dezelfde bron als de grafiek
  return filteredRounds.value.map((r) => ({
    id: r.id,
    date: formatDate(r.date),
    totaalScore: r.totaalScore,
    par: r.par,
    verschil: r.verschil,
  }));
});

// Kolommen voor de q-table
const handicapTableColumns = [
  { name: 'date', label: 'Datum', field: 'date', align: 'left' as const, sortable: true },
  {
    name: 'totaalScore',
    label: 'Score',
    field: 'totaalScore',
    align: 'right' as const,
    sortable: true,
  },
  { name: 'par', label: 'Par', field: 'par', align: 'right' as const, sortable: true },
  {
    name: 'verschil',
    label: 'Verschil',
    field: 'verschil',
    align: 'right' as const,
    sortable: true,
  },
];

// Definitieve grafiekdata: gebruikt exact de tabel als bron
const lineChartData = computed(() => ({
  labels: handicapTableData.value.map((r) => r.date),
  datasets: [
    {
      label: 'Handicap (verschil t.o.v. par)',
      data: handicapTableData.value.map((r) => r.verschil),
      borderColor: '#1976d2',
      backgroundColor: 'rgba(25, 118, 210, 0.15)',
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: '#1976d2',
      fill: true,
    },
  ],
}));
</script>

<style scoped>
.text-right {
  text-align: right;
}
/* Kleinere fontgrootte voor de labels in de statistiekentabel */
.stat-label {
  font-size: 0.5rem;
}

/* Flexbox voor statistieken en donut naast elkaar */
.stats-flex-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.stats-table-wrap {
  flex: 1 1 60%;
  min-width: 0;
}
.stats-table {
  width: 100%;
  border-collapse: collapse;
}
.stats-donut-wrap {
  flex: 0 0 110px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stats-donut-inner {
  position: relative;
  width: 110px;
  height: 110px;
}
.stats-donut-center {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
@media (max-width: 600px) {
  .stats-flex-row {
    flex-direction: row;
    gap: 4px;
  }
  .stats-table-wrap {
    flex-basis: 60%;
  }
  .stats-donut-wrap {
    flex-basis: 40%;
  }
}
.stats-toggle-btn .q-btn {
  background: #fff;
  color: #1976d2;
}
.stats-toggle-btn .q-btn--active {
  background: #1976d2;
  color: #fff;
}
.stats-donut-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
.modern-stats-table th {
  font-size: 0.65rem;
  font-weight: 500;
  color: #666;
  background: none;
  border-bottom: 1px solid #eee;
  padding-bottom: 2px;
}
.modern-stats-table td {
  padding: 10px 8px;
  text-align: center;
  font-size: 1.1rem;
  background: none;
  border-bottom: none;
}
.stat-label {
  font-size: 0.85rem;
  font-weight: 400;
  color: #888;
  letter-spacing: 0.01em;
}
.stat-cell {
  text-align: center;
  line-height: 1.1;
  padding-top: 8px;
  padding-bottom: 8px;
}
.stat-perc {
  display: block;
  font-size: 0.65rem;
  color: #888;
  font-weight: 400;
  margin-top: 2px;
  line-height: 1.1;
}
</style>
