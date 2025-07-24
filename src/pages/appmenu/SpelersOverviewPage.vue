<template>
  <q-page padding>
    <div class="text-h4 q-mb-md">Spelers</div>

    <div class="row q-col-gutter-md">
      <div v-for="speler in spelers" :key="speler.id" class="col-12 col-sm-6 col-md-4">
        <q-card class="cursor-pointer" @click="navigateToSpeler(speler.id)">
          <q-card-section class="row items-center">
            <q-avatar size="48px" class="q-mr-md">
              <img :src="getAvatarUrl(speler)" />
            </q-avatar>
            <div>
              <div class="text-h6">{{ speler.name }}</div>
              <div class="text-caption text-grey">
                {{ speler.expand?.homecourse?.name || 'Geen homecourse' }}
              </div>
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
import pb from 'src/config/pocketbase';
import { getFileUrl } from 'src/utils/pocketbase-helpers';

const router = useRouter();
const loading = ref(true);
const spelers = ref([]);

const getAvatarUrl = (speler) => {
  if (speler.avatar) {
    return getFileUrl('users', speler.id, speler.avatar);
  }
  return 'https://cdn.quasar.dev/img/avatar.png';
};

const navigateToSpeler = (id) => {
  router.push(`/spelers/${id}`);
};

onMounted(async () => {
  try {
    const result = await pb.collection('users').getList(1, 50, {
      sort: 'name',
      expand: 'homecourse',
    });
    spelers.value = result.items;
  } catch (error) {
    console.error('Error loading data:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het laden van de gegevens',
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
});
</script>
