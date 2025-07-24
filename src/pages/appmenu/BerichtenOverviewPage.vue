<template>
  <q-page padding>
    <div class="text-h4 q-mb-md">Berichten</div>

    <q-list bordered separator v-if="berichten.length > 0">
      <q-slide-item
        v-for="bericht in berichten"
        :key="bericht.id"
        @left="({ reset }) => archiveBericht(bericht, reset)"
        left-color="primary"
      >
        <template v-slot:left>
          <div class="row items-center">
            <q-icon left name="archive" />
            <div class="text-subtitle1 q-ml-sm">Archiveren</div>
          </div>
        </template>

        <q-item
          clickable
          @click="openBericht(bericht)"
          :class="{ 'bg-grey-2': !isBerichtSeen(bericht) }"
        >
          <q-item-section side>
            <q-icon
              :name="isBerichtSeen(bericht) ? 'mail' : 'mark_email_unread'"
              :color="isBerichtSeen(bericht) ? 'grey' : 'primary'"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ bericht.title }}</q-item-label>
            <q-item-label caption> Van: {{ bericht.expand?.from_user?.name }} </q-item-label>
            <q-item-label caption>
              {{ formatDate(bericht.created) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-slide-item>
    </q-list>

    <div v-else class="text-center q-pa-md text-grey">Geen berichten gevonden</div>

    <!-- Bericht detail dialoog -->
    <q-dialog v-model="berichtDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ selectedBericht?.title }}</div>
          <div class="text-caption">
            Van: {{ selectedBericht?.expand?.from_user?.name }} op
            {{ formatDate(selectedBericht?.created) }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div v-html="selectedBericht?.body"></div>

          <!-- Moderator aanvraag knoppen -->
          <div v-if="isModeratorRequest(selectedBericht)" class="q-mt-md">
            <q-separator class="q-my-md" />
            <div class="text-subtitle2 q-mb-sm">Moderator aanvraag acties:</div>
            <div class="row q-gutter-sm">
              <q-btn
                unelevated
                color="positive"
                icon="check"
                label="Goedkeuren"
                @click="approveModerator(selectedBericht)"
                :loading="processing"
              />
              <q-btn
                outline
                color="negative"
                icon="close"
                label="Afwijzen"
                @click="rejectModerator(selectedBericht)"
                :loading="processing"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Sluiten" color="primary" v-close-popup @click="markAsSeen" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useQuasar } from 'quasar';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useAuthStore } from 'stores/auth';
import { useNotificationsStore } from 'stores/notifications';

const $q = useQuasar();
const pb = usePocketbase();
const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();

const berichten = ref([]);
const berichtDialog = ref(false);
const selectedBericht = ref(null);
const loading = ref(false);
const processing = ref(false);
const isUnmounted = ref(false);

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isBerichtSeen = (bericht) => {
  return bericht.seen_by?.includes(authStore.user?.id);
};

const isModeratorRequest = (bericht) => {
  return (
    bericht?.title?.includes('Moderator aanvraag') && bericht?.link?.includes('moderator-approval')
  );
};

const loadBerichten = async () => {
  if (isUnmounted.value) return;

  try {
    loading.value = true;
    const result = await pb.collection('notifications').getList(1, 50, {
      filter: `to_user ~ "${authStore.user?.id}" && archived_by !~ "${authStore.user?.id}"`,
      sort: '-created',
      expand: 'from_user',
    });
    if (!isUnmounted.value) {
      berichten.value = result.items;
    }
  } catch (error) {
    if (!isUnmounted.value) {
      console.error('Error loading berichten:', error);
      $q.notify({
        color: 'negative',
        message: 'Fout bij het laden van de berichten',
        icon: 'error',
      });
    }
  } finally {
    if (!isUnmounted.value) {
      loading.value = false;
    }
  }
};

// Update de auth store user met role expand
const updateAuthUserWithRole = async () => {
  if (authStore.user?.id) {
    try {
      const userWithRole = await pb.collection('users').getOne(authStore.user.id, {
        expand: 'role'
      });
      authStore.user = userWithRole;
    } catch (error) {
      console.warn('Kon user role niet ophalen:', error);
    }
  }
};

const openBericht = (bericht) => {
  selectedBericht.value = bericht;
  berichtDialog.value = true;
};

const markAsSeen = async () => {
  if (!isBerichtSeen(selectedBericht.value)) {
    try {
      await pb.collection('notifications').update(selectedBericht.value.id, {
        'seen_by+': authStore.user?.id,
      });
      await loadBerichten();
      await notificationsStore.checkUnreadMessages();
    } catch (error) {
      console.error('Error marking as seen:', error);
      $q.notify({
        color: 'negative',
        message: 'Fout bij het markeren als gelezen',
        icon: 'error',
      });
    }
  }
};

const archiveBericht = async (bericht, reset) => {
  try {
    await pb.collection('notifications').update(bericht.id, {
      'archived_by+': authStore.user?.id,
    });

    // Verwijder het bericht uit de lokale lijst
    berichten.value = berichten.value.filter((b) => b.id !== bericht.id);

    $q.notify({
      color: 'positive',
      message: 'Bericht gearchiveerd',
      icon: 'archive',
    });
  } catch (error) {
    console.error('Error archiving bericht:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het archiveren van het bericht',
      icon: 'error',
    });
    // Reset de swipe als er een fout optreedt
    if (reset) reset();
  }
};

const approveModerator = async (bericht) => {
  try {
    processing.value = true;

    // Parse de link om userId en courseId te krijgen
    const url = new URL(bericht.link);
    const userId = url.searchParams.get('userId');
    const courseId = url.searchParams.get('courseId');

    console.log('Debug moderator approval:', {
      link: bericht.link,
      userId,
      courseId,
      currentUser: authStore.user?.id,
    });

    if (!userId || !courseId) {
      throw new Error('Ongeldige moderator aanvraag parameters');
    }

    // Haal huidige moderators op
    const course = await pb.collection('courses').getOne(courseId);
    console.log('Course data:', course);

    const currentModerators = course.moderators || [];
    console.log('Current moderators:', currentModerators);

    // Voeg nieuwe moderator toe (voorkom duplicaten)
    const newModerators = currentModerators.includes(userId)
      ? currentModerators
      : [...currentModerators, userId];

    console.log('New moderators:', newModerators);

    // Controleer of huidige gebruiker rechten heeft om moderator toe te voegen
    const currentUser = authStore.user;
    const isOwner = course.owner === currentUser?.id;
    const isModerator = course.moderators?.includes(currentUser?.id);

    console.log('Permission check:', {
      currentUser: currentUser?.id,
      courseOwner: course.owner,
      isOwner,
      isModerator,
      userRole: currentUser?.role,
    });

    // Debug: toon de role informatie
    console.log('Role debug:', {
      role: currentUser?.role,
      roleType: typeof currentUser?.role,
      expandRole: currentUser?.expand?.role,
      roleName: currentUser?.expand?.role?.name,
      roleCatType: currentUser?.expand?.role?.cat_type
    });

    // Alleen eigenaar, moderators of superusers kunnen moderators toevoegen
    const isSuperuser = currentUser?.expand?.role?.cat_type === 'role' &&
                       currentUser?.expand?.role?.name === 'superuser';

    if (!isOwner && !isModerator && !isSuperuser) {
      throw new Error('Geen rechten om moderator toe te voegen');
    }

    // Update de baan met nieuwe moderator
    await pb.collection('courses').update(courseId, {
      moderators: newModerators,
    });

    // Markeer notificatie als gezien
    await pb.collection('notifications').update(bericht.id, {
      'seen_by+': authStore.user?.id,
    });

    // Verwijder het bericht uit de lokale lijst
    berichten.value = berichten.value.filter((b) => b.id !== bericht.id);

    $q.notify({
      color: 'positive',
      message: 'Moderator aanvraag goedgekeurd',
      icon: 'check',
    });

    berichtDialog.value = false;
  } catch (error) {
    console.error('Error approving moderator:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij goedkeuren moderator: ' + error.message,
      icon: 'error',
    });
  } finally {
    processing.value = false;
  }
};

const rejectModerator = async (bericht) => {
  try {
    processing.value = true;

    // Markeer notificatie als gezien
    await pb.collection('notifications').update(bericht.id, {
      'seen_by+': authStore.user?.id,
    });

    // Verwijder het bericht uit de lokale lijst
    berichten.value = berichten.value.filter((b) => b.id !== bericht.id);

    $q.notify({
      color: 'warning',
      message: 'Moderator aanvraag afgewezen',
      icon: 'close',
    });

    berichtDialog.value = false;
  } catch (error) {
    console.error('Error rejecting moderator:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij afwijzen moderator: ' + error.message,
      icon: 'error',
    });
  } finally {
    processing.value = false;
  }
};

onMounted(async () => {
  notificationsStore.init();
  await updateAuthUserWithRole();
  // Promise van loadBerichten wordt genegeerd met 'void' voor linter
  void loadBerichten();
});

onBeforeUnmount(() => {
  isUnmounted.value = true;
  notificationsStore.cleanup();
});
</script>
