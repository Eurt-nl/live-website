<template>
  <div v-if="baan" class="course-info-card">
    <!-- Baan informatie -->
    <q-card>
      <q-card-section>
        <div class="row items-center justify-between">
          <!-- Links: Baan naam en logo -->
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

          <!-- Rechts: Icoontjes -->
          <div class="row q-gutter-sm">
            <!-- Categorie icoon -->
            <div v-if="getCategoryIconUrl(baan)" class="text-center">
              <div class="icon-square bg-grey-2 flex items-center justify-center">
                <img
                  :src="getCategoryIconUrl(baan)"
                  :alt="baan.expand?.category?.name"
                  width="24"
                  height="24"
                />
              </div>
              <div class="text-caption text-grey-6 q-mt-xs">
                {{ baan.expand?.category?.name }}
              </div>
            </div>

            <!-- Route icoon (platform afhankelijk) -->
            <div v-if="baan.gps" class="text-center cursor-pointer" @click="openRouteInMaps">
              <div class="icon-square bg-primary flex items-center justify-center">
                <q-icon name="directions" color="white" size="24px" />
              </div>
              <div class="text-caption text-grey-6 q-mt-xs">Route</div>
            </div>

            <!-- Website icoon -->
            <div v-if="baan.website" class="text-center cursor-pointer" @click="openWebsite">
              <div class="icon-square bg-secondary flex items-center justify-center">
                <q-icon name="language" color="white" size="24px" />
              </div>
              <div class="text-caption text-grey-6 q-mt-xs">Website</div>
            </div>

            <!-- Email icoon -->
            <div v-if="baan.email" class="text-center cursor-pointer" @click="openEmail">
              <div class="icon-square bg-accent flex items-center justify-center">
                <q-icon name="email" color="white" size="24px" />
              </div>
              <div class="text-caption text-grey-6 q-mt-xs">Email</div>
            </div>

            <!-- Map icoon (voor popup) -->
            <div class="text-center cursor-pointer" @click="showMapDialog = true">
              <div class="icon-square bg-info flex items-center justify-center">
                <q-icon name="map" color="white" size="24px" />
              </div>
              <div class="text-caption text-grey-6 q-mt-xs">Kaart</div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Map Dialog -->
    <q-dialog v-model="showMapDialog" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ baan.name }} - Kaart</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="course-map-wrapper">
            <div class="course-map-container-full">
              <CourseMap :course-id="baan.id" :baan-gps="baan.gps" @update:holes="onUpdateHoles" />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
  <div v-else class="text-center q-mt-lg">
    <q-spinner size="xl" />
    <div class="text-h6 q-mt-md">Baan laden...</div>
  </div>
</template>

<script setup lang="ts">
// Herbruikbare component voor het tonen van baaninformatie, kaart en holes
import { ref } from 'vue';
import { getFileUrl } from 'src/utils/pocketbase-helpers';
import CourseMap from 'components/CourseMap.vue';
import type { Course, Hole, Country } from 'src/components/models';

const props = defineProps<{
  baan: Course | null;
  holes: Hole[];
  country?: Country | null;
}>();

// State voor map dialog
const showMapDialog = ref(false);

// Functie om het logo van de baan op te halen
const getLogoUrl = (baan: Course) => {
  if (baan.logo) {
    return getFileUrl('courses', baan.id, baan.logo);
  }
  return 'https://cdn.quasar.dev/img/parallax2.jpg';
};

// Functie om het categorie-icoon op te halen
const getCategoryIconUrl = (baan: Course) => {
  if (baan.expand?.category?.icon) {
    return getFileUrl('categories', baan.expand.category.id, baan.expand.category.icon);
  }
  return null;
};

// Platform-afhankelijke route functie
const openRouteInMaps = () => {
  if (!props.baan?.gps) return;
  const { latitude, longitude } = props.baan.gps;
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
  if (props.baan?.website) {
    window.open(props.baan.website, '_blank');
  }
};

// Open email client
const openEmail = () => {
  if (props.baan?.email) {
    const subject = `Vraag over ${props.baan.name}`;
    const body = `Hallo,\n\nIk heb een vraag over ${props.baan.name}.\n\nMet vriendelijke groet,`;
    const mailtoUrl = `mailto:${props.baan.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  }
};

// Callback om holes te updaten vanuit CourseMap
const onUpdateHoles = (newHoles: Hole[]) => {
  // Deze functie kan gebruikt worden als je holes wilt synchroniseren met de kaart
  // In deze component worden holes via props doorgegeven, dus meestal niet nodig
};
</script>

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
.hole-card {
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}
.hole-card:hover {
  background-color: #f5f5f5;
  border-color: #1976d2;
}

.course-map-container {
  height: 400px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.course-map-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px);
}

.course-map-container-full {
  aspect-ratio: 1;
  width: min(80vh, 80vw);
  height: min(80vh, 80vw);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.course-map-container-full :deep(.course-map-container) {
  height: 100% !important;
  width: 100% !important;
}

.course-map-container-full :deep(.course-map) {
  height: 100% !important;
  width: 100% !important;
}

.course-map-container-full :deep(.leaflet-container) {
  width: 100% !important;
  height: 100% !important;
}
</style>
