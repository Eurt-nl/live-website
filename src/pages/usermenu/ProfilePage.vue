<template>
  <div class="q-pa-md">
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5">Mijn profiel</div>
    </div>
    <div class="profile-container">
      <q-card class="profile-card">
        <q-card-section>
          <div class="text-h5 text-center q-mb-md">Profiel</div>
          <div class="text-subtitle2 text-center q-mb-lg">Pas je gegevens aan</div>

          <!-- Avatar sectie -->
          <div class="row justify-center q-mb-lg">
            <div class="avatar-container">
              <q-avatar size="120px" class="q-mb-sm">
                <img v-if="avatarUrl" :src="avatarUrl" alt="Profiel foto" />
                <q-icon v-else name="person" size="60px" />
              </q-avatar>
              <q-btn
                color="primary"
                icon="photo_camera"
                label="Foto wijzigen"
                @click="triggerFileInput"
                class="full-width"
              />
              <input
                type="file"
                ref="fileInput"
                @change="handleFileUpload"
                accept="image/*"
                style="display: none"
              />
            </div>
          </div>

          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-input
              v-model="name"
              type="text"
              label="Naam"
              id="name"
              name="name"
              autocomplete="name"
              :rules="[(val) => !!val || 'Naam is verplicht']"
              lazy-rules
            />

            <q-input
              v-model="email"
              type="email"
              label="E-mailadres"
              id="email"
              name="email"
              autocomplete="email"
              :rules="[
                (val) => !!val || 'E-mailadres is verplicht',
                (val) => /.+@.+\..+/.test(val) || 'Ongeldig e-mailadres',
              ]"
              lazy-rules
              disable
            />

            <q-toggle
              v-model="emailVisibility"
              label="E-mailadres zichtbaar voor andere gebruikers"
              color="primary"
            />

            <q-input
              v-model="birthyear"
              type="number"
              label="Geboortejaar"
              id="birthyear"
              name="birthyear"
              autocomplete="bday-year"
              :rules="[
                (val) => !!val || 'Geboortejaar is verplicht',
                (val) => val >= 1900 || 'Ongeldig geboortejaar',
                (val) => val <= new Date().getFullYear() || 'Ongeldig geboortejaar',
              ]"
              lazy-rules
            />

            <q-select
              v-model="homecourse"
              :options="coursesOptions"
              label="Homecourse"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              use-input
              input-debounce="0"
              clearable
              @filter="filterCourses"
              :rules="[(val) => !!val || 'Home Course is verplicht']"
              lazy-rules
            />

            <q-select
              v-model="category"
              :options="categories"
              label="Categorie"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              :rules="[(val) => !!val || 'Categorie is verplicht']"
              lazy-rules
            >
              <template v-slot:option="{ itemProps, opt }">
                <q-item v-bind="itemProps">
                  <q-item-section>
                    <q-item-label>{{ opt.name }}</q-item-label>
                    <q-item-label caption>{{ opt.description }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-select
              v-model="country"
              :options="countriesOptions"
              label="Land"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              use-input
              input-debounce="0"
              clearable
              @filter="filterCountries"
              :rules="[(val) => !!val || 'Land is verplicht']"
              lazy-rules
            />

            <!-- Knoppen naast elkaar -->
            <div class="row q-gutter-sm">
              <q-btn type="submit" color="primary" class="col" :loading="loading" label="Opslaan" />
              <q-btn
                type="button"
                color="grey"
                class="col"
                label="Annuleren"
                @click="annuleerWijzigingen"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth';
import { getFileUrl } from 'src/utils/pocketbase-helpers';
import { usePocketbase } from 'src/composables/usePocketbase';

const $q = useQuasar();
const $router = useRouter();
const authStore = useAuthStore();
const fileInput = ref<HTMLInputElement | null>(null);
const pb = usePocketbase();

const name = ref('');
const email = ref('');
const birthyear = ref(0);
const homecourse = ref('');
const category = ref('');
const emailVisibility = ref(false);
const loading = ref(false);
const avatarUrl = ref('');
// allCountries is de bronlijst met alle landen (voor filtering)
let allCountries: { id: string; name: string; flag?: string }[] = [];
// countriesOptions is de reactieve lijst die getoond wordt in de QSelect
const countriesOptions = ref<{ id: string; name: string; flag?: string }[]>([]);
const country = ref('');

// allCourses is de bronlijst met alle banen (voor filtering)
let allCourses: { id: string; name: string }[] = [];
// coursesOptions is de reactieve lijst die getoond wordt in de QSelect
const coursesOptions = ref<{ id: string; name: string }[]>([]);
const categories = ref([]);

// Haal alle banen op met paginering (type safe, geen any)
const loadAllCourses = async () => {
  const banen: { id: string; name: string }[] = [];
  let page = 1;
  const perPage = 100;
  let totalPages = 1;
  do {
    const result = await pb.collection('courses').getList(page, perPage, { sort: 'name' });
    banen.push(
      ...result.items.map((course: Record<string, unknown>) => ({
        id: typeof course.id === 'string' ? course.id : '',
        name: typeof course.name === 'string' ? course.name : '',
      })),
    );
    totalPages = result.totalPages;
    page++;
  } while (page <= totalPages);
  allCourses = banen;
  coursesOptions.value = [...allCourses]; // Initieel alle banen tonen
};

// Haal alle landen op met paginering (standaard Quasar aanpak)
const loadCountries = async () => {
  const landen: { id: string; name: string; flag?: string }[] = [];
  let page = 1;
  const perPage = 100;
  let totalPages = 1;
  do {
    const result = await pb.collection('countries').getList(page, perPage);
    landen.push(
      ...result.items.map((item: Record<string, unknown>) => ({
        id: typeof item.id === 'string' ? item.id : '',
        name: typeof item.name === 'string' ? item.name : '',
        flag: typeof item.flag === 'string' ? item.flag : '',
      })),
    );
    totalPages = result.totalPages;
    page++;
  } while (page <= totalPages);
  allCountries = landen;
  countriesOptions.value = [...allCountries]; // Initieel alle landen tonen
};

// Custom filterfunctie voor landen QSelect
function filterCountries(val: string, update: (callback: () => void) => void) {
  update(() => {
    // Filter de landenlijst op basis van de ingevoerde tekst (case-insensitive)
    const needle = val.toLowerCase();
    countriesOptions.value = allCountries.filter((c) => c.name.toLowerCase().includes(needle));
  });
}

// Custom filterfunctie voor banen QSelect (Homecourse)
function filterCourses(val: string, update: (callback: () => void) => void) {
  update(() => {
    // Filter de banenlijst op basis van de ingevoerde tekst (case-insensitive)
    const needle = val.toLowerCase();
    coursesOptions.value = allCourses.filter((c) => c.name.toLowerCase().includes(needle));
  });
}

onMounted(async () => {
  try {
    // Haal alle banen op
    await loadAllCourses();
    // Haal alle landen op
    await loadCountries();
    // Haal de categories op uit PocketBase
    const categoriesResult = await pb.collection('categories').getList(1, 50, {
      sort: 'name',
      filter: 'cat_type = "user"',
    });
    categories.value = categoriesResult.items.map((category: Record<string, unknown>) => ({
      id: typeof category.id === 'string' ? category.id : '',
      name: typeof category.name === 'string' ? category.name : '',
      description: typeof category.description === 'string' ? category.description : '',
      type: typeof category.type === 'string' ? category.type : '',
      metadata: category.metadata,
    }));

    if (authStore.user) {
      name.value = authStore.user.name;
      email.value = authStore.user.email;
      birthyear.value = authStore.user.birthyear;
      homecourse.value = authStore.user.homecourse || '';
      category.value = authStore.user.category || '';
      emailVisibility.value = authStore.user.emailVisibility || false;
      const userCountry = (authStore.user as Record<string, unknown>).country;
      country.value = typeof userCountry === 'string' ? userCountry : '';
      // Verbeterde avatar URL logica
      if (authStore.user.avatar) {
        try {
          avatarUrl.value = getFileUrl('users', authStore.user.id, authStore.user.avatar);
        } catch {
          // Avatar error wordt genegeerd
        }
      }
    }
  } catch {
    $q.notify({
      color: 'negative',
      message: 'Fout bij het laden van de gegevens',
      icon: 'error',
    });
  }
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    console.log('Selected file:', file);

    try {
      loading.value = true;

      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('name', name.value);
      formData.append('birthyear', birthyear.value.toString());
      formData.append('emailVisibility', emailVisibility.value.toString());
      if (homecourse.value) formData.append('homecourse', homecourse.value);
      if (category.value) formData.append('category', category.value);
      if (country.value) formData.append('country', country.value);

      console.log('Sending form data:', {
        name: name.value,
        birthyear: birthyear.value,
        homecourse: homecourse.value,
        category: category.value,
        emailVisibility: emailVisibility.value,
        hasAvatar: !!file,
        country: country.value,
      });

      const success = await authStore.updateProfile({
        name: name.value,
        birthyear: birthyear.value,
        homecourse: homecourse.value,
        category: category.value,
        emailVisibility: emailVisibility.value,
        avatar: file,
        country: country.value,
      });

      if (success) {
        console.log('Profile update successful');
        $q.notify({
          color: 'positive',
          message: 'Profiel succesvol bijgewerkt',
          icon: 'check',
        });

        // Update de avatar URL na succesvolle upload
        if (authStore.user?.avatar) {
          try {
            console.log('New avatar value:', authStore.user.avatar);
            avatarUrl.value = getFileUrl('users', authStore.user.id, authStore.user.avatar);
            console.log('New avatar URL:', avatarUrl.value);
          } catch {
            // Avatar error wordt genegeerd
          }
        }
      } else {
        throw new Error('Profiel bijwerken mislukt');
      }
    } catch {
      $q.notify({
        color: 'negative',
        message: 'Profiel bijwerken mislukt. Probeer het opnieuw.',
        icon: 'error',
      });
    } finally {
      loading.value = false;
    }
  }
};

// Annuleer-knop: ga terug naar vorige pagina
function annuleerWijzigingen() {
  $router.back();
}

const onSubmit = async () => {
  try {
    loading.value = true;
    const success = await authStore.updateProfile({
      name: name.value,
      birthyear: birthyear.value,
      homecourse: homecourse.value,
      category: category.value,
      emailVisibility: emailVisibility.value,
      country: country.value,
    });

    if (success) {
      $q.notify({
        color: 'positive',
        message: 'Profiel succesvol bijgewerkt',
        icon: 'check',
      });
      // Ga terug naar de vorige pagina na succesvol opslaan
      $router.back();
    } else {
      throw new Error('Profiel bijwerken mislukt');
    }
  } catch {
    $q.notify({
      color: 'negative',
      message: 'Profiel bijwerken mislukt. Probeer het opnieuw.',
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.profile-container {
  width: 100%;
  max-width: 400px;
  padding: 16px;
}

.profile-card {
  width: 100%;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 200px;
}
</style>
