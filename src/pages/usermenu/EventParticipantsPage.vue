<template>
  <div class="q-pa-md">
    <div class="row q-mb-md">
      <div class="text-h5">{{ event?.name }}</div>
    </div>
    <div style="height: 12px" />
    <div v-if="loading" class="row justify-center">
      <q-spinner color="primary" size="3em" />
    </div>
    <div v-else-if="event" class="q-gutter-md">
      <q-card>
        <q-card-section>
          <div class="row items-center q-mb-md">
            <div class="col text-subtitle2">
              Huidige deelnemers ({{ registrations.length }}/{{ event.max_players }})
            </div>
            <div class="col-auto">
              <q-btn
                v-if="isModerator"
                color="primary"
                label="Speler toevoegen"
                @click="showAddDialog = true"
              />
            </div>
          </div>
          <div class="row q-mb-sm q-gutter-sm">
            <div class="col text-center">
              <q-btn
                flat
                dense
                :color="sortBy === 'name' ? 'primary' : 'grey'"
                @click="setSort('name')"
                style="width: 100%"
              >
                Naam
                <q-icon
                  v-if="sortBy === 'name'"
                  :name="sortDesc ? 'arrow_downward' : 'arrow_upward'"
                  size="16px"
                />
              </q-btn>
            </div>
            <div class="col-auto text-center" style="width: 32px">
              <q-btn
                flat
                dense
                :color="sortBy === 'category' ? 'primary' : 'grey'"
                @click="setSort('category')"
                style="width: 100%"
              >
                CAT
                <q-icon
                  v-if="sortBy === 'category'"
                  :name="sortDesc ? 'arrow_downward' : 'arrow_upward'"
                  size="16px"
                />
              </q-btn>
            </div>
            <div class="col-auto text-center" style="width: 36px">
              <q-btn
                flat
                dense
                :color="sortBy === 'status' ? 'primary' : 'grey'"
                @click="setSort('status')"
                style="width: 100%"
              >
                Status
                <q-icon
                  v-if="sortBy === 'status'"
                  :name="sortDesc ? 'arrow_downward' : 'arrow_upward'"
                  size="16px"
                />
              </q-btn>
            </div>
          </div>
          <div>
            <div v-for="reg in sortedRows" :key="reg.id" class="q-mb-xs">
              <q-slide-item
                v-if="isModerator"
                right-color="negative"
                @right="removeParticipant(reg.expand?.user?.id)"
              >
                <template v-slot:right>
                  <div class="row items-center q-px-md"><q-icon name="delete" /></div>
                </template>
                <div
                  class="row items-center q-gutter-md q-pl-sm q-pr-sm"
                  style="min-height: 36px; cursor: pointer"
                  @click.stop="openEditDialog(reg)"
                >
                  <div
                    class="col text-body2 ellipsis"
                    style="min-width: 0; max-width: 100vw; flex: 2 1 0"
                  >
                    {{ reg.expand?.user?.name }}
                  </div>
                  <div class="col-auto text-body2 text-grey-8 text-center" style="width: 32px">
                    {{
                      reg.expand?.category?.name
                        ? reg.expand.category.name.charAt(0).toUpperCase()
                        : '-'
                    }}
                  </div>
                  <div class="col-auto text-center" style="width: 36px">
                    <q-icon
                      :name="statusIcon(reg.expand?.status?.name)"
                      :color="statusColor(reg.expand?.status?.name)"
                      size="22px"
                    />
                  </div>
                </div>
              </q-slide-item>
              <div
                v-else
                class="row items-center q-gutter-md q-pl-sm q-pr-sm"
                style="min-height: 36px"
              >
                <div
                  class="col text-body2 ellipsis"
                  style="min-width: 0; max-width: 100vw; flex: 2 1 0"
                >
                  {{ reg.expand?.user?.name }}
                </div>
                <div class="col-auto text-body2 text-grey-8 text-center" style="width: 32px">
                  {{
                    reg.expand?.category?.name
                      ? reg.expand.category.name.charAt(0).toUpperCase()
                      : '-'
                  }}
                </div>
                <div class="col-auto text-center" style="width: 36px">
                  <q-icon
                    :name="statusIcon(reg.expand?.status?.name)"
                    :color="statusColor(reg.expand?.status?.name)"
                    size="22px"
                  />
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
      <q-dialog v-model="showAddDialog" @hide="onDialogHide">
        <q-card style="min-width: 320px; max-width: 90vw">
          <q-card-section>
            <div class="text-h6">{{ isEdit ? 'Inschrijving bewerken' : 'Speler toevoegen' }}</div>
            <q-select
              v-model="addForm.user"
              :options="availablePlayers"
              option-label="name"
              option-value="id"
              label="Speler"
              emit-value
              map-options
              outlined
              @update:model-value="onPlayerSelect"
              :disable="isEdit"
            />
            <q-select
              v-model="addForm.category"
              :options="userCategories"
              option-label="name"
              option-value="id"
              label="Categorie"
              emit-value
              map-options
              outlined
              class="q-mt-sm"
            />
            <q-select
              v-model="addForm.status"
              :options="registrationStatuses"
              option-label="name"
              option-value="id"
              label="Status"
              emit-value
              map-options
              outlined
              class="q-mt-sm"
            />
            <q-input
              v-model="addForm.notitie"
              label="Notitie"
              type="textarea"
              outlined
              class="q-mt-sm"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Annuleren" color="primary" v-close-popup />
            <q-btn
              flat
              :label="isEdit ? 'Opslaan' : 'Toevoegen'"
              color="primary"
              @click="saveParticipant"
              :disable="!addForm.user || !addForm.category || !addForm.status"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
    <div v-else class="text-center">
      <div class="text-h6">Event niet gevonden</div>
      <q-btn flat color="primary" label="Terug" @click="router.back()" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useRegistrations } from 'src/components/events/registrations';
import { useAuthStore } from 'src/stores/auth';
import type { Category } from 'src/components/models';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const pb = usePocketbase();
const authStore = useAuthStore();

const event = ref(null);
const loading = ref(true);
const showAddDialog = ref(false);
const isEdit = ref(false);
const editRegistrationId = ref(null);
const addForm = ref({ user: null, category: null, status: null, notitie: '' });
const availablePlayers = ref([]);
const allPlayers = ref([]);
const userCategories = ref<Category[]>([]);
const registrationStatuses = ref<Category[]>([]);

const {
  registrations,
  fetchRegistrationsByEvent,
  addRegistration,
  removeRegistration,
  loading: regLoading,
} = useRegistrations();

const columns = [
  { name: 'name', label: 'Naam', field: 'name', align: 'left', sortable: true },
  { name: 'category', label: 'Categorie', field: 'category', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'left', sortable: true },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

const sortBy = ref('name');
const sortDesc = ref(false);

function setSort(col) {
  if (sortBy.value === col) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortBy.value = col;
    sortDesc.value = false;
  }
}

function statusIcon(status) {
  if (!status) return 'help_outline';
  const s = status.toLowerCase();
  if (s.includes('reserve')) return 'hourglass_empty';
  if (s.includes('bevestigd')) return 'check_circle';
  if (s.includes('aangevraagd')) return 'help_outline';
  return 'help_outline';
}

function statusColor(status) {
  if (!status) return 'grey';
  const s = status.toLowerCase();
  if (s.includes('reserve')) return 'orange';
  if (s.includes('bevestigd')) return 'positive';
  if (s.includes('aangevraagd')) return 'blue';
  return 'grey';
}

const sortMethod = (rows, sortBy, descending) => {
  return [...rows].sort((a, b) => {
    let aVal, bVal;
    if (sortBy === 'name') {
      aVal = a.expand?.user?.name || '';
      bVal = b.expand?.user?.name || '';
    } else if (sortBy === 'category') {
      aVal = a.expand?.category?.name || '';
      bVal = b.expand?.category?.name || '';
    } else if (sortBy === 'status') {
      aVal = a.expand?.status?.name || '';
      bVal = b.expand?.status?.name || '';
    }
    if (aVal < bVal) return descending ? 1 : -1;
    if (aVal > bVal) return descending ? -1 : 1;
    return 0;
  });
};

const sortedRows = computed(() => sortMethod(registrations.value, sortBy.value, sortDesc.value));

const loadEvent = async () => {
  try {
    loading.value = true;
    const result = await pb.collection('events').getOne(route.params.id as string, {
      expand: 'status',
    });
    event.value = result;
  } catch (error) {
    $q.notify({ color: 'negative', message: 'Fout bij het laden van het event', icon: 'error' });
  } finally {
    loading.value = false;
  }
};

const loadAvailablePlayers = async () => {
  try {
    const result = await pb.collection('users').getList(1, 50, { sort: 'name' });
    allPlayers.value = result.items;
    availablePlayers.value = result.items;
  } catch (error) {
    $q.notify({ color: 'negative', message: 'Fout bij het laden van de spelers', icon: 'error' });
  }
};

const loadCategories = async () => {
  try {
    const userCatResult = await pb.collection('categories').getList(1, 50, {
      filter: 'cat_type = "user"',
      sort: 'name',
    });
    userCategories.value = userCatResult.items;
    const regStatusResult = await pb.collection('categories').getList(1, 50, {
      filter: 'cat_type = "registration"',
      sort: 'name',
    });
    registrationStatuses.value = regStatusResult.items;
  } catch (error) {
    $q.notify({ color: 'negative', message: 'Fout bij het laden van categorieën', icon: 'error' });
  }
};

function onPlayerSelect(userId) {
  const user = allPlayers.value.find((u) => u.id === userId);
  if (user && user.category) {
    addForm.value.category = user.category;
  } else {
    addForm.value.category = null;
  }
}

function openEditDialog(reg) {
  isEdit.value = true;
  editRegistrationId.value = reg.id;
  addForm.value = {
    user: reg.user,
    category: reg.category,
    status: reg.status,
    notitie: reg.notitie || '',
  };
  showAddDialog.value = true;
}

async function saveParticipant() {
  try {
    if (isEdit.value) {
      await pb.collection('registrations').update(editRegistrationId.value, {
        category: addForm.value.category,
        status: addForm.value.status,
        notitie: addForm.value.notitie,
      });
      $q.notify({ color: 'positive', message: 'Inschrijving bijgewerkt', icon: 'check' });
    } else {
      if (registrations.value.some((r) => r.user === addForm.value.user)) {
        $q.notify({
          color: 'warning',
          message: 'Deze speler is al ingeschreven voor dit event',
          icon: 'warning',
        });
        return;
      }
      await addRegistration(
        event.value.id,
        addForm.value.user,
        addForm.value.status,
        addForm.value.category,
        addForm.value.notitie,
      );
      $q.notify({ color: 'positive', message: 'Deelnemer toegevoegd', icon: 'check' });
    }
    await fetchRegistrationsByEvent(event.value.id);
    showAddDialog.value = false;
    isEdit.value = false;
    editRegistrationId.value = null;
    addForm.value = { user: null, category: null, status: null, notitie: '' };
  } catch (error) {
    $q.notify({ color: 'negative', message: 'Fout bij opslaan', icon: 'error' });
  }
}

function onDialogHide() {
  isEdit.value = false;
  editRegistrationId.value = null;
  addForm.value = { user: null, category: null, status: null, notitie: '' };
}

const removeParticipant = async (userId: string) => {
  try {
    const reg = registrations.value.find((r) => r.expand?.user?.id === userId);
    if (!reg) return;
    await removeRegistration(reg.id);
    await fetchRegistrationsByEvent(event.value.id);
    $q.notify({ color: 'positive', message: 'Deelnemer verwijderd', icon: 'check' });
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: 'Fout bij het verwijderen van de deelnemer',
      icon: 'error',
    });
  }
};

const isModerator = computed(() => {
  if (!event.value || !authStore.user) return false;
  return (
    event.value.owner === authStore.user.id ||
    (Array.isArray(event.value.moderators) && event.value.moderators.includes(authStore.user.id))
  );
});

onMounted(async () => {
  await loadEvent();
  await loadAvailablePlayers();
  await loadCategories();
  await fetchRegistrationsByEvent(route.params.id as string);
});
</script>
