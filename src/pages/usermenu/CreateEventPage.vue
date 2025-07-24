<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5">{{ isEditing ? 'Event bewerken' : 'Nieuw event aanmaken' }}</div>
    </div>

    <q-card class="q-pa-md">
      <q-form @submit="onSubmit" class="q-gutter-md">
        <!-- Event naam -->
        <q-input
          v-model="form.name"
          label="Event naam"
          :rules="[(val) => !!val || 'Event naam is verplicht']"
          outlined
        />

        <!-- Baan selectie -->
        <q-select
          v-model="form.course"
          :options="courses"
          label="Baan"
          option-label="name"
          option-value="id"
          emit-value
          map-options
          :rules="[(val) => !!val || 'Baan is verplicht']"
          outlined
        />

        <!-- Maximaal aantal ronden -->
        <q-input
          v-model.number="form.rounds"
          label="Maximaal aantal ronden per speler"
          type="number"
          min="1"
          max="10"
          :rules="[(val) => (val && val > 0) || 'Aantal ronden moet minimaal 1 zijn']"
          outlined
        />

        <!-- Datum -->
        <q-input
          v-model="form.startdate"
          label="Datum"
          type="date"
          :rules="[(val) => !!val || 'Datum is verplicht']"
          outlined
        />

        <!-- Tijd -->
        <q-input v-model="form.starttime" label="Tijd" type="time" outlined />

        <!-- Recurring toggle -->
        <div v-if="!isEditing" class="q-mt-md">
          <div class="row items-center justify-between">
            <div class="text-subtitle1">Recurring events</div>
            <q-toggle v-model="isRecurring" color="primary" size="lg" />
          </div>
        </div>

        <!-- Recurring opties -->
        <div v-if="isRecurring" class="q-mt-md">
          <div class="text-subtitle2 q-mb-sm">Hoevaak herhalen?</div>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-select
                v-model="form.recurringInterval"
                :options="recurringIntervals"
                label="Welke interval wil je gebruiken?"
                outlined
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12">
              <q-input
                v-model.number="form.recurringCount"
                label="Hoe vaak herhalen?"
                type="number"
                min="2"
                max="52"
                :rules="[(val) => (val && val >= 2) || 'Minimaal 2 events vereist']"
                outlined
              />
            </div>
          </div>
        </div>

        <!-- Beschrijving (optioneel) -->
        <q-input
          v-model="form.description"
          label="Beschrijving (optioneel)"
          type="textarea"
          outlined
          rows="3"
        />

        <!-- Moderators -->
        <div class="q-mt-md">
          <div class="text-subtitle2 q-mb-sm">Moderators</div>
          <q-select
            v-model="form.moderators"
            :options="availableModerators"
            label="Voeg moderators toe"
            option-label="name"
            option-value="id"
            emit-value
            map-options
            multiple
            outlined
            use-chips
            use-counter
            hint="Moderators kunnen het event bewerken"
          />
        </div>

        <!-- Submit knoppen -->
        <div class="row justify-end q-gutter-sm">
          <q-btn label="Annuleren" color="grey" @click="$router.back()" flat />
          <q-btn
            :label="
              isEditing ? 'Event bijwerken' : isRecurring ? 'Events aanmaken' : 'Event aanmaken'
            "
            type="submit"
            color="primary"
            :loading="saving"
          />
        </div>
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useAuthStore } from 'stores/auth';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const pb = usePocketbase();
const authStore = useAuthStore();

const saving = ref(false);
const courses = ref([]);
const availableModerators = ref([]);
const isEditing = computed(() => !!route.query.edit);
const eventId = computed(() => route.query.edit as string);

const form = ref({
  name: '',
  startdate: '',
  starttime: '',
  course: null,
  description: '',
  rounds: 1, // Standaard 1 ronde
  moderators: [], // Moderators array
  // Recurring opties
  recurringCount: 2,
  recurringInterval: 'weeks',
});

const isRecurring = ref(false);

const recurringIntervals = [
  { label: 'Elke dag', value: 'days' },
  { label: 'Elke week', value: 'weeks' },
  { label: 'Elke maand', value: 'months' },
];

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

// Laad een bestaand event voor bewerking
const loadEvent = async (id: string) => {
  try {
    const event = await pb.collection('events').getOne(id, {
      expand: 'course',
    });

    // Vul het formulier met de event gegevens
    form.value.name = event.name;

    // Verwerk datum/tijd
    if (event.startdate) {
      // Split de string op spatie om datum en tijd te scheiden
      const parts = event.startdate.split(' ');
      form.value.startdate = parts[0];
      form.value.starttime = parts[1] ? parts[1].slice(0, 5) : '00:00';
    }

    form.value.course = event.course?.[0] || null;
    form.value.description = event.description || '';
    form.value.rounds = event.rounds || 1;
    form.value.moderators = event.moderators || [];
  } catch (error) {
    console.error('Fout bij laden event:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het laden van het event',
      icon: 'error',
    });
    router.back();
  }
};

// Laad beschikbare moderators
const loadModerators = async () => {
  try {
    const result = await pb.collection('users').getList(1, 100, {
      sort: 'name',
      fields: 'id,name,email',
    });

    availableModerators.value = result.items.map((user) => ({
      id: user.id,
      name: user.name || user.email,
      value: user.id,
      label: user.name || user.email,
    }));
  } catch (error) {
    console.error('Fout bij laden moderators:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het laden van moderators',
      icon: 'error',
    });
  }
};

// Laad banen waar de gebruiker eigenaar of moderator is
const loadCourses = async () => {
  try {
    const userId = authStore.user?.id;
    if (!userId) return;

    // Haal banen op waar de gebruiker eigenaar of moderator is
    const result = await pb.collection('courses').getList(1, 50, {
      filter: `owner = "${userId}" || moderators ?~ "${userId}"`,
      sort: 'name',
      expand: 'category',
    });

    // Sorteer op afstand tot gebruiker indien locatie beschikbaar
    let allCourses = result.items;
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

    courses.value = allCourses.map((course) => ({
      id: course.id,
      name: course.name,
      value: course.id,
      label: course.name,
    }));
  } catch (error) {
    console.error('Fout bij laden banen:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het laden van de banen',
      icon: 'error',
    });
  }
};

// Verwijderd: niet meer nodig met q-toggle
// const toggleRecurring = () => {
//   isRecurring.value = !isRecurring.value;
// };

// Functie om datum te verhogen met interval
const addIntervalToDate = (date: Date, value: number, interval: string): Date => {
  const newDate = new Date(date);
  switch (interval) {
    case 'days':
      newDate.setDate(newDate.getDate() + value);
      break;
    case 'weeks':
      newDate.setDate(newDate.getDate() + value * 7);
      break;
    case 'months':
      newDate.setMonth(newDate.getMonth() + value);
      break;
  }
  return newDate;
};

// Submit functie
const onSubmit = async () => {
  try {
    saving.value = true;

    if (isEditing.value) {
      // Update bestaand event (geen recurring voor bewerken)
      const eventData = {
        name: form.value.name,
        course: [form.value.course],
        startdate: form.value.starttime
          ? `${form.value.startdate} ${form.value.starttime}:00`
          : `${form.value.startdate} 00:00:00`,
        description: form.value.description || '',
        rounds: form.value.rounds,
        moderators: form.value.moderators,
      };

      await pb.collection('events').update(eventId.value, eventData);

      $q.notify({
        color: 'positive',
        message: `Event "${form.value.name}" succesvol bijgewerkt`,
        icon: 'check',
      });
    } else if (isRecurring.value) {
      // Maak meerdere events aan
      const eventsToCreate = [];
      let currentDate = new Date(form.value.startdate);

      for (let i = 0; i < form.value.recurringCount; i++) {
        const eventDate = currentDate.toISOString().split('T')[0];
        const eventTime = form.value.starttime || '00:00';

        const eventData = {
          name: `${form.value.name} ${i + 1}`,
          course: [form.value.course],
          startdate: `${eventDate} ${eventTime}:00`,
          description: form.value.description || '',
          rounds: form.value.rounds,
          owner: authStore.user?.id,
          moderators: form.value.moderators,
          enrolled: [],
          is_open: true,
          max_players: 72,
        };

        eventsToCreate.push(eventData);

        // Bereken volgende datum (standaard interval van 1)
        currentDate = addIntervalToDate(currentDate, 1, form.value.recurringInterval);
      }

      // Maak alle events aan
      for (const eventData of eventsToCreate) {
        await pb.collection('events').create(eventData);
      }

      $q.notify({
        color: 'positive',
        message: `${eventsToCreate.length} events succesvol aangemaakt`,
        icon: 'check',
      });
    } else {
      // Maak enkel event aan
      const eventData = {
        name: form.value.name,
        course: [form.value.course],
        startdate: form.value.starttime
          ? `${form.value.startdate} ${form.value.starttime}:00`
          : `${form.value.startdate} 00:00:00`,
        description: form.value.description || '',
        rounds: form.value.rounds,
        owner: authStore.user?.id,
        moderators: form.value.moderators,
        enrolled: [],
        is_open: true,
        max_players: 72,
      };

      await pb.collection('events').create(eventData);

      $q.notify({
        color: 'positive',
        message: `Event "${form.value.name}" succesvol aangemaakt`,
        icon: 'check',
      });
    }

    // Ga terug naar de vorige pagina
    router.back();
  } catch (error) {
    console.error('Fout bij opslaan event:', error);
    $q.notify({
      color: 'negative',
      message: isEditing.value
        ? 'Fout bij het bijwerken van het event'
        : 'Fout bij het aanmaken van het event',
      icon: 'error',
    });
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadCourses(), loadModerators()]);

  if (isEditing.value && eventId.value) {
    // Laad bestaand event voor bewerking
    await loadEvent(eventId.value);
  } else {
    // Stel standaard datum in op vandaag voor nieuw event
    const today = new Date();
    form.value.startdate = today.toISOString().split('T')[0];
  }
});
</script>
