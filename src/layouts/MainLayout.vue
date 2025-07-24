<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <!-- Hamburger menu knop voor het openen van het AppMenu (linker drawer) -->
        <q-btn flat round dense icon="menu" class="q-mr-md" @click="toggleLeftDrawer" />

        <q-toolbar-title>Pitch & Putt.live </q-toolbar-title>

        <!-- Gebruikersmenu knop -->
        <template v-if="authStore.user">
          <!-- Gebruikersavatar als knop voor het openen van het UserMenu (rechter drawer) -->
          <q-avatar
            size="40px"
            class="q-ml-md cursor-pointer bg-white relative-position"
            @click="toggleRightDrawer"
          >
            <template v-if="userAvatarUrl">
              <img :src="userAvatarUrl" alt="Avatar" />
            </template>
            <template v-else>
              <q-icon name="person" color="primary" size="28px" />
            </template>
            <q-badge v-if="notificationsStore.hasUnread" color="negative" floating rounded />
          </q-avatar>
        </template>
        <template v-else>
          <!-- Login knop voor niet-ingelogde gebruikers -->
          <q-btn
            flat
            round
            dense
            icon="login"
            class="q-ml-md"
            @click="toggleRightDrawer"
            color="white"
          />
        </template>
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered>
      <q-list>
        <q-item to="/" exact>
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>Home</q-item-section>
        </q-item>

        <q-item to="/banen">
          <q-item-section avatar>
            <q-icon name="golf_course" />
          </q-item-section>
          <q-item-section>Banen</q-item-section>
        </q-item>

        <q-item v-if="authStore.user" to="/spelers">
          <q-item-section avatar>
            <q-icon name="people" />
          </q-item-section>
          <q-item-section>Spelers</q-item-section>
        </q-item>

        <q-item to="/live">
          <q-item-section avatar>
            <q-icon name="live_tv" />
          </q-item-section>
          <q-item-section>Live</q-item-section>
        </q-item>

        <!-- Events knop verborgen voor nieuwe pop-up aanpak -->
        <!-- <q-item to="/events">
          <q-item-section avatar>
            <q-icon name="event" />
          </q-item-section>
          <q-item-section>Events</q-item-section>
        </q-item> -->
      </q-list>
    </q-drawer>

    <q-drawer
      show-if-above
      v-model="rightDrawerOpen"
      side="right"
      bordered
      :breakpoint="0"
      :width="300"
    >
      <UserMenu />
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- Drijvende feedbackknop, alleen zichtbaar op mobiel -->
    <FeedbackFloatingBtn />

    <!-- PWA installatie dialog verwijderd - project is nu een SPA -->

    <!-- Update beschikbaar dialog -->
    <q-dialog v-model="showUpdateDialog" persistent>
      <q-card style="min-width: 400px; max-width: 600px">
        <q-card-section class="row items-center q-pb-none">
          <q-icon name="system_update" color="primary" size="md" class="q-mr-sm" />
          <div class="text-h6">Nieuwe versie beschikbaar</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div v-if="latestChangelog" class="q-mb-md">
            <div class="row items-center q-mb-sm">
              <q-chip
                :color="getVersionColor(latestChangelog.type)"
                text-color="white"
                :label="`v${latestChangelog.version}`"
                size="sm"
              />
              <span class="text-caption text-grey-6 q-ml-sm">{{ latestChangelog.date }}</span>
            </div>

            <div class="text-subtitle2 q-mb-sm">Wat is er nieuw:</div>
            <q-list dense>
              <q-item v-for="(change, index) in latestChangelog.changes" :key="index">
                <q-item-section avatar>
                  <q-icon name="check_circle" color="positive" size="sm" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2">{{ change }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <q-separator class="q-my-md" />

          <p class="text-body2">
            Klik op "Vernieuwen" om de app bij te werken naar de nieuwste versie.
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Later" color="grey" v-close-popup @click="showUpdateDialog = false" />
          <q-btn unelevated label="Vernieuwen" color="primary" @click="handleUpdateApp" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import UserMenu from 'components/UserMenu.vue';
import { useNotificationsStore } from 'stores/notifications';
import { useAuthStore } from 'stores/auth';
import { getFileUrl } from 'src/utils/pocketbase-helpers';
import FeedbackFloatingBtn from 'components/FeedbackFloatingBtn.vue';
import { onMounted } from 'vue';
import { type ChangelogEntry } from 'src/utils/changelog';

const route = useRoute();
const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false); // Standaard ingeklapt
const currentPageName = ref('');
const notificationsStore = useNotificationsStore();
const authStore = useAuthStore();

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value;
};

watch(
  () => route.matched[route.matched.length - 1]?.components?.default,
  (component) => {
    if (component) {
      // Gebruik route meta of route name als paginanaam (altijd string)
      const metaTitle = typeof route.meta?.title === 'string' ? route.meta.title : '';
      const routeName = typeof route.name === 'string' ? route.name : '';
      currentPageName.value = metaTitle || routeName;
    }
  },
  { immediate: true },
);

// Computed property voor de avatar-url van de gebruiker
const userAvatarUrl = computed(() => {
  if (authStore.user?.avatar) {
    return getFileUrl('users', authStore.user.id, authStore.user.avatar);
  }
  return '';
});

// Update dialog
const showUpdateDialog = ref(false);

// Changelog state
const latestChangelog = ref<ChangelogEntry | null>(null);

// PWA detectie functie verwijderd - project is nu een SPA

// App update handler (voor SPA)
function handleUpdateApp() {
  showUpdateDialog.value = false;

  // Voor SPA: gewoon de pagina verversen
  window.location.reload();
}

// Helper functie voor versie kleuren
function getVersionColor(type: 'major' | 'minor' | 'patch'): string {
  switch (type) {
    case 'major':
      return 'negative'; // Rood voor grote wijzigingen
    case 'minor':
      return 'warning'; // Oranje voor middelgrote wijzigingen
    case 'patch':
      return 'positive'; // Groen voor kleine fixes
    default:
      return 'primary';
  }
}

onMounted(() => {
  // PWA detectie verwijderd - project is nu een SPA

  // Zorg ervoor dat beide drawers gesloten zijn bij het laden
  leftDrawerOpen.value = false;
  rightDrawerOpen.value = false;
});
</script>
