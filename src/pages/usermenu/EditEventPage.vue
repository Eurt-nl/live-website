<template>
  <!-- Hoofdpagina voor het aanmaken of bewerken van een evenement -->
  <div class="q-pa-md">
    <!-- Titelbalk met dynamische titel afhankelijk van nieuw/bewerken -->
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5">{{ isNew ? 'Nieuw evenement' : 'Evenement bewerken' }}</div>
    </div>

    <!-- Laadspinner als data wordt opgehaald -->
    <div v-if="loading" class="row justify-center">
      <q-spinner color="primary" size="3em" />
    </div>

    <!-- Formulier voor event (nieuw of bewerken) -->
    <div v-else-if="event || isNew" class="q-gutter-md">
      <!-- Titel en statuschip bij bewerken -->
      <div v-if="!isNew" class="row justify-between items-center">
        <div class="text-h4">Event bewerken - {{ event?.name }}</div>
        <!-- Statuschip met kleur afhankelijk van status -->
        <q-chip :color="getStatusColor(event?.expand?.status?.name)" text-color="white">
          {{ event?.expand?.status?.name }}
        </q-chip>
      </div>

      <q-card>
        <q-card-section>
          <!-- Formulier voor eventgegevens -->
          <q-form @submit="saveEvent" class="q-gutter-md">
            <div class="row q-col-gutter-md">
              <!-- Naam van het event -->
              <div class="col-12 col-md-6">
                <q-input
                  v-model="eventForm.name"
                  label="Event naam"
                  :rules="[(val) => !!val || 'Naam is verplicht']"
                  outlined
                />
              </div>

              <!-- Selectie van de baan -->
              <div class="col-12 col-md-6">
                <q-select
                  v-model="eventForm.course"
                  :options="courses"
                  option-label="name"
                  option-value="id"
                  label="Baan"
                  :rules="[(val) => !!val || 'Baan is verplicht']"
                  outlined
                />
              </div>

              <!-- Startdatum van het event -->
              <div class="col-12 col-md-6">
                <q-input
                  v-model="eventForm.start_date"
                  label="Start datum"
                  type="datetime-local"
                  :rules="[(val) => !!val || 'Start datum is verplicht']"
                  outlined
                  stack-label
                />
              </div>

              <!-- Einddatum van het event -->
              <div class="col-12 col-md-6">
                <q-input
                  v-model="eventForm.end_date"
                  label="Eind datum"
                  type="datetime-local"
                  :rules="[(val) => !!val || 'Eind datum is verplicht']"
                  outlined
                  stack-label
                />
              </div>

              <!-- Locatie van het event -->
              <div class="col-12 col-md-6">
                <q-input
                  v-model="eventForm.location"
                  label="Locatie"
                  :rules="[(val) => !!val || 'Locatie is verplicht']"
                  outlined
                />
              </div>

              <!-- Maximaal aantal deelnemers -->
              <div class="col-12 col-md-6">
                <q-input
                  v-model="eventForm.max_players"
                  label="Maximaal aantal deelnemers"
                  type="number"
                  :rules="[(val) => val > 0 || 'Aantal moet groter dan 0 zijn']"
                  outlined
                />
              </div>

              <!-- Beschrijving van het event -->
              <div class="col-12">
                <q-input
                  v-model="eventForm.description"
                  label="Beschrijving"
                  type="textarea"
                  outlined
                  autogrow
                />
              </div>

              <!-- Selectie van moderators (meerdere mogelijk) -->
              <div class="col-12">
                <q-select
                  v-model="eventForm.moderators"
                  :options="users"
                  option-label="name"
                  option-value="id"
                  label="Moderators"
                  multiple
                  outlined
                  use-chips
                />
              </div>
            </div>

            <!-- Actieknoppen onderaan het formulier -->
            <div class="row justify-end q-mt-md">
              <q-btn flat color="negative" label="Annuleren" @click="router.back()" />
              <q-btn
                type="submit"
                color="primary"
                label="Opslaan"
                :loading="saving"
                class="q-ml-sm"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>

    <!-- Fallback als event niet gevonden is -->
    <div v-else class="text-center">
      <div class="text-h6">Event niet gevonden</div>
      <q-btn flat color="primary" label="Terug" @click="router.back()" />
    </div>
  </div>
</template>

<script setup lang="ts">
// -----------------------------
// Imports en initialisatie
// -----------------------------
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useAuthStore } from 'src/stores/auth';

// Initialiseer router, Quasar, PocketBase en authenticatie-store
const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const pb = usePocketbase();
const authStore = useAuthStore();

// -----------------------------
// Reactieve variabelen en state
// -----------------------------
const event = ref(null); // Huidig event (voor bewerken)
const loading = ref(true); // Laadstatus voor spinner
const saving = ref(false); // Opslaan-status voor knop
const courses = ref([]); // Beschikbare banen
const users = ref([]); // Beschikbare gebruikers voor moderators

// Formulierdata voor event (nieuw of bewerken)
const eventForm = ref({
  name: '',
  course: null,
  start_date: '',
  end_date: '',
  location: '',
  max_players: 72,
  description: '',
  moderators: [],
});

// Bepalen of het een nieuw event is (anders: bewerken)
const isNew = computed(() => route.params.id === 'new');

// -----------------------------
// Helperfuncties
// -----------------------------
// Bepaal de kleur van de statuschip
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'concept':
      return 'grey';
    case 'actief':
      return 'primary';
    case 'afgerond':
      return 'positive';
    case 'geannuleerd':
      return 'negative';
    default:
      return 'grey';
  }
};

// -----------------------------
// Data ophalen
// -----------------------------
// Haal het event op (indien bewerken)
const loadEvent = async () => {
  try {
    loading.value = true;
    if (!isNew.value) {
      const result = await pb.collection('events').getOne(route.params.id as string, {
        expand: 'status,course,moderators',
      });
      event.value = result;

      // Vul het formulier met de bestaande gegevens
      eventForm.value = {
        name: result.name,
        course: result.course,
        start_date: result.start_date,
        end_date: result.end_date,
        location: result.location,
        max_players: result.max_players,
        description: result.description || '',
        moderators: result.moderators || [],
      };
    }
  } catch (error) {
    // Foutmelding bij mislukken
    console.error('Error loading event:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het laden van het event',
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};

// Haal alle banen op voor de selectielijst
const loadCourses = async () => {
  try {
    // Haal alle banen op uit de view-collectie
    const result = await pb.collection('vw_courses_with_details').getList(1, 50, { sort: 'name' });
    let allCourses = result.items;
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
  } catch (error) {
    // Foutmelding bij mislukken
    console.error('Error loading courses:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het laden van de banen',
      icon: 'error',
    });
  }
};

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

// Haal alle gebruikers op voor de moderators-selectie
const loadUsers = async () => {
  try {
    const result = await pb.collection('users').getList(1, 50, {
      sort: 'name',
    });
    users.value = result.items;
  } catch (error) {
    // Foutmelding bij mislukken
    console.error('Error loading users:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het laden van de gebruikers',
      icon: 'error',
    });
  }
};

// -----------------------------
// Opslaan van het event (nieuw of bewerken)
// -----------------------------
const saveEvent = async () => {
  try {
    saving.value = true;
    // Bouw het eventData object op voor PocketBase
    const eventData: {
      name: string;
      course: string;
      start_date: string;
      end_date: string;
      location: string;
      max_players: number;
      description: string;
      moderators: string[];
      owner: string;
      status?: string;
    } = {
      name: eventForm.value.name,
      course: eventForm.value.course,
      start_date: eventForm.value.start_date,
      end_date: eventForm.value.end_date,
      location: eventForm.value.location,
      max_players: eventForm.value.max_players,
      description: eventForm.value.description,
      moderators: eventForm.value.moderators,
      owner: authStore.user?.id,
    };

    if (isNew.value) {
      // Haal de 'concept' status op voor nieuwe events
      const statusResult = await pb.collection('categories').getList(1, 1, {
        filter: 'cat_type = "status" && name = "Concept"',
      });

      if (statusResult.items.length > 0) {
        eventData.status = statusResult.items[0].id;
      }

      await pb.collection('events').create(eventData);
    } else {
      await pb.collection('events').update(route.params.id as string, eventData);
    }

    // Succesmelding en terugnavigeren
    $q.notify({
      color: 'positive',
      message: isNew.value ? 'Event succesvol aangemaakt' : 'Event succesvol bijgewerkt',
      icon: 'check',
    });

    void router.back();
  } catch (error) {
    // Foutmelding bij mislukken
    console.error('Error saving event:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het opslaan van het event',
      icon: 'error',
    });
  } finally {
    saving.value = false;
  }
};

// -----------------------------
// Lifecycle: bij laden van de pagina
// -----------------------------
onMounted(async () => {
  // Haal event, banen en gebruikers tegelijk op
  await Promise.all([loadEvent(), loadCourses(), loadUsers()]);
});
</script>
