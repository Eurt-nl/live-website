<template>
  <div class="q-pa-md">
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5">Mijn banen</div>
      <q-btn color="primary" icon="add" label="Nieuwe baan" @click="openNewBaanDialog" />
    </div>

    <div class="row q-col-gutter-md">
      <div v-for="baan in banen" :key="baan.id" class="col-12 col-sm-6 col-md-4">
        <q-card flat bordered>
          <q-card-section class="q-pa-sm">
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-h6">{{ baan.name }}</div>
                <div class="text-subtitle2">
                  {{ baan.city }}, {{ getCountryName(baan.country) }}
                </div>
              </div>
              <div class="col-auto">
                <q-btn color="primary" round flat icon="more_vert">
                  <q-menu cover auto-close>
                    <q-list>
                      <q-item clickable @click="() => openEditDialog(baan)">
                        <q-item-section>Bewerken</q-item-section>
                      </q-item>
                      <q-item clickable @click="() => toggleHoles(baan.id)">
                        <q-item-section>Holes</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>
            </div>
            <div class="q-mt-sm">
              <div class="text-body2" v-if="baan.email">E-mail: {{ baan.email }}</div>
              <div class="text-body2" v-if="baan.website">Website: {{ baan.website }}</div>
              <div class="text-body2" v-if="baan.expand?.category?.name">
                Categorie: {{ baan.expand.category.name }}
              </div>
            </div>
            <div
              class="q-mt-sm row items-center no-wrap justify-end"
              style="gap: 4px; flex-wrap: nowrap; overflow-x: auto"
            >
              <q-chip
                :color="baan.role === 'owner' ? 'primary' : 'secondary'"
                text-color="white"
                size="sm"
                outline
                square
              >
                {{ baan.role === 'owner' ? 'Eigenaar' : 'Moderator' }}
              </q-chip>
              <q-chip
                v-if="baan.expand?.category?.name"
                color="secondary"
                text-color="white"
                size="sm"
                outline
                square
              >
                {{ baan.expand.category.name }}
              </q-chip>
            </div>
          </q-card-section>
        </q-card>
        <q-card v-if="expandedBaan === baan.id" class="q-mt-sm">
          <q-card-section>
            <holes-manager :course-id="baan.id" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="editDialog" persistent>
      <q-card style="min-width: 350px">
        <div class="dialog-header" :style="dialogHeaderStyle">
          <div class="header-section">
            <div class="header-overlay" @click="triggerHeaderUpload">
              <q-icon v-if="!dialogHeaderStyle.backgroundImage" name="add_a_photo" size="xl" />
              <span v-if="!dialogHeaderStyle.backgroundImage">Header toevoegen</span>
              <input
                ref="headerInput"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleHeaderUpload"
              />
            </div>
          </div>
          <div class="logo-section">
            <div class="logo-container" @click="triggerLogoUpload">
              <img v-if="dialogLogoUrl" :src="dialogLogoUrl" alt="Logo" class="logo" />
              <div v-else class="logo-placeholder">
                <q-icon name="add_a_photo" size="xl" />
                <span>Logo toevoegen</span>
              </div>
              <input
                ref="logoInput"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleLogoUpload"
              />
            </div>
          </div>
        </div>

        <q-card-section>
          <div class="text-h6">{{ isNew ? 'Nieuwe baan' : 'Baan bewerken' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-input
              v-model="formData.name"
              label="Naam"
              :rules="[(val) => !!val || 'Naam is verplicht']"
            />

            <q-input
              v-model="formData.city"
              label="Stad"
              :rules="[(val) => !!val || 'Stad is verplicht']"
            />

            <q-select
              v-model="formData.country"
              :options="countriesOptions"
              label="Land"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              use-input
              input-debounce="0"
              :rules="[(val) => !!val || 'Land is verplicht']"
              hint="Zoek en selecteer een land"
              clearable
              @filter="filterCountries"
            />

            <div class="row q-mb-md">
              <div class="col-12">
                <q-btn
                  :color="hasGps ? 'positive' : 'grey'"
                  icon="my_location"
                  :label="hasGps ? 'Locatie wissen' : 'Locatie toevoegen'"
                  @click="openLocationPicker"
                />
              </div>
            </div>

            <q-input v-model="formData.email" type="email" label="E-mail" />

            <q-input
              v-model="formData.website"
              type="text"
              label="Website"
              hint="Bijvoorbeeld: www.website.nl of website.nl"
            />

            <q-select
              v-model="formData.category"
              :options="categories"
              label="Categorie"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              :rules="[(val) => !!val || 'Categorie is verplicht']"
            />

            <div class="row justify-end q-gutter-sm">
              <q-btn label="Annuleren" color="grey" v-close-popup />
              <q-btn label="Opslaan" type="submit" color="primary" :loading="loading" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="locationPickerDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Selecteer locatie</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <location-picker
            v-model:latitude="formData.gps.latitude"
            v-model:longitude="formData.gps.longitude"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annuleren" color="grey" v-close-popup />
          <q-btn flat label="Bevestigen" color="primary" @click="confirmLocation" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useAuthStore } from 'stores/auth';
import type { Course, Country } from 'src/components/models';
import { getFileUrl } from 'src/utils/pocketbase-helpers';
import HolesManager from 'components/HolesManager.vue';
import LocationPicker from 'components/LocationPicker.vue';

const pb = usePocketbase();
const authStore = useAuthStore();
const $q = useQuasar();

const banen = ref<Course[]>([]);
const loading = ref(false);
const editDialog = ref(false);
const isNew = ref(false);

const categories = ref([]);

// allCountries is de bronlijst met alle landen (voor filtering)
let allCountries: Country[] = [];
// countriesOptions is de reactieve lijst die getoond wordt in de QSelect
const countriesOptions = ref<Country[]>([]);

// Type voor formData uitbreiden met id, zonder Partial<Course>
interface FormDataCourse {
  id?: string;
  name: string;
  city: string;
  country: string;
  gps: { latitude: number; longitude: number };
  logo: string | File | null;
  header: string | File | null;
  email: string;
  website: string;
  category: string;
  owner?: string;
  moderators?: string[];
}

const formData = ref<FormDataCourse>({
  name: '',
  city: '',
  country: '',
  gps: {
    latitude: 0,
    longitude: 0,
  },
  logo: null,
  header: null,
  email: '',
  website: '',
  category: '',
});

const existingLogo = ref('');
const existingHeader = ref('');

const logoInput = ref<HTMLInputElement | null>(null);
const headerInput = ref<HTMLInputElement | null>(null);

const locationPickerDialog = ref(false);

const hasGps = ref(false);

const expandedBaan = ref<string | null>(null);

// Voeg een watch toe om hasGps bij te werken wanneer de GPS waarden veranderen
watch(
  () => formData.value.gps,
  (newGps) => {
    hasGps.value = newGps.latitude !== 0 && newGps.longitude !== 0;
  },
  { deep: true },
);

// Helper om landnaam op te halen op basis van id
const getCountryName = (countryId: string) => {
  const land = countriesOptions.value.find((c) => c.id === countryId);
  return land ? land.name : countryId;
};

const loadBanen = async () => {
  try {
    loading.value = true;
    const userId = authStore.user?.id;

    // Haal banen op waar de gebruiker eigenaar of moderator is
    const result = await pb.collection('courses').getList(1, 50, {
      filter: `owner = "${userId}" || moderators ?~ "${userId}"`,
      sort: 'name',
      expand: 'category',
    });

    banen.value = (result.items as unknown as Course[]).map((baan) => ({
      ...baan,
      role: baan.owner === userId ? 'owner' : 'moderator',
    }));
  } catch (error) {
    console.error('Error loading banen:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het laden van de banen',
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const result = await pb.collection('categories').getList(1, 50, {
      filter: 'cat_type = "course"',
      sort: 'name',
    });
    categories.value = result.items;
  } catch (error) {
    console.error('Error loading categories:', error);
  }
};

const loadCountries = async () => {
  try {
    const landen: Country[] = [];
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
  } catch (error) {
    console.error('Error loading countries:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het laden van de landen',
      icon: 'error',
    });
  }
};

// Custom filterfunctie voor landen QSelect
function filterCountries(val: string, update: (callback: () => void) => void) {
  update(() => {
    // Filter de landenlijst op basis van de ingevoerde tekst (case-insensitive)
    const needle = val.toLowerCase();
    countriesOptions.value = allCountries.filter((c) => c.name.toLowerCase().includes(needle));
  });
}

const openNewBaanDialog = () => {
  isNew.value = true;
  formData.value = {
    name: '',
    city: '',
    country: '',
    gps: {
      latitude: 0,
      longitude: 0,
    },
    logo: null,
    header: null,
    email: '',
    website: '',
    category: '',
  };
  editDialog.value = true;
};

const openEditDialog = (baan: Course) => {
  console.log('Opening edit dialog with baan:', baan);
  isNew.value = false;
  formData.value = {
    id: baan.id,
    name: baan.name,
    city: baan.city,
    country: baan.country,
    gps: baan.gps ? { ...baan.gps } : { latitude: 0, longitude: 0 },
    logo: null,
    header: null,
    email: baan.email,
    website: baan.website,
    category: baan.category,
    owner: baan.owner,
    moderators: baan.moderators,
  };
  existingLogo.value = baan.logo || '';
  existingHeader.value = baan.header || '';
  console.log('Form data after setting:', formData.value);
  editDialog.value = true;
};

const formatWebsiteUrl = (url: string) => {
  if (!url) return '';
  // Als de URL al begint met http:// of https://, return direct
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // In alle andere gevallen voeg http:// toe
  return `http://${url}`;
};

const onSubmit = async () => {
  try {
    loading.value = true;
    const userId = authStore.user?.id;

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.value.name);
    formDataToSend.append('city', formData.value.city);
    formDataToSend.append('country', formData.value.country);
    formDataToSend.append('gps', JSON.stringify(formData.value.gps));
    formDataToSend.append('email', formData.value.email);
    formDataToSend.append('website', formatWebsiteUrl(formData.value.website));
    formDataToSend.append('category', formData.value.category);

    if (formData.value.logo instanceof File) {
      formDataToSend.append('logo', formData.value.logo);
    } else if (!isNew.value && !existingLogo.value) {
      formDataToSend.append('logo', '');
    }

    if (formData.value.header instanceof File) {
      formDataToSend.append('header', formData.value.header);
    } else if (!isNew.value && !existingHeader.value) {
      formDataToSend.append('header', '');
    }

    if (isNew.value) {
      formDataToSend.append('owner', userId);
      await pb.collection('courses').create(formDataToSend);
    } else {
      await pb.collection('courses').update(formData.value.id, formDataToSend);
    }

    $q.notify({
      color: 'positive',
      message: isNew.value ? 'Baan succesvol aangemaakt' : 'Baan succesvol bijgewerkt',
      icon: 'check',
    });

    editDialog.value = false;
    await loadBanen();
  } catch (error) {
    console.error('Error saving baan:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij het opslaan van de baan',
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};

const dialogHeaderStyle = computed(() => {
  console.log('Header image data:', {
    header: formData.value.header,
    id: formData.value.id,
    isFile: formData.value.header instanceof File,
  });

  let headerUrl = '';
  if (formData.value.header instanceof File) {
    headerUrl = URL.createObjectURL(formData.value.header);
  } else if (existingHeader.value && formData.value.id) {
    try {
      headerUrl = getFileUrl('courses', formData.value.id, existingHeader.value);
      console.log('Generated header URL:', headerUrl);
    } catch (error) {
      console.error('Error generating header URL:', error);
    }
  }

  if (!headerUrl) return {};

  return {
    backgroundImage: `url(${headerUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
});

const dialogLogoUrl = computed(() => {
  console.log('Logo data:', {
    logo: formData.value.logo,
    id: formData.value.id,
    isFile: formData.value.logo instanceof File,
  });

  if (formData.value.logo instanceof File) {
    return URL.createObjectURL(formData.value.logo);
  } else if (existingLogo.value && formData.value.id) {
    try {
      const url = getFileUrl('courses', formData.value.id, existingLogo.value);
      console.log('Generated logo URL:', url);
      return url;
    } catch (error) {
      console.error('Error generating logo URL:', error);
      return null;
    }
  }
  return null;
});

const triggerLogoUpload = () => {
  logoInput.value?.click();
};

const triggerHeaderUpload = () => {
  headerInput.value?.click();
};

const handleLogoUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    formData.value.logo = input.files[0];
  }
};

const handleHeaderUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    formData.value.header = input.files[0];
  }
};

const openLocationPicker = () => {
  if (hasGps.value) {
    // Als er al een locatie is, wis deze
    formData.value.gps = {
      latitude: 0,
      longitude: 0,
    };
    $q.notify({
      color: 'info',
      message: 'Locatie is gewist',
      icon: 'info',
    });
  } else {
    // Anders open de location picker
    locationPickerDialog.value = true;
  }
};

const confirmLocation = () => {
  // Controleer of er geldige GPS coördinaten zijn
  if (formData.value.gps.latitude !== 0 && formData.value.gps.longitude !== 0) {
    // De GPS waarden zijn al bijgewerkt door de v-model binding
    // We hoeven alleen de dialog te sluiten
    locationPickerDialog.value = false;
  } else {
    // Toon een foutmelding als er geen geldige coördinaten zijn
    $q.notify({
      color: 'negative',
      message: 'Selecteer eerst een locatie op de kaart',
      icon: 'error',
    });
  }
};

const toggleHoles = (baanId: string) => {
  if (expandedBaan.value === baanId) {
    expandedBaan.value = null;
  } else {
    expandedBaan.value = baanId;
  }
};

onMounted(async () => {
  await Promise.all([loadBanen(), loadCategories(), loadCountries()]);
});
</script>

<style lang="scss" scoped>
.my-banen-page {
  min-height: 100vh;
}

.dialog-header {
  height: 150px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background-color: #f5f5f5;
  padding-left: 20px;
  overflow: hidden;
}

.logo-section {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 2;
}

.header-section {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  gap: 0.5rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }

  .q-icon {
    color: white;
  }
}

.logo-container {
  background-color: white;
  padding: 1rem;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  min-height: 100px;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
}

.logo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 0.8rem;
  text-align: center;
  gap: 0.5rem;
}

.logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
}
</style>
