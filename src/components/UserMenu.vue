<template>
  <q-list style="min-width: 150px">
    <!-- Voor niet-ingelogde gebruikers -->
    <template v-if="!authStore.user">
      <q-item clickable v-close-popup to="/auth/login">
        <q-item-section avatar>
          <q-icon name="login" />
        </q-item-section>
        <q-item-section>Inloggen</q-item-section>
      </q-item>
    </template>

    <!-- Voor ingelogde gebruikers -->
    <template v-else>
      <!-- Profiel -->
      <q-item clickable v-close-popup to="/profile">
        <q-item-section avatar>
          <q-icon name="person" />
        </q-item-section>
        <q-item-section>Profiel</q-item-section>
      </q-item>

      <!-- Mijn Rondes -->
      <q-item clickable v-close-popup to="/mijn-rondes">
        <q-item-section avatar>
          <q-icon name="sports_golf" />
        </q-item-section>
        <q-item-section>Mijn rondes</q-item-section>
      </q-item>

      <!-- Mijn Statistieken -->
      <q-item clickable v-close-popup to="/mijn-statistieken">
        <q-item-section avatar>
          <q-icon name="bar_chart" />
        </q-item-section>
        <q-item-section>Mijn statistieken</q-item-section>
      </q-item>

      <!-- Berichten -->
      <q-item clickable v-close-popup to="/berichten">
        <q-item-section avatar>
          <q-icon name="mail" class="relative-position">
            <q-badge v-if="notificationsStore.hasUnread" color="negative" floating rounded />
          </q-icon>
        </q-item-section>
        <q-item-section>Berichten</q-item-section>
      </q-item>

      <q-separator />

      <!-- Beheer kopje, niet klikbaar -->
      <q-item>
        <q-item-section>
          <div class="text-subtitle2 text-grey-7 q-ml-sm">Beheer</div>
        </q-item-section>
      </q-item>

      <!-- Banen -->
      <q-item clickable v-close-popup to="/my-banen">
        <q-item-section avatar>
          <q-icon name="golf_course" />
        </q-item-section>
        <q-item-section>Banen</q-item-section>
      </q-item>

      <!-- Events (alleen zichtbaar voor baaneigenaren en moderators) -->
      <q-item v-if="isOwnerOrModerator" clickable v-close-popup to="/mijn-events">
        <q-item-section avatar>
          <q-icon name="event" />
        </q-item-section>
        <q-item-section>Events</q-item-section>
      </q-item>

      <!-- Data Beheer (alleen zichtbaar voor baaneigenaren en moderators) -->
      <q-item v-if="isOwnerOrModerator" clickable v-close-popup to="/data-management">
        <q-item-section avatar>
          <q-icon name="database" />
        </q-item-section>
        <q-item-section>Data Beheer</q-item-section>
      </q-item>

      <!-- Vernieuwen -->
      <q-item clickable v-close-popup @click="handleRefresh">
        <q-item-section avatar>
          <q-icon name="refresh" />
        </q-item-section>
        <q-item-section>Vernieuwen</q-item-section>
      </q-item>

      <!-- Uitloggen -->
      <q-item clickable v-close-popup @click="handleLogout">
        <q-item-section avatar>
          <q-icon name="logout" />
        </q-item-section>
        <q-item-section>Uitloggen</q-item-section>
      </q-item>
    </template>
  </q-list>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';
import { useNotificationsStore } from 'stores/notifications';
import { usePocketbase } from 'src/composables/usePocketbase';
import { onMounted, ref } from 'vue';

const router = useRouter();
const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();
const $q = useQuasar();
const pb = usePocketbase();

// State voor eigenaar/moderator check
const isOwnerOrModerator = ref(false);

// Functie om te controleren of gebruiker eigenaar of moderator is
const checkOwnerOrModeratorStatus = async () => {
  if (!authStore.user?.id) {
    isOwnerOrModerator.value = false;
    return;
  }

  try {
    // Haal banen op waar de gebruiker eigenaar of moderator is
    const result = await pb.collection('courses').getList(1, 1, {
      filter: `owner = "${authStore.user.id}" || moderators ?~ "${authStore.user.id}"`,
    });

    isOwnerOrModerator.value = result.totalItems > 0;
  } catch (error) {
    console.error('Fout bij controleren eigenaar/moderator status:', error);
    isOwnerOrModerator.value = false;
  }
};

const handleLogout = () => {
  try {
    authStore.logout();
    $q.notify({
      color: 'positive',
      message: 'Je bent succesvol uitgelogd',
      icon: 'check',
    });
    // Blijf op de huidige pagina na uitloggen
    void router.push('/');
  } catch {
    $q.notify({
      color: 'negative',
      message: 'Uitloggen mislukt. Probeer het opnieuw.',
      icon: 'error',
    });
  }
};

const handleRefresh = async () => {
  try {
    // Voor SPA: eenvoudige pagina refresh
    $q.notify({
      color: 'positive',
      message: 'Pagina wordt vernieuwd...',
      icon: 'refresh',
      timeout: 1500,
    });

    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (error) {
    console.error('Error refreshing app:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het vernieuwen van de app',
      icon: 'error',
    });
  }
};

onMounted(async () => {
  // Alleen controleren als gebruiker is ingelogd
  if (authStore.user) {
    await checkOwnerOrModeratorStatus();
    void notificationsStore.checkUnreadMessages();
  }
});
</script>
