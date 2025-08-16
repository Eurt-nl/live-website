<template>
  <div class="course-map-container">
    <div ref="mapContainer" class="course-map"></div>
    <q-dialog
      v-model="showImageDialog"
      maximized
      persistent
      transition-show="fade"
      transition-hide="fade"
    >
      <q-img
        :src="dialogImageUrl"
        style="width: 100vw; height: 100vh; object-fit: contain; cursor: pointer"
        @click="showImageDialog = false"
      />
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { usePocketbase } from 'src/composables/usePocketbase';
import type { Hole } from 'src/components/models';
import { getFileUrl } from 'src/utils/pocketbase-helpers';

// Extend Window interface for global function
declare global {
  interface Window {
    __showHoleImage: (url: string) => void;
  }
}

// Dialog state voor grote afbeelding
const showImageDialog = ref(false);
const dialogImageUrl = ref('');

const props = defineProps<{
  courseId: string;
  baanGps?: { latitude: number; longitude: number };
}>();

const emit = defineEmits<{
  (e: 'update:holes', holes: Hole[]): void;
}>();

const pb = usePocketbase();
const mapContainer = ref<HTMLElement | null>(null);
const map = ref<L.Map | null>(null);
const holes = ref<Hole[]>([]);

// Maak custom markers voor tee en green
const teeIcon = L.divIcon({
  className: 'tee-marker',
  html: '<div class="tee-marker-inner"></div>',
  iconSize: [10, 10],
});

const greenIcon = L.divIcon({
  className: 'green-marker',
  html: '<div class="green-marker-inner"></div>',
  iconSize: [15, 15],
});

const loadHoles = async () => {
  try {
    console.log('CourseMap: Loading holes for course:', props.courseId);

    // Reset holes array voordat we nieuwe holes laden
    holes.value = [];

    const result = await pb.collection('course_detail').getList(1, 50, {
      filter: `course = "${props.courseId}"`,
      sort: 'hole',
    });

    console.log('CourseMap: Holes result:', result.items.length, 'holes found');
    if (result && result.items && result.items.length > 0) {
      holes.value = result.items as unknown as Hole[];
      emit('update:holes', result.items as unknown as Hole[]);
      console.log('CourseMap: Holes loaded, calling updateMap with', holes.value.length, 'holes');
      updateMap();
    } else {
      console.log('CourseMap: No holes found, updating map anyway');
      updateMap();
    }
  } catch (error) {
    console.error('CourseMap: Error loading holes:', error);
    // Update map ook bij fout om eventuele oude markers te verwijderen
    updateMap();
  }
};

const updateMap = () => {
  if (!map.value) {
    console.log('CourseMap: Map not ready yet');
    return;
  }

  console.log('CourseMap: Updating map with', holes.value.length, 'holes');

  // Wacht even om ervoor te zorgen dat de map volledig is geladen
  setTimeout(() => {
    if (!map.value) {
      console.log('CourseMap: Map still not ready after timeout');
      return;
    }

    // Reset de kaart naar de standaard view voordat we nieuwe markers toevoegen
    console.log('CourseMap: Resetting map to default view');
    map.value.setView([52.3676, 4.9041], 15);

    // Verwijder bestaande markers en lijnen
    map.value.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.value?.removeLayer(layer);
      }
    });

    const bounds = L.latLngBounds([]);

    // Voeg markers en lijnen toe voor elke hole
    console.log('CourseMap: Processing', holes.value.length, 'holes for markers');
    holes.value.forEach((hole) => {
      console.log('CourseMap: Processing hole', hole.hole, 'GPS tee:', hole.gps_tee);
      if (hole.gps_tee?.latitude && hole.gps_tee?.longitude) {
        const teeLatLng = L.latLng(hole.gps_tee.latitude, hole.gps_tee.longitude);
        bounds.extend(teeLatLng);

        console.log('CourseMap: Adding tee marker for hole', hole.hole, 'at:', teeLatLng);
        L.marker(teeLatLng, {
          icon: teeIcon,
        }).addTo(map.value as L.Map);

        if (hole.gps_green?.latitude && hole.gps_green?.longitude) {
          const greenLatLng = L.latLng(hole.gps_green.latitude, hole.gps_green.longitude);
          bounds.extend(greenLatLng);

          console.log('CourseMap: Adding green marker for hole', hole.hole, 'at:', greenLatLng);
          L.marker(greenLatLng, {
            icon: greenIcon,
          }).addTo(map.value as L.Map);

          // Teken een lijn tussen tee en green
          L.polyline([teeLatLng, greenLatLng], {
            color: '#1976D2',
            weight: 2,
          }).addTo(map.value as L.Map);

          // Voeg een label toe aan de lijn
          const label = L.marker(
            [
              (hole.gps_tee.latitude + hole.gps_green.latitude) / 2,
              (hole.gps_tee.longitude + hole.gps_green.longitude) / 2,
            ],
            {
              icon: L.divIcon({
                className: 'hole-label',
                html: `<div class="hole-label-inner">${hole.hole}</div>`,
                iconSize: [30, 20],
              }),
            },
          ).addTo(map.value as L.Map);

          // Voeg een popup toe aan de label
          let thumbHtml = '';
          if (hole.image) {
            const imgUrl = getFileUrl('course_detail', hole.id, hole.image);
            thumbHtml = `<img src="${imgUrl}" alt="Hole foto" style="width:100px;max-width:100px;max-height:100px;object-fit:cover;border-radius:6px;margin-bottom:8px;cursor:pointer;" onclick="window.__showHoleImage && window.__showHoleImage('${imgUrl}')" />`;
          }
          label.bindPopup(`
          <div class="hole-popup">
            ${thumbHtml}
            <div class="text-h6">Hole ${hole.hole}</div>
            <div class="text-subtitle2">Afstand: ${hole.hole_length}m</div>
            <div class="text-subtitle2">Index: ${String(hole.hole_index).padStart(2, '0')}</div>
          </div>
        `);
        }
      }
    });

    // Pas de kaart aan om alle markers te tonen met een kleine marge
    if (bounds.isValid()) {
      console.log('CourseMap: Fitting bounds to course:', bounds);
      map.value.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 19,
      });
    } else if (
      props.baanGps &&
      typeof props.baanGps.latitude === 'number' &&
      typeof props.baanGps.longitude === 'number'
    ) {
      // Geen holes: zoom in op de locatie van de baan
      console.log('CourseMap: No bounds, using baan GPS:', props.baanGps);
      map.value.setView([props.baanGps.latitude, props.baanGps.longitude], 16);
    } else {
      console.log('CourseMap: No bounds or GPS available, keeping default view');
    }
  }, 50); // Korte timeout om de map tijd te geven om volledig te laden
};

onMounted(() => {
  console.log('CourseMap: onMounted called, mapContainer:', !!mapContainer.value);
  if (mapContainer.value) {
    map.value = L.map(mapContainer.value).setView([52.3676, 4.9041], 15);
    console.log('CourseMap: Map initialized');

    // Voeg ESRI World Imagery toe als satellietlaag
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      },
    ).addTo(map.value as L.Map);

    // Wacht even voordat we holes laden om ervoor te zorgen dat de map volledig is geladen
    setTimeout(() => {
      console.log('CourseMap: Loading holes after map initialization');
      void loadHoles();
    }, 100);
  }
  // Registreer globale functie voor popup click
  window.__showHoleImage = (url) => {
    dialogImageUrl.value = url;
    showImageDialog.value = true;
  };
});

watch(
  () => props.courseId,
  (newCourseId, oldCourseId) => {
    console.log('CourseMap: courseId changed from', oldCourseId, 'to:', newCourseId);
    if (map.value && newCourseId) {
      // Force een volledige reset door eerst de map te resetten
      console.log('CourseMap: Forcing map reset for new course');
      map.value.setView([52.3676, 4.9041], 15);

      // Wacht even voordat we holes laden om ervoor te zorgen dat de map reset is voltooid
      setTimeout(() => {
        console.log('CourseMap: Loading holes after map reset');
        void loadHoles();
      }, 100);
    } else if (!map.value) {
      console.log('CourseMap: Map not ready yet, will load holes when map is available');
    }
  },
);

// Watch voor wanneer de map beschikbaar komt
watch(
  () => map.value,
  (newMap) => {
    if (newMap && props.courseId) {
      console.log('CourseMap: Map became available, loading holes');
      void loadHoles();
    }
  },
);
</script>

<style lang="scss" scoped>
.course-map-container {
  height: 400px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.course-map {
  height: 100%;
  width: 100%;
}

:deep(.tee-marker) {
  background-color: #1976d2;
  border-radius: 4px;
  width: 10px;
  height: 10px;
}

:deep(.green-marker) {
  background-color: #4caf50;
  border-radius: 50%;
  width: 15px;
  height: 15px;
}

:deep(.hole-label) {
  background: white;
  border: 1px solid #1976d2;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 12px;
  font-weight: bold;
  color: #1976d2;
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
}

:deep(.hole-popup) {
  padding: 8px;
  min-width: 150px;
}
</style>
