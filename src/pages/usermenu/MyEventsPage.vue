<template>
  <div class="q-pa-md">
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5">{{ showArchived ? 'Gearchiveerde events' : 'Mijn events' }}</div>
      <div v-if="!showArchived" class="row q-gutter-sm">
        <q-btn color="primary" icon="add" label="Nieuw event" :to="{ name: 'create-event' }" />
        <!-- Uitgebreid event knop verborgen voor later gebruik -->
        <!--
        <q-btn
          color="secondary"
          icon="settings"
          label="Uitgebreid event"
          :to="{ name: 'event-form', params: { id: 'new' } }"
        />
        -->
      </div>
    </div>

    <!-- Events lijst -->
    <div class="row q-col-gutter-md">
      <div v-for="event in events" :key="event.id" class="col-12 col-sm-6 col-md-4">
        <q-slide-item
          v-if="!showArchived"
          @left="canArchiveEvent(event) ? archiveEvent(event) : null"
          @right="confirmDelete(event)"
          left-color="canArchiveEvent(event) ? 'primary' : 'grey'"
          right-color="negative"
        >
          <template v-slot:left>
            <div class="row items-center"><q-icon name="archive" /></div>
          </template>
          <template v-slot:right>
            <div class="row items-center"><q-icon name="delete" /></div>
          </template>
          <!-- Event kaart met nieuwe layout -->
          <q-card flat bordered>
            <q-card-section class="q-pa-sm">
              <!-- Rij met naam, subtitel en menu -->
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-h6">{{ event.name }}</div>
                  <div class="text-subtitle2">
                    {{ event.expand?.course?.[0]?.name || 'Geen baan' }}
                  </div>
                </div>
                <div class="col-auto">
                  <!-- Drie-stippen menu voor acties -->
                  <q-btn color="primary" round flat icon="more_vert">
                    <q-menu cover auto-close>
                      <q-list>
                        <q-item
                          clickable
                          @click="() => editEvent(event.id)"
                          :disable="isEventStarted(event)"
                        >
                          <q-item-section>
                            Bewerken
                            <q-item-label caption v-if="isEventStarted(event)">
                              Event is al gestart
                            </q-item-label>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </div>
              </div>
              <!-- Twee regels met relevante info -->
              <div class="q-mt-sm">
                <div class="text-body2">
                  Startdatum/-tijd: {{ formatDate(event.startdate) }}
                  <span v-if="event.starttime">/ {{ event.starttime }}</span>
                </div>
                <div class="text-body2">Max. aantal rondes: {{ event.rounds || '-' }}</div>
              </div>
              <!-- Chips met status, eigenaar, moderator, deelnemer (max 4 op 1 regel, rechts uitgelijnd) -->
              <div
                class="q-mt-sm row items-center no-wrap justify-end"
                style="gap: 4px; flex-wrap: nowrap; overflow-x: auto"
              >
                <q-chip
                  :color="getStatusColor(event.expand?.status?.name)"
                  text-color="white"
                  size="sm"
                  v-if="event.expand?.status?.name"
                  outline
                  square
                >
                  {{ event.expand?.status?.name }}
                </q-chip>
                <q-chip
                  v-if="isOwner(event)"
                  color="primary"
                  text-color="white"
                  size="sm"
                  outline
                  square
                >
                  Eigenaar
                </q-chip>
                <q-chip
                  v-if="isModerator(event)"
                  color="secondary"
                  text-color="white"
                  size="sm"
                  outline
                  square
                >
                  Moderator
                </q-chip>
                <q-chip
                  v-if="isEnrolled(event)"
                  color="positive"
                  text-color="white"
                  size="sm"
                  outline
                  square
                >
                  Deelnemer
                </q-chip>
              </div>
            </q-card-section>
          </q-card>
        </q-slide-item>
        <!-- Gearchiveerde events: zelfde layout, geen swipe -->
        <q-card v-else flat bordered>
          <q-card-section class="q-pa-sm">
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-h6">{{ event.name }}</div>
                <div class="text-subtitle2">
                  {{ event.expand?.course?.[0]?.name || 'Geen baan' }}
                </div>
              </div>
              <div class="col-auto">
                <q-btn color="primary" round flat icon="more_vert">
                  <q-menu cover auto-close>
                    <q-list>
                      <q-item
                        clickable
                        @click="() => editEvent(event.id)"
                        :disable="isEventStarted(event)"
                      >
                        <q-item-section>
                          Bewerken
                          <q-item-label caption v-if="isEventStarted(event)">
                            Event is al gestart
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>
            </div>
            <div class="q-mt-sm">
              <div class="text-body2">
                Startdatum/-tijd: {{ formatDate(event.startdate) }}
                <span v-if="event.starttime">/ {{ event.starttime }}</span>
              </div>
              <div class="text-body2">Max. aantal rondes: {{ event.rounds || '-' }}</div>
            </div>
            <div
              class="q-mt-sm row items-center no-wrap justify-end"
              style="gap: 4px; flex-wrap: nowrap; overflow-x: auto"
            >
              <q-chip
                :color="getStatusColor(event.expand?.status?.name)"
                text-color="white"
                size="sm"
                v-if="event.expand?.status?.name"
                outline
                square
              >
                {{ event.expand?.status?.name }}
              </q-chip>
              <q-chip
                v-if="isOwner(event)"
                color="primary"
                text-color="white"
                size="sm"
                outline
                square
              >
                Eigenaar
              </q-chip>
              <q-chip
                v-if="isModerator(event)"
                color="secondary"
                text-color="white"
                size="sm"
                outline
                square
              >
                Moderator
              </q-chip>
              <q-chip
                v-if="isEnrolled(event)"
                color="positive"
                text-color="white"
                size="sm"
                outline
                square
              >
                Deelnemer
              </q-chip>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div v-if="events.length === 0" class="text-center q-mt-lg">
      <div class="text-h6">Geen events gevonden</div>
    </div>

    <!-- Verwijder bevestiging dialog -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">Event verwijderen</div>
        </q-card-section>
        <q-card-section>
          <p>Weet je zeker dat je het event "{{ selectedEvent?.name }}" wilt verwijderen?</p>
          <p class="text-caption">Deze actie kan niet ongedaan worden gemaakt.</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Annuleren" color="primary" v-close-popup />
          <q-btn
            flat
            label="Verwijderen"
            color="negative"
            @click="deleteEvent"
            :loading="deleting"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';
import { usePocketbase } from 'src/composables/usePocketbase';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const pb = usePocketbase();

const events = ref([]);
const loading = ref(false);
const showDeleteDialog = ref(false);
const selectedEvent = ref(null);
const deleting = ref(false);
const showArchived = ref(false);
const archivedCount = ref(0);
const footerButtons = inject('footerButtons');

// Verwijderd: deze variabelen zijn niet meer nodig
// const roundsCount = ref({});
// const registrationsCount = ref({});

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

const isOwner = (event) => {
  return event.owner === authStore.user?.id;
};

const isModerator = (event) => {
  return event.moderators?.includes(authStore.user?.id);
};

const isEnrolled = (event) => {
  return event.enrolled?.includes(authStore.user?.id);
};

const isArchivedByMe = (event) => {
  return Array.isArray(event.archived_by) && event.archived_by.includes(authStore.user?.id);
};

// Controleer of een event gestart is (datum/tijd is voorbij)
const isEventStarted = (event) => {
  if (!event.startdate) return false;
  const eventDate = new Date(event.startdate);
  const now = new Date();
  return eventDate < now;
};

// Controleer of een event gearchiveerd kan worden (datum is voorbij)
const canArchiveEvent = (event) => {
  if (!event.startdate) return false;
  const eventDate = new Date(event.startdate);
  const today = new Date();
  // Reset tijd naar middernacht voor vergelijking
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  return eventDate < today;
};

const loadEvents = async () => {
  try {
    loading.value = true;
    const baseFilter = `owner = "${authStore.user?.id}" || moderators ?~ "${authStore.user?.id}" || enrolled ?~ "${authStore.user?.id}"`;
    const archiveFilter = showArchived.value
      ? `${baseFilter} && archived_by ?~ "${authStore.user?.id}"`
      : `${baseFilter} && (archived_by = null || archived_by ?!~ "${authStore.user?.id}")`;
    const eventsResult = await pb.collection('events').getList(1, 50, {
      filter: archiveFilter,
      sort: 'startdate',
      expand: 'course,status',
    });

    // Extra frontend filter voor zekerheid
    if (showArchived.value) {
      events.value = eventsResult.items.filter(
        (e) => Array.isArray(e.archived_by) && e.archived_by.includes(authStore.user.id),
      );
    } else {
      events.value = eventsResult.items.filter(
        (e) => !Array.isArray(e.archived_by) || !e.archived_by.includes(authStore.user.id),
      );
    }

    // Haal het aantal gearchiveerde events op waar user owner of moderator is
    const archivedResult = await pb.collection('events').getList(1, 1, {
      filter: `(owner = "${authStore.user?.id}" || moderators ?~ "${authStore.user?.id}") && archived_by ?~ "${authStore.user?.id}"`,
    });
    archivedCount.value = archivedResult.totalItems;
    updateFooterButtons();

    // Verwijderd: het tellen van deelnemers en rondes is niet meer nodig

    console.log('Loaded events:', eventsResult.items);
    console.log('First event course data:', eventsResult.items[0]?.expand?.course);
  } catch (error) {
    console.error('Error loading events:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het laden van de events',
      icon: 'error',
    });
    loading.value = false;
  }
};

const viewEvent = (id: string) => {
  void router.push({ name: 'event-form', params: { id } });
};

// Verwijderd: niet meer gebruikt
// const manageParticipants = (id: string) => {
//   void router.push(`/events/${id}/deelnemers`);
// };

const confirmDelete = (event) => {
  selectedEvent.value = event;
  showDeleteDialog.value = true;
};

const deleteEvent = async () => {
  try {
    deleting.value = true;
    await pb.collection('events').delete(selectedEvent.value.id);

    // Verwijder het event uit de lokale lijst
    events.value = events.value.filter((e) => e.id !== selectedEvent.value.id);

    showDeleteDialog.value = false;
    selectedEvent.value = null;

    $q.notify({
      color: 'positive',
      message: 'Event succesvol verwijderd',
      icon: 'check',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het verwijderen van het event',
      icon: 'error',
    });
  } finally {
    deleting.value = false;
  }
};

const archiveEvent = async (event) => {
  try {
    const archivedBy = Array.isArray(event.archived_by) ? [...event.archived_by] : [];
    if (!archivedBy.includes(authStore.user.id)) {
      archivedBy.push(authStore.user.id);
      await pb.collection('events').update(event.id, { archived_by: archivedBy });
      events.value = events.value.filter((e) => e.id !== event.id);
      $q.notify({
        type: 'positive',
        message: 'Event succesvol gearchiveerd',
      });
    }
  } catch (error) {
    console.error('Fout bij archiveren event:', error);
    $q.notify({
      type: 'negative',
      message: 'Fout bij archiveren van het event',
    });
  }
};

const toggleArchived = () => {
  showArchived.value = !showArchived.value;
  void loadEvents();
};

const updateFooterButtons = () => {
  if (footerButtons) {
    footerButtons.value = [
      {
        icon: showArchived.value ? 'inbox' : 'archive',
        label: showArchived.value ? 'Actief' : 'Archief',
        badge: !showArchived.value ? archivedCount.value || undefined : undefined,
        badgeColor: 'red',
        order: -1,
        onClick: () => {
          showArchived.value = !showArchived.value;
          void loadEvents();
        },
      },
    ];
  }
};

// Verwijderd: niet meer gebruikt
// const manageRounds = (eventId: string) => {
//   router.push({ name: 'event-rounds', params: { id: eventId } });
// };

const editEvent = (id: string) => {
  const event = events.value.find(e => e.id === id);
  if (event && isEventStarted(event)) {
    $q.notify({
      color: 'warning',
      message: 'Event kan niet meer bewerkt worden omdat het al gestart is',
      icon: 'warning',
    });
    return;
  }

  // Controleer of gebruiker eigenaar of moderator is
  if (!isOwner(event) && !isModerator(event)) {
    $q.notify({
      color: 'warning',
      message: 'Je hebt geen rechten om dit event te bewerken',
      icon: 'warning',
    });
    return;
  }

  router.push({ name: 'create-event', query: { edit: id } });
};

watch(showArchived, updateFooterButtons, { immediate: true });

onMounted(() => {
  void loadEvents();
  updateFooterButtons();
});

onUnmounted(() => {
  if (footerButtons) {
    footerButtons.value = [];
  }
});
</script>
