<template>
  <!-- Dialog voor het aanmaken van een oefenronde -->
  <q-dialog v-model="dialogModel">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Nieuwe oefenronde</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-form @submit="createRound" class="q-gutter-md">
          <!-- Selecteer een baan -->
          <q-select
            v-model="newRound.course"
            :options="courses"
            label="Baan"
            option-label="name"
            option-value="id"
            emit-value
            map-options
            :rules="[(val) => !!val || 'Baan is verplicht']"
          />
          <!-- Datum en tijd -->
          <q-input
            v-model="newRound.date"
            label="Datum en tijd"
            type="datetime-local"
            :rules="[(val) => !!val || 'Datum en tijd is verplicht']"
          />
          <!-- Notities -->
          <q-input v-model="newRound.notes" label="Notities" type="textarea" autogrow />
          <!-- Knoppen -->
          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Annuleren" color="primary" @click="closeDialog" />
            <q-btn type="submit" color="primary" label="Opslaan" :loading="loading" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
// -----------------------------
// Herbruikbare dialog voor oefenronde aanmaken
// -----------------------------
import { ref, watch, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';
import { usePocketbase } from 'src/composables/usePocketbase';
import type { Course } from './models';

// Props voor openen/sluiten van de dialog
const props = defineProps({
  modelValue: { type: Boolean, required: true },
});
const emit = defineEmits(['update:modelValue', 'round-created']);

// Computed property voor v-model op q-dialog (two-way binding)
const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const $q = useQuasar();
const authStore = useAuthStore();
const pb = usePocketbase();

const loading = ref(false);
const courses = ref([]);
const roundTypes = ref([]);
const statusTypes = ref([]);
const newRound = ref({
  course: '',
  date: '',
  notes: '',
});

// Dialog sluiten
function closeDialog() {
  emit('update:modelValue', false);
}

// Functie om afstand tussen twee GPS-punten te berekenen (Haversine-formule)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
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

// Helper om huidige datum/tijd te formatteren voor datetime-local input (altijd lokale tijd, geen tijdzone)
function getNowForInput() {
  const now = new Date();
  now.setSeconds(0, 0);
  // Haal lokale tijdscomponenten op
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

// Data ophalen bij openen dialog
watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      loading.value = true;
      try {
        // Haal alle banen op uit de view-collectie
        const coursesResult = await pb
          .collection('vw_courses_with_details')
          .getList(1, 50, { sort: 'name' });
        let allCourses = coursesResult.items;
        // Sorteer op afstand tot gebruiker indien locatie beschikbaar
        if (navigator.geolocation) {
          await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const { latitude, longitude } = pos.coords;
                allCourses = [...allCourses].sort((a, b) => {
                  if (!a.gps || !b.gps) return 0;
                  const distA = getDistance(latitude, longitude, a.gps.latitude, a.gps.longitude);
                  const distB = getDistance(latitude, longitude, b.gps.latitude, b.gps.longitude);
                  return distA - distB;
                });
                resolve();
              },
              () => resolve(),
              { enableHighAccuracy: false, timeout: 3000 },
            );
          });
        }
        courses.value = allCourses;

        const roundTypesResult = await pb.collection('categories').getList(1, 50, {
          filter: 'cat_type = "round"',
          sort: 'name',
        });
        roundTypes.value = roundTypesResult.items;
        const statusTypesResult = await pb.collection('categories').getList(1, 50, {
          filter: 'cat_type = "status"',
          sort: 'name',
        });
        statusTypes.value = statusTypesResult.items;
        // Standaard: huidige datum/tijd invullen
        let defaultDate = getNowForInput();
        let defaultCourse = '';
        // Probeer GPS-locatie op te halen en selecteer dichtstbijzijnde baan
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              let minDist = Infinity;
              let nearest = '';
              for (const c of courses.value as Course[]) {
                if (
                  c.gps &&
                  typeof c.gps.latitude === 'number' &&
                  typeof c.gps.longitude === 'number'
                ) {
                  const dist = getDistance(latitude, longitude, c.gps.latitude, c.gps.longitude);
                  if (dist < minDist) {
                    minDist = dist;
                    nearest = c.id;
                  }
                }
              }
              newRound.value.course = nearest;
            },
            (err) => {
              // Geen toestemming of fout: geen voorselectie
            },
            { enableHighAccuracy: false, timeout: 5000 },
          );
        }
        // Reset formulier met standaardwaarden
        newRound.value = { course: defaultCourse, date: defaultDate, notes: '' };
      } catch (error) {
        $q.notify({ color: 'negative', message: 'Fout bij laden van data', icon: 'error' });
      } finally {
        loading.value = false;
      }
    }
  },
  { immediate: false },
);

// Ronde aanmaken
async function createRound() {
  try {
    loading.value = true;
    // Zoek de concept status en oefenronde type
    const conceptStatus = statusTypes.value.find((s) => s.name.toLowerCase() === 'concept');
    const practiceType = roundTypes.value.find((t) => t.name.toLowerCase() === 'oefenronde');
    if (!conceptStatus) throw new Error('Geen concept status gevonden');
    if (!practiceType) throw new Error('Geen oefenronde type gevonden');
    const roundData = {
      course: newRound.value.course,
      player: authStore.user?.id,
      category: practiceType.id,
      status: conceptStatus.id,
      date: newRound.value.date ? new Date(newRound.value.date).toISOString() : '',
      notes: newRound.value.notes,
      created_by: authStore.user?.id,
    };
    await pb.collection('rounds').create(roundData);
    $q.notify({ color: 'positive', message: 'Ronde succesvol aangemaakt', icon: 'check' });
    emit('round-created');
    closeDialog();
  } catch (error) {
    $q.notify({ color: 'negative', message: 'Fout bij het aanmaken van de ronde', icon: 'error' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Duidelijke layout voor dialog */
</style>
