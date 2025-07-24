<template>
  <div class="q-pa-md">
    <div class="row justify-between items-center q-mb-lg">
      <div class="text-h5">{{ showArchived ? 'Gearchiveerde rondes' : 'Mijn rondes' }}</div>
      <q-btn
        v-if="!showArchived"
        color="secondary"
        icon="add"
        label="Oefenronde"
        @click="showNewRoundDialog = true"
      />
    </div>

    <!-- Rondes lijst -->
    <q-pull-to-refresh @refresh="onRefresh">
      <div class="row q-col-gutter-md">
        <div v-for="round in rounds" :key="round.id" class="col-12 col-sm-6 col-md-4">
          <!-- Swipeable voor actieve lijst -->
          <q-slide-item
            @left="archiveRound(round)"
            @right="round.event ? cancelEventRound(round) : deleteRoundWithoutConfirm(round)"
            left-color="primary"
            right-color="negative"
            v-if="!showArchived"
          >
            <template v-slot:left>
              <div class="row items-center">
                <q-icon name="archive" />
              </div>
            </template>
            <template v-slot:right>
              <div class="row items-center">
                <q-icon name="delete" />
              </div>
            </template>

            <q-card
              class="round-card cursor-pointer"
              @click="handleRoundClick(round)"
              :class="[
                'round-card cursor-pointer',
                round.player === authStore.user?.id && round.marker === authStore.user?.id
                  ? 'bg-green-1'
                  : round.player === authStore.user?.id && !['afgerond', 'geannuleerd'].includes(round.expand?.status?.name?.toLowerCase())
                    ? 'bg-yellow-1'
                    : round.player === authStore.user?.id
                      ? 'bg-blue-1'
                      : round.marker === authStore.user?.id
                        ? 'bg-orange-1'
                        : '',
              ]"
              style="position: relative"
            >
              <q-card-section class="q-pa-sm">
                <div class="row items-center justify-between q-mb-xs">
                  <div class="row items-center no-wrap">
                    <div class="text-subtitle1 text-weight-medium">
                      {{ round.expand?.category?.name }}
                    </div>
                    <q-chip
                      v-if="round.marker === authStore.user?.id"
                      color="orange"
                      text-color="white"
                      size="xs"
                      class="q-ml-xs"
                      style="font-weight: bold"
                    >
                      Marker
                    </q-chip>
                  </div>
                  <!-- Status-badge alleen tonen als het geen oefenronde is of als het een gearchiveerde ronde is -->
                  <q-chip
                    v-if="showArchived || round.expand?.category?.name !== 'Oefenronde'"
                    square
                    outline
                    size="sm"
                    :color="getStatusColor(round.expand?.status?.name)"
                    class="status-chip q-ml-xs"
                  >
                    {{ round.expand?.status?.name }}
                  </q-chip>
                </div>

                <div class="text-caption text-grey-8">{{ round.expand?.course?.name }}</div>
                <!-- Event naam tonen voor alle rondes met een event -->
                <div
                  v-if="round.expand?.event?.name"
                  class="text-body2 text-weight-medium q-mt-xs"
                >
                  {{ round.expand.event.name }}
                </div>
                <div
                  v-if="
                    round.player === authStore.user?.id &&
                    (!round.marker || round.marker === '') &&
                    (round.expand?.category?.name === 'Toernooi' ||
                      round.expand?.category?.name === 'Competitie' ||
                      round.expand?.category?.name === 'Skins') &&
                    round.qr_token
                  "
                  class="q-mt-md"
                >
                  <!-- QR-code tonen als de speler nog geen marker heeft, voor Toernooi, Competitie én Skins -->
                  <div class="row items-center no-wrap">
                    <div>
                      <!-- QR-code component met unieke token -->
                      <QrcodeVue :value="getQrUrl(round.qr_token)" :size="96" />
                    </div>
                    <div class="q-ml-md" style="min-width: 180px">
                      <div class="text-body2">Scan de qr-code of voer handmatig deze code in:</div>
                      <div class="text-h6 text-left text-weight-bold q-mt-xs">
                        {{ round.qr_token }}
                      </div>
                    </div>
                  </div>
                </div>
              </q-card-section>
              <q-btn
                v-if="
                  !['afgerond', 'geannuleerd'].includes(round.expand?.status?.name.toLowerCase()) &&
                  !(
                    round.player === authStore.user?.id &&
                    (round.expand?.category?.name === 'Toernooi' ||
                      round.expand?.category?.name === 'Competitie' ||
                      round.expand?.category?.name === 'Skins')
                  ) &&
                  round.player !== authStore.user?.id
                "
                fab-mini
                color="primary"
                icon="edit"
                @click.stop="viewScores(round.id)"
                style="
                  position: absolute;
                  bottom: 12px;
                  right: 12px;
                  z-index: 2;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                "
                :aria-label="'Score invoeren voor ronde ' + (round.expand?.category?.name || '')"
                size="sm"
              />
            </q-card>
          </q-slide-item>

          <!-- Swipeable voor gearchiveerde oefenrondes -->
          <q-slide-item
            v-else-if="showArchived && round.expand?.category?.name === 'Oefenronde'"
            @right="deleteRoundWithoutConfirm(round)"
            right-color="negative"
          >
            <template v-slot:right>
              <div class="row items-center">
                <q-icon name="delete" />
              </div>
            </template>
            <q-card class="round-card cursor-pointer" @click="viewRound(round.id)">
              <q-card-section class="q-pa-sm">
                <div class="row items-center justify-between q-mb-xs">
                  <div class="row items-center no-wrap">
                    <div class="text-subtitle1 text-weight-medium">
                      {{ round.expand?.category?.name }}
                    </div>
                    <q-chip
                      v-if="round.marker === authStore.user?.id"
                      color="orange"
                      text-color="white"
                      size="xs"
                      class="q-ml-xs"
                      style="font-weight: bold"
                    >
                      Marker
                    </q-chip>
                  </div>
                  <!-- Status-badge alleen tonen als het geen oefenronde is of als het een gearchiveerde ronde is -->
                  <q-chip
                    v-if="showArchived || round.expand?.category?.name !== 'Oefenronde'"
                    square
                    outline
                    size="sm"
                    :color="getStatusColor(round.expand?.status?.name)"
                    class="status-chip q-ml-xs"
                  >
                    {{ round.expand?.status?.name }}
                  </q-chip>
                </div>
                <div class="text-body2">
                  {{ formatDateTime(round.date) }}
                  <span v-if="round.expand?.event_round">
                    | Ronde {{ round.expand.event_round.round_number }}
                  </span>
                </div>
                <div
                  v-if="round.expand?.event_round?.expand?.event?.name || round.expand?.event?.name"
                  class="text-body2 text-weight-medium q-mb-xs"
                >
                  {{ round.expand?.event_round?.expand?.event?.name || round.expand?.event?.name }}
                </div>
                <div class="text-caption text-grey-8">{{ round.expand?.course?.name }}</div>
              </q-card-section>
            </q-card>
          </q-slide-item>

          <!-- Niet-swipeable voor andere gearchiveerde rondes -->
          <q-card v-else class="round-card cursor-pointer" @click="viewRound(round.id)">
            <q-card-section class="q-pa-sm">
              <div class="row items-center justify-between q-mb-xs">
                <div class="row items-center no-wrap">
                  <div class="text-subtitle1 text-weight-medium">
                    {{ round.expand?.category?.name }}
                  </div>
                  <q-chip
                    v-if="round.marker === authStore.user?.id"
                    color="orange"
                    text-color="white"
                    size="xs"
                    class="q-ml-xs"
                    style="font-weight: bold"
                  >
                    Marker
                  </q-chip>
                </div>
                <!-- Status-badge alleen tonen als het geen oefenronde is of als het een gearchiveerde ronde is -->
                <q-chip
                  v-if="showArchived || round.expand?.category?.name !== 'Oefenronde'"
                  square
                  outline
                  size="sm"
                  :color="getStatusColor(round.expand?.status?.name)"
                  class="status-chip q-ml-xs"
                >
                  {{ round.expand?.status?.name }}
                </q-chip>
              </div>
              <div class="text-body2">
                {{ formatDateTime(round.date) }}
                <span v-if="round.expand?.event_round">
                  | Ronde {{ round.expand.event_round.round_number }}
                </span>
              </div>
              <div
                v-if="round.expand?.event_round?.expand?.event?.name || round.expand?.event?.name"
                class="text-body2 text-weight-medium q-mb-xs"
              >
                {{ round.expand?.event_round?.expand?.event?.name || round.expand?.event?.name }}
              </div>
              <div class="text-caption text-grey-8">{{ round.expand?.course?.name }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Bericht als er geen rondes zijn -->
      <div v-if="rounds.length === 0" class="text-center q-mt-lg text-grey">
        {{ showArchived ? 'Geen gearchiveerde rondes gevonden' : 'Geen rondes gevonden' }}
      </div>
    </q-pull-to-refresh>

    <!-- Nieuwe ronde dialog vervangen door herbruikbaar component -->
    <PracticeRoundDialog v-model="showNewRoundDialog" @round-created="onPracticeRoundCreated" />
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import { ref, onMounted, inject, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';
import { usePocketbase } from 'src/composables/usePocketbase';
import QrcodeVue from 'qrcode.vue';
import PracticeRoundDialog from 'src/components/PracticeRoundDialog.vue';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const pb = usePocketbase();

const rounds = ref([]);
const courses = ref([]);
const roundTypes = ref([]);
const statusTypes = ref([]);
const loading = ref(false);
const showNewRoundDialog = ref(false);

const showArchived = ref(false);
const archivedCount = ref(0);

type FooterButton = {
  icon: string;
  label: string;
  badge?: number | undefined;
  badgeColor?: string;
  order?: number;
  onClick: () => void;
};

const footerButtons = inject<Ref<FooterButton[]> | undefined>('footerButtons');

const formatDateTime = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isRoundInPast = (round) => {
  const roundDate = new Date(`${round.date}T${round.time}`);
  return roundDate < new Date();
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

const updatePastRoundStatus = async (round) => {
  try {
    if (isRoundInPast(round) && round.expand?.status?.name.toLowerCase() !== 'geannuleerd') {
      // Zoek de "Geannuleerd" status
      const statusResult = await pb.collection('categories').getList(1, 1, {
        filter: 'cat_type = "status" && name = "Geannuleerd"',
      });

      if (statusResult.items.length > 0) {
        await pb.collection('rounds').update(round.id, {
          status: statusResult.items[0].id,
        });

        $q.notify({
          color: 'warning',
          message: 'Ronde is automatisch geannuleerd omdat de datum is verstreken',
          icon: 'warning',
        });
      }
    }
  } catch (error) {
    console.error('Error updating past round status:', error);
  }
};

const loadData = async () => {
  try {
    loading.value = true;

    // Haal eerst de basis data op
    const coursesResult = await pb.collection('courses').getList(1, 50, {
      sort: 'name',
    });
    courses.value = coursesResult.items;

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

    // Filter op player of marker
    const userId = authStore.user?.id;
    const baseFilter = `(player = "${userId}" || marker = "${userId}")`;
    const archiveFilter = showArchived.value
      ? `${baseFilter} && archived_by ?~ "${userId}"`
      : `${baseFilter} && archived_by ?!~ "${userId}"`;

    const roundsResult = await pb.collection('rounds').getList(1, 50, {
      filter: archiveFilter,
      sort: '-date,-time',
      expand: 'course,category,status,event_round,event_round.event,event',
    });
    rounds.value = roundsResult.items;

    // Debug: log de eerste ronde om te zien wat er in de data zit
    if (rounds.value.length > 0) {
      console.log('Debug - Eerste ronde:', rounds.value[0]);
      console.log('Debug - Event round expand:', rounds.value[0].expand?.event_round);
      console.log('Debug - Direct event expand:', rounds.value[0].expand?.event);
      console.log('Debug - Event field:', rounds.value[0].event);
    }

    // Haal apart het aantal gearchiveerde rondes op
    const archivedResult = await pb.collection('rounds').getList(1, 1, {
      filter: `${baseFilter} && archived_by ?~ "${userId}"`,
    });
    archivedCount.value = archivedResult.totalItems;

    // Check en update status voor rondes in het verleden
    if (!showArchived.value) {
      for (const round of rounds.value) {
        await updatePastRoundStatus(round);
      }
    }
  } catch (error) {
    console.error('Error loading data:', error);
    if (!error.isAbort) {
      $q.notify({
        color: 'negative',
        message: 'Fout bij het laden van de gegevens',
        icon: 'error',
      });
    }
  } finally {
    loading.value = false;
  }
};

const viewRound = (id: string) => {
  void router.push(`/rondes/${id}`);
};

const viewScores = (id: string) => {
  void router.push(`/rondes/${id}/scores`);
};

const handleRoundClick = (round: any) => {
  // Als de gebruiker de speler is en de ronde is nog actief, ga naar score invoer
  if (round.player === authStore.user?.id &&
      !['afgerond', 'geannuleerd'].includes(round.expand?.status?.name?.toLowerCase())) {
    viewScores(round.id);
  } else {
    // Anders ga naar de ronde detail pagina
    viewRound(round.id);
  }
};

const deleteOldCancelledRounds = async () => {
  try {
    console.log('Start deleteOldCancelledRounds');

    // Bereken de datum van een week geleden
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    // Format als 'YYYY-MM-DD' voor het date veld
    const formattedDate = oneWeekAgo.toISOString().split('T')[0];
    console.log('Zoeken naar rondes ouder dan:', formattedDate);

    // Haal eerst de "Geannuleerd" status op
    console.log('Zoeken naar Geannuleerd status...');
    const cancelledStatus = await pb
      .collection('categories')
      .getFirstListItem(`cat_type="status" && name="Geannuleerd"`);

    console.log('Gevonden status:', cancelledStatus);

    if (!cancelledStatus) {
      console.error('Geen "Geannuleerd" status gevonden');
      return;
    }

    // Haal alleen de geannuleerde rondes op van de ingelogde gebruiker
    console.log('User ID:', authStore.user?.id);
    const filter = `status="${cancelledStatus.id}" && player="${authStore.user?.id}" && date < "${formattedDate}"`;
    console.log('Filter:', filter);

    const oldCancelledRounds = await pb.collection('rounds').getFullList({
      filter,
      expand: 'status',
    });

    console.log('Gevonden rondes:', oldCancelledRounds);
    console.log(`${oldCancelledRounds.length} oude geannuleerde rondes gevonden om te verwijderen`);

    let deletedCount = 0;
    for (const round of oldCancelledRounds) {
      try {
        console.log('Verwijderen van ronde:', round.id);
        await pb.collection('rounds').delete(round.id);
        deletedCount++;
        console.log('Ronde succesvol verwijderd');
      } catch (deleteError) {
        console.error(`Fout bij het verwijderen van ronde ${round.id}:`, deleteError);
      }
    }

    console.log(`Totaal ${deletedCount} rondes verwijderd`);

    if (deletedCount > 0) {
      await loadData();
      $q.notify({
        color: 'info',
        message: `${deletedCount} oude geannuleerde ronde(s) verwijderd`,
        icon: 'delete',
      });
    } else {
      console.log('Geen rondes verwijderd');
    }
  } catch (error) {
    console.error('Fout bij het verwijderen van oude geannuleerde rondes:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het verwijderen van oude geannuleerde rondes',
      icon: 'error',
    });
  }
};

const updateExpiredRounds = async () => {
  try {
    console.log('Start updateExpiredRounds');

    // Haal alle benodigde statussen op
    const [activeStatus, cancelledStatus, completedStatus] = await Promise.all([
      pb.collection('categories').getFirstListItem(`cat_type="status" && name="Actief"`),
      pb.collection('categories').getFirstListItem(`cat_type="status" && name="Geannuleerd"`),
      pb.collection('categories').getFirstListItem(`cat_type="status" && name="Afgerond"`),
    ]);

    if (!activeStatus || !cancelledStatus || !completedStatus) {
      console.error('Kon niet alle benodigde statussen vinden');
      return;
    }

    // Format huidige datum als 'YYYY-MM-DD'
    const today = new Date().toISOString().split('T')[0];
    console.log('Huidige datum:', today);

    // Zoek actieve rondes die verlopen zijn
    const filter = `status="${activeStatus.id}" && date < "${today}"`;
    console.log('Filter voor verlopen rondes:', filter);

    const expiredRounds = await pb.collection('rounds').getFullList({
      filter,
      expand: 'status,course',
    });

    console.log(`${expiredRounds.length} verlopen actieve rondes gevonden`);

    let cancelledCount = 0;
    let completedCount = 0;

    for (const round of expiredRounds) {
      try {
        // Haal alle holes op voor deze ronde
        const scores = await pb.collection('scores').getFullList({
          filter: `round="${round.id}"`,
        });

        // Haal het aantal holes op van de baan
        const holes = await pb.collection('holes').getFullList({
          filter: `course="${round.expand?.course?.id}"`,
        });

        // Controleer of alle holes een score hebben
        const isComplete = holes.length > 0 && scores.length === holes.length;

        // Update de status op basis van volledigheid
        const newStatus = isComplete ? completedStatus.id : cancelledStatus.id;
        const statusName = isComplete ? 'Afgerond' : 'Geannuleerd';

        console.log(`Update status van ronde ${round.id} naar ${statusName}`);
        await pb.collection('rounds').update(round.id, {
          status: newStatus,
        });

        if (isComplete) {
          completedCount++;
        } else {
          cancelledCount++;
        }
      } catch (updateError) {
        console.error(`Fout bij het updaten van ronde ${round.id}:`, updateError);
      }
    }

    // Toon meldingen voor beide types updates
    if (completedCount > 0) {
      $q.notify({
        color: 'positive',
        message: `${completedCount} verlopen ronde(s) automatisch afgerond`,
        icon: 'check',
      });
    }

    if (cancelledCount > 0) {
      $q.notify({
        color: 'warning',
        message: `${cancelledCount} verlopen ronde(s) automatisch geannuleerd`,
        icon: 'update',
      });
    }

    if (completedCount > 0 || cancelledCount > 0) {
      await loadData();
    }
  } catch (error) {
    console.error('Fout bij het updaten van verlopen rondes:', error);
  }
};

const onRefresh = async (done: () => void) => {
  try {
    await loadData();
    $q.notify({
      color: 'positive',
      message: 'Rondes bijgewerkt',
      icon: 'refresh',
    });
  } catch (error) {
    console.error('Error refreshing data:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het verversen van de rondes',
      icon: 'error',
    });
  } finally {
    done();
  }
};

const deleteRoundWithoutConfirm = async (round) => {
  try {
    await pb.collection('rounds').delete(round.id);
    rounds.value = rounds.value.filter((r) => r.id !== round.id);
    $q.notify({
      type: 'positive',
      message: 'Ronde succesvol verwijderd',
    });
  } catch (error) {
    console.error('Fout bij verwijderen ronde:', error);
    $q.notify({
      type: 'negative',
      message: 'Fout bij verwijderen van de ronde',
    });
  }
};

const cancelEventRound = async (round) => {
  try {
    // Controleer of het een event ronde is
    if (!round.event) {
      $q.notify({
        type: 'negative',
        message: 'Dit is geen event ronde',
        icon: 'error',
      });
      return;
    }

    // Verwijder de ronde (scores worden automatisch verwijderd door cascade delete)
    await pb.collection('rounds').delete(round.id);
    rounds.value = rounds.value.filter((r) => r.id !== round.id);
    $q.notify({
      type: 'positive',
      message: 'Event ronde succesvol geannuleerd',
    });
  } catch (error) {
    console.error('Fout bij annuleren event ronde:', error);
    $q.notify({
      type: 'negative',
      message: 'Fout bij annuleren van de event ronde',
    });
  }
};

const archiveRound = async (round) => {
  try {
    const currentUser = authStore.user.id;
    const archivedBy = round.archived_by || [];

    // Voeg de huidige gebruiker toe aan archived_by als deze er nog niet in zit
    if (!archivedBy.includes(currentUser)) {
      archivedBy.push(currentUser);
    }

    await pb.collection('rounds').update(round.id, {
      archived_by: archivedBy,
    });

    // Verwijder de ronde uit de lokale lijst als de huidige gebruiker hem heeft gearchiveerd
    rounds.value = rounds.value.filter((r) => r.id !== round.id);

    $q.notify({
      type: 'positive',
      message: 'Ronde succesvol gearchiveerd',
    });
  } catch (error) {
    console.error('Fout bij archiveren ronde:', error);
    $q.notify({
      type: 'negative',
      message: 'Fout bij archiveren van de ronde',
    });
  }
};

const updateFooterButtons = () => {
  if (footerButtons) {
    footerButtons.value = [
      {
        icon: showArchived.value ? 'inbox' : 'archive',
        label: showArchived.value ? 'Actief' : 'Archief',
        badge: !showArchived.value ? archivedCount.value || undefined : undefined,
        badgeColor: 'red',
        order: -1, // Links van de home button
        onClick: () => {
          showArchived.value = !showArchived.value;
          void loadData();
        },
      },
    ];
  }
};

// Voeg een watch toe voor showArchived en archivedCount
watch([showArchived, archivedCount], updateFooterButtons, { immediate: true });

const getQrUrl = (qrToken: string) => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/marker-scan?token=${qrToken}`;
  }
  return '';
};

function onPracticeRoundCreated() {
  showNewRoundDialog.value = false;
  void loadData();
}

onMounted(async () => {
  await loadData();
  await updateExpiredRounds();
  await deleteOldCancelledRounds();
  updateFooterButtons();
});

onUnmounted(() => {
  if (footerButtons) {
    footerButtons.value = []; // Reset de footer buttons
  }
});
</script>

<style lang="scss">
.round-card {
  transition: all 0.2s ease-in-out;
  border: 1px solid rgba(0, 0, 0, 0.12);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
}

// Verminder de spacing tussen de cards
.q-col-gutter-md > .col-12 {
  padding-top: 4px;
  padding-bottom: 4px;
}

.status-chip {
  font-size: 11px;
  padding: 2px 6px;
  height: 20px;
  min-height: unset;
}
</style>
