<template>
  <q-page padding>
    <div v-if="baan" class="row q-col-gutter-md">
      <!-- Baan informatie -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="row items-center">
              <q-avatar size="48px" class="q-mr-md">
                <img :src="getLogoUrl(baan)" />
              </q-avatar>
              <div>
                <div class="text-h5">{{ baan.name }}</div>
                <div class="text-caption text-grey">
                  {{ baan.city }}<span v-if="country">, {{ country.name }}</span>
                </div>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <!-- Icoontjes rij -->
            <div class="row justify-center q-gutter-md q-mb-lg">
              <!-- Categorie icoon -->
              <div v-if="getCategoryIconUrl(baan)" class="text-center">
                <div class="icon-square bg-grey-2 flex items-center justify-center">
                  <img
                    :src="getCategoryIconUrl(baan)"
                    :alt="baan.expand?.category?.name"
                    width="32"
                    height="32"
                  />
                </div>
                <div class="text-caption text-grey-6 q-mt-xs">
                  {{ baan.expand?.category?.name }}
                </div>
              </div>

              <!-- Route icoon (platform afhankelijk) -->
              <div v-if="baan.gps" class="text-center cursor-pointer" @click="openRouteInMaps">
                <div class="icon-square bg-primary flex items-center justify-center">
                  <q-icon name="directions" color="white" size="32px" />
                </div>
                <div class="text-caption text-grey-6 q-mt-xs">Route</div>
              </div>

              <!-- Website icoon -->
              <div v-if="baan.website" class="text-center cursor-pointer" @click="openWebsite">
                <div class="icon-square bg-secondary flex items-center justify-center">
                  <q-icon name="language" color="white" size="32px" />
                </div>
                <div class="text-caption text-grey-6 q-mt-xs">Website</div>
              </div>

              <!-- Email icoon -->
              <div v-if="baan.email" class="text-center cursor-pointer" @click="openEmail">
                <div class="icon-square bg-accent flex items-center justify-center">
                  <q-icon name="email" color="white" size="32px" />
                </div>
                <div class="text-caption text-grey-6 q-mt-xs">Email</div>
              </div>
            </div>

            <!-- Melding of Apply for moderator knop -->
            <div class="row">
              <div class="col-12">
                <q-btn
                  v-if="hasOwnerOrModerators"
                  color="primary"
                  icon="mail"
                  label="Melding sturen"
                  @click="openNotificationDialog"
                  class="full-width"
                />
                <q-btn
                  v-else
                  color="secondary"
                  icon="admin_panel_settings"
                  label="Apply for moderator"
                  @click="openApplyModeratorDialog"
                  class="full-width"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Kaart -->
      <div class="col-12">
        <course-map
          :course-id="baan.id"
          :baan-gps="baan.gps"
          @update:holes="(newHoles) => (holes = newHoles)"
        />
      </div>
    </div>

    <div v-else class="text-center q-mt-lg">
      <q-spinner size="xl" />
      <div class="text-h6 q-mt-md">Baan laden...</div>
    </div>

    <!-- Hole foto dialoog -->
    <q-dialog v-model="holeImageDialog">
      <q-card style="min-width: 80vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Hole {{ selectedHole?.hole }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-img
            v-if="selectedHole?.image"
            :src="getHoleImageUrl(selectedHole)"
            style="max-height: 70vh"
            class="rounded-borders"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Melding dialoog -->
    <q-dialog v-model="notificationDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Melding versturen</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="notificationTitle"
            label="Onderwerp"
            :rules="[(val) => !!val || 'Onderwerp is verplicht']"
          />
          <q-input
            v-model="notificationBody"
            label="Melding"
            type="textarea"
            :rules="[(val) => !!val || 'Melding is verplicht']"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annuleren" color="grey" v-close-popup />
          <q-btn
            flat
            label="Versturen"
            color="primary"
            @click="sendNotification"
            :loading="sendingNotification"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Apply for moderator dialoog -->
    <q-dialog v-model="applyModeratorDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Apply for moderator</div>
          <div class="text-caption text-grey q-mt-sm">
            Stuur een bericht om moderator te worden van {{ baan?.name }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="applyModeratorMessage"
            label="Waarom wil je moderator worden?"
            type="textarea"
            :rules="[(val) => !!val || 'Bericht is verplicht']"
            autogrow
            rows="4"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annuleren" color="grey" v-close-popup />
          <q-btn
            flat
            label="Versturen"
            color="secondary"
            @click="sendApplyModerator"
            :loading="sendingApplyModerator"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.icon-square {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.icon-square:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.cursor-pointer .icon-square:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { usePocketbase } from 'src/composables/usePocketbase';
import { getFileUrl } from 'src/utils/pocketbase-helpers';
import type { Course, Hole, Country } from 'src/components/models';
import CourseMap from 'components/CourseMap.vue';
import { useAuthStore } from 'stores/auth';

const route = useRoute();
const $q = useQuasar();
const pb = usePocketbase();
const authStore = useAuthStore();

const baan = ref<Course | null>(null);
const holes = ref<Hole[]>([]);
const notificationDialog = ref(false);
const notificationTitle = ref('');
const notificationBody = ref('');
const sendingNotification = ref(false);
const applyModeratorDialog = ref(false);
const applyModeratorMessage = ref('');
const sendingApplyModerator = ref(false);
const holeImageDialog = ref(false);
const selectedHole = ref<Hole | null>(null);
const country = ref<Country | null>(null);

// Computed property om te controleren of er een eigenaar of moderators zijn
const hasOwnerOrModerators = computed(() => {
  if (!baan.value) return false;
  return !!(baan.value.owner || (baan.value.moderators && baan.value.moderators.length > 0));
});

const getLogoUrl = (baan: Course) => {
  if (baan.logo) {
    return getFileUrl('courses', baan.id, baan.logo);
  }
  return 'https://cdn.quasar.dev/img/parallax2.jpg';
};

// Helper functie om categorie icoon URL op te halen
const getCategoryIconUrl = (baan: Course) => {
  if (baan.expand?.category?.icon) {
    return getFileUrl('categories', baan.expand.category.id, baan.expand.category.icon);
  }
  return null;
};

// Platform-afhankelijke route functie
const openRouteInMaps = () => {
  if (!baan.value?.gps) return;
  const { latitude, longitude } = baan.value.gps;
  // Detecteer Apple device: iOS of Mac (ook zonder touch)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isMac = /Macintosh/.test(navigator.userAgent);
  const isApple = isIOS || isMac;

  let url = '';
  if (isApple) {
    // Apple Maps
    url = `https://maps.apple.com/?daddr=${latitude},${longitude}`;
  } else {
    // Google Maps
    url = `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
  window.open(url, '_blank');
};

// Open website in nieuw tabblad
const openWebsite = () => {
  if (baan.value?.website) {
    window.open(baan.value.website, '_blank');
  }
};

// Open email client
const openEmail = () => {
  if (baan.value?.email) {
    const subject = `Vraag over ${baan.value.name}`;
    const body = `Hallo,\n\nIk heb een vraag over ${baan.value.name}.\n\nMet vriendelijke groet,`;
    const mailtoUrl = `mailto:${baan.value.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  }
};

const getHoleImageUrl = (hole: Hole) => {
  if (hole.image) {
    return getFileUrl('course_detail', hole.id, hole.image);
  }
  return '';
};

const openNotificationDialog = () => {
  notificationTitle.value = '';
  notificationBody.value = '';
  notificationDialog.value = true;
};

const openApplyModeratorDialog = () => {
  applyModeratorMessage.value = '';
  applyModeratorDialog.value = true;
};

const sendApplyModerator = async () => {
  if (!applyModeratorMessage.value.trim()) {
    $q.notify({
      color: 'negative',
      message: 'Vul een bericht in',
      icon: 'error',
    });
    return;
  }

  try {
    sendingApplyModerator.value = true;

    // Debug: toon alle gebruikers om te zien welke roles er zijn
    console.log('Zoeken naar superusers...');

    // Probeer eerst alle gebruikers op te halen om te debuggen
    const allUsers = await pb.collection('users').getList(1, 50);
    console.log(
      'Alle gebruikers:',
      allUsers.items.map((u) => ({ id: u.id, name: u.name, role: u.role })),
    );

    // Zoek alle superusers (role naam = "superuser")
    const superusers = await pb.collection('users').getList(1, 100, {
      filter: 'role.name = "superuser"',
    });

    console.log('Superusers gevonden:', superusers.items);

    if (!superusers.items || superusers.items.length === 0) {
      // Fallback: probeer de gebruiker met email rh.hasper@me.com
      try {
        const adminUser = await pb
          .collection('users')
          .getFirstListItem('email = "rh.hasper@me.com"');
        console.log('Admin gebruiker gevonden via email:', adminUser);

        // Eerst de notificatie aanmaken om de ID te krijgen
        const notificationData = {
          to_user: [adminUser.id],
          from_user: authStore.user?.id,
          title: `[Betreft: ${baan.value?.name}] Moderator aanvraag`,
          body: `Gebruiker ${authStore.user?.name} (${authStore.user?.email}) wil moderator worden van ${baan.value?.name} in ${baan.value?.city}, ${country.value?.name || 'Onbekend land'}.

Gebruiker ID: ${authStore.user?.id}
Baan ID: ${baan.value?.id}

Motivatie:
${applyModeratorMessage.value}`,
          link: '',
          seen: false,
        };

        const createdNotification = await pb.collection('notifications').create(notificationData);

        // Update de notificatie met de juiste link inclusief notificationId
        await pb.collection('notifications').update(createdNotification.id, {
          link: `${window.location.origin}/moderator-approval?userId=${authStore.user?.id}&courseId=${baan.value?.id}&notificationId=${createdNotification.id}`,
        });

        $q.notify({
          color: 'positive',
          message: 'Moderator aanvraag succesvol verstuurd',
          icon: 'check',
        });
        applyModeratorDialog.value = false;
        return;
      } catch (emailError) {
        console.error('Ook geen admin gebruiker gevonden via email:', emailError);
        throw new Error(
          'Geen superusers of admin gebruiker gevonden. Controleer de database configuratie.',
        );
      }
    }

    // Verzamel alle superuser IDs
    const superuserIds = superusers.items.map((user) => user.id);

    // Eerst de notificatie aanmaken om de ID te krijgen
    const notificationData = {
      to_user: superuserIds,
      from_user: authStore.user?.id,
      title: `[Betreft: ${baan.value?.name}] Moderator aanvraag`,
      body: `Gebruiker ${authStore.user?.name} (${authStore.user?.email}) wil moderator worden van ${baan.value?.name} in ${baan.value?.city}, ${country.value?.name || 'Onbekend land'}.

Gebruiker ID: ${authStore.user?.id}
Baan ID: ${baan.value?.id}

Motivatie:
${applyModeratorMessage.value}`,
      link: '',
      seen: false,
    };

    const createdNotification = await pb.collection('notifications').create(notificationData);

    // Update de notificatie met de juiste link inclusief notificationId
    await pb.collection('notifications').update(createdNotification.id, {
      link: `${window.location.origin}/moderator-approval?userId=${authStore.user?.id}&courseId=${baan.value?.id}&notificationId=${createdNotification.id}`,
    });

    $q.notify({
      color: 'positive',
      message: 'Moderator aanvraag succesvol verstuurd naar superusers',
      icon: 'check',
    });
    applyModeratorDialog.value = false;
  } catch (error) {
    console.error('Error sending apply moderator:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het versturen van de aanvraag: ' + error.message,
      icon: 'error',
    });
  } finally {
    sendingApplyModerator.value = false;
  }
};

const sendNotification = async () => {
  if (!notificationTitle.value || !notificationBody.value) {
    $q.notify({
      color: 'negative',
      message: 'Vul alle velden in',
      icon: 'error',
    });
    return;
  }

  try {
    sendingNotification.value = true;
    const ownerId = baan.value?.owner;

    if (!ownerId) {
      throw new Error('Geen eigenaar gevonden');
    }

    const notificationData = {
      to_user: [ownerId, ...(baan.value?.moderators || [])],
      from_user: authStore.user?.id,
      title: `[Betreft: ${baan.value?.name}] ${notificationTitle.value}`,
      body: notificationBody.value,
      link: '',
      seen: false,
    };

    await pb.collection('notifications').create(notificationData);

    $q.notify({
      color: 'positive',
      message: 'Melding succesvol verstuurd',
      icon: 'check',
    });
    notificationDialog.value = false;
  } catch (error) {
    console.error('Error sending notification:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het versturen van de melding: ' + error.message,
      icon: 'error',
    });
  } finally {
    sendingNotification.value = false;
  }
};

onMounted(async () => {
  try {
    const result = await pb.collection('courses').getOne(route.params.id as string, {
      expand: 'owner,moderators,category',
    });
    baan.value = result as Course;
    if (baan.value?.country) {
      country.value = await pb.collection('countries').getOne(baan.value.country);
    }
  } catch (error) {
    console.error('Error loading baan:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het laden van de baan',
      icon: 'error',
    });
  }
});
</script>
