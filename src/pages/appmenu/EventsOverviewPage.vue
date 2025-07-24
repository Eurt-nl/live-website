<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h4">Events</div>
    </div>

    <div v-if="loading" class="row justify-center">
      <q-spinner color="primary" size="3em" />
    </div>

    <div v-else-if="events.length === 0" class="text-center q-pa-lg">
      <div class="text-h6">Er zijn momenteel geen events gepland</div>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div v-for="event in events" :key="event.id" class="col-12 col-md-6 col-lg-4">
        <q-card class="cursor-pointer" @click="router.push(`/events/${event.id}`)">
          <q-card-section>
            <div class="row justify-between items-center">
              <div class="text-h6">{{ event.name }}</div>
              <q-chip
                :color="getStatusColor(event.expand?.status?.name)"
                text-color="white"
                size="sm"
              >
                {{ event.expand?.status?.name }}
              </q-chip>
            </div>
            <div class="text-subtitle2 q-mt-sm">{{ formatDate(event.startdate) }}</div>
            <div class="text-caption q-mt-sm">
              {{
                Array.isArray(event.expand?.course)
                  ? event.expand.course[0]?.name || 'Geen baan geselecteerd'
                  : event.expand?.course?.name || 'Geen baan geselecteerd'
              }}
            </div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div class="row items-center q-gutter-sm">
              <q-icon name="people" size="sm" />
              <span>{{ registrationsCount[event.id] || 0 }} deelnemers</span>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { usePocketbase } from 'src/composables/usePocketbase';

const router = useRouter();
const $q = useQuasar();
const pb = usePocketbase();

const events = ref([]);
const loading = ref(true);
const registrationsCount = ref({});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

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

const loadEvents = async () => {
  try {
    loading.value = true;
    console.log('Start loading events...');

    const result = await pb.collection('events').getList(1, 50, {
      sort: '-startdate',
      expand: 'status,course',
    });

    console.log('Events loaded:', result);
    events.value = result.items;

    // Haal voor elk event het aantal inschrijvingen op
    for (const event of events.value) {
      const regs = await pb.collection('registrations').getList(1, 1, {
        filter: `event = "${event.id}"`,
      });
      registrationsCount.value[event.id] = regs.totalItems;
    }
  } catch (error) {
    console.error('Error loading events:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het laden van de events: ' + error.message,
      icon: 'error',
      timeout: 5000,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadEvents();
});
</script>
