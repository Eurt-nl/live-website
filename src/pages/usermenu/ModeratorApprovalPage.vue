<template>
  <q-page padding>
    <div v-if="loading" class="text-center q-mt-lg">
      <q-spinner size="xl" />
      <div class="text-h6 q-mt-md">Gegevens laden...</div>
    </div>

    <div v-else-if="error" class="text-center q-mt-lg">
      <q-icon name="error" size="64px" color="negative" />
      <div class="text-h6 q-mt-md text-negative">{{ error }}</div>
      <q-btn label="Terug" color="primary" @click="$router.back()" class="q-mt-md" />
    </div>

    <div v-else-if="user && course" class="row q-col-gutter-md">
      <!-- Moderator aanvraag details -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h5">Moderator Aanvraag Goedkeuren</div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-md">
              <!-- Gebruiker informatie -->
              <div class="col-12 col-md-6">
                <div class="text-subtitle1 q-mb-sm">Gebruiker</div>
                <q-list>
                  <q-item>
                    <q-item-section avatar>
                      <q-avatar v-if="user.avatar">
                        <img :src="getUserAvatarUrl(user)" />
                      </q-avatar>
                      <q-avatar v-else color="primary" icon="person" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ user.name }}</q-item-label>
                      <q-item-label caption>{{ user.email }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <!-- Baan informatie -->
              <div class="col-12 col-md-6">
                <div class="text-subtitle1 q-mb-sm">Baan</div>
                <q-list>
                  <q-item>
                    <q-item-section avatar>
                      <q-avatar v-if="course.logo">
                        <img :src="getCourseLogoUrl(course)" />
                      </q-avatar>
                      <q-avatar v-else color="secondary" icon="golf_course" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ course.name }}</q-item-label>
                      <q-item-label caption
                        >{{ course.city }}, {{ country?.name || 'Onbekend land' }}</q-item-label
                      >
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </div>

            <!-- Motivatie -->
            <div class="q-mt-lg">
              <div class="text-subtitle1 q-mb-sm">Motivatie van de aanvrager</div>
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-body1">{{ motivation }}</div>
                </q-card-section>
              </q-card>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              label="Afwijzen"
              color="negative"
              @click="rejectModerator"
              :loading="processing"
            />
            <q-btn
              unelevated
              label="Goedkeuren"
              color="positive"
              @click="approveModerator"
              :loading="processing"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { usePocketbase } from 'src/composables/usePocketbase';
import { getFileUrl } from 'src/utils/pocketbase-helpers';
import type { Course, Country } from 'src/components/models';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const pb = usePocketbase();

const loading = ref(true);
const processing = ref(false);
const error = ref('');
const user = ref<any>(null);
const course = ref<Course | null>(null);
const country = ref<Country | null>(null);
const motivation = ref('');

const getUserAvatarUrl = (user: any) => {
  if (user.avatar) {
    return getFileUrl('users', user.id, user.avatar);
  }
  return '';
};

const getCourseLogoUrl = (course: Course) => {
  if (course.logo) {
    return getFileUrl('courses', course.id, course.logo);
  }
  return '';
};

const approveModerator = async () => {
  try {
    processing.value = true;

    // Haal huidige moderators op
    const currentModerators = course.value?.moderators || [];

    // Voeg nieuwe moderator toe (voorkom duplicaten)
    const newModerators = currentModerators.includes(user.value.id)
      ? currentModerators
      : [...currentModerators, user.value.id];

    // Update de baan met nieuwe moderator
    await pb.collection('courses').update(course.value!.id, {
      moderators: newModerators,
    });

    // Markeer notificatie als gezien
    if (route.query.notificationId) {
      try {
        await pb.collection('notifications').update(route.query.notificationId as string, {
          seen: true,
        });
      } catch (e) {
        console.warn('Kon notificatie niet markeren als gezien:', e);
      }
    }

    $q.notify({
      color: 'positive',
      message: `${user.value.name} is succesvol toegevoegd als moderator van ${course.value?.name}`,
      icon: 'check',
    });

    // Terug naar vorige pagina
    router.back();
  } catch (error) {
    console.error('Error approving moderator:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het goedkeuren van de moderator: ' + error.message,
      icon: 'error',
    });
  } finally {
    processing.value = false;
  }
};

const rejectModerator = async () => {
  try {
    processing.value = true;

    // Markeer notificatie als gezien
    if (route.query.notificationId) {
      try {
        await pb.collection('notifications').update(route.query.notificationId as string, {
          seen: true,
        });
      } catch (e) {
        console.warn('Kon notificatie niet markeren als gezien:', e);
      }
    }

    $q.notify({
      color: 'info',
      message: 'Moderator aanvraag afgewezen',
      icon: 'info',
    });

    // Terug naar vorige pagina
    router.back();
  } catch (error) {
    console.error('Error rejecting moderator:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het afwijzen van de moderator: ' + error.message,
      icon: 'error',
    });
  } finally {
    processing.value = false;
  }
};

onMounted(async () => {
  try {
    const userId = route.query.userId as string;
    const courseId = route.query.courseId as string;

    if (!userId || !courseId) {
      error.value = 'Ongeldige parameters';
      loading.value = false;
      return;
    }

    // Haal gebruiker en baan gegevens op
    const [userResult, courseResult] = await Promise.all([
      pb.collection('users').getOne(userId),
      pb.collection('courses').getOne(courseId, { expand: 'category' }),
    ]);

    user.value = userResult;
    course.value = courseResult as Course;

    // Haal land informatie op
    if (course.value.country) {
      country.value = await pb.collection('countries').getOne(course.value.country);
    }

    // Haal motivatie op uit de notificatie (als beschikbaar)
    if (route.query.notificationId) {
      try {
        const notification = await pb
          .collection('notifications')
          .getOne(route.query.notificationId as string);
        motivation.value = notification.body || 'Geen motivatie beschikbaar';
      } catch (e) {
        motivation.value = 'Motivatie niet beschikbaar';
      }
    } else {
      motivation.value = 'Motivatie niet beschikbaar';
    }

    loading.value = false;
  } catch (error) {
    console.error('Error loading moderator approval data:', error);
    error.value = 'Fout bij het laden van de gegevens: ' + error.message;
    loading.value = false;
  }
});
</script>
