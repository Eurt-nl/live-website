<template>
  <div class="q-pa-md q-gutter-md column items-center">
    <div class="text-h5">Koppel jezelf als marker</div>
    <div class="q-mb-md text-body2 text-grey-8" style="max-width: 400px">
      Scan de QR-code van de speler of voer de code hieronder handmatig in om jezelf als marker te
      koppelen aan deze ronde. Je kunt daarna de score invoeren.
    </div>
    <q-btn
      color="primary"
      icon="qr_code_scanner"
      label="Scan QR-code"
      class="q-mb-md"
      @click="showScanner = true"
      :disable="loading"
    />
    <q-dialog v-model="showScanner">
      <q-card>
        <q-card-section>
          <div class="text-h6">Scan een QR-code</div>
        </q-card-section>
        <q-card-section>
          <QrcodeStream
            @decode="onDecode"
            @detect="onDetect"
            :paused="false"
            style="width: 100%; max-width: 320px; border-radius: 8px; background: #000"
          />
          <div v-if="scanWarning" class="text-warning q-mt-md">
            Er wordt geen geldige QR-code herkend. Probeer de QR-code groter, helderder of
            dichterbij te houden.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Annuleren" color="primary" @click="showScanner = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-input
      v-model="qrToken"
      label="QR-code of token invoeren"
      outlined
      dense
      style="max-width: 320px"
      @keyup.enter="findRound"
      :disable="loading"
      type="text"
      inputmode="text"
    />
    <q-btn
      color="primary"
      label="Zoek ronde"
      @click="findRound"
      :loading="loading"
      :disable="!qrToken"
    />

    <div v-if="error" class="text-negative q-mt-md">{{ error }}</div>

    <q-card v-if="round" class="q-mt-lg" style="max-width: 400px">
      <q-card-section>
        <div class="text-h6">Ronde gevonden</div>
        <div class="q-mb-xs">
          Speler: <b>{{ round.expand?.player?.name || round.player }}</b>
        </div>
        <div class="q-mb-xs" v-if="round.expand?.event_round?.expand?.event?.name">
          Toernooi: <b>{{ round.expand.event_round.expand.event.name }}</b>
        </div>
        <div class="q-mb-xs" v-if="round.expand?.event_round?.round_number">
          Ronde: <b>{{ round.expand.event_round.round_number }}</b>
        </div>
        <div class="q-mb-xs">
          Datum: <b>{{ formatDate(round.date) }}</b>
        </div>
        <div v-if="round.marker" class="text-warning q-mt-sm">
          Let op: er is al een marker gekoppeld aan deze ronde.
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Annuleren" color="primary" @click="reset" />
        <q-btn
          color="primary"
          label="Koppel mij als marker"
          :disable="!!round.marker || loading"
          @click="confirmMarker"
        />
      </q-card-actions>
    </q-card>
    <q-dialog v-model="successDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Succes!</div>
          <div>Je bent nu gekoppeld als marker aan deze ronde. Je kunt nu de score invoeren.</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Sluiten" color="primary" @click="goToScores" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useAuthStore } from 'stores/auth';
import { QrcodeStream } from 'vue-qrcode-reader';

const pb = usePocketbase();
const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const qrToken = ref('');
const round = ref<any>(null);
const loading = ref(false);
const error = ref('');
const successDialog = ref(false);
const showScanner = ref(false);
const scanTimeout = ref<NodeJS.Timeout | null>(null);
const scanWarning = ref(false);

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const parseToken = (input: string): string => {
  // Accepteer tokens van minimaal 4 letters (hoofd- of kleine letters, geen onderscheid)
  try {
    // Probeer te matchen op ?token=...
    const urlMatch = input.match(/[?&]token=([a-zA-Z]{4,})/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1].toUpperCase(); // Zet altijd om naar hoofdletters
    }
    // Probeer te matchen op alleen token (exact 4 of meer letters)
    const tokenMatch = input.match(/^[a-zA-Z]{4,}$/);
    if (tokenMatch) {
      return input.toUpperCase(); // Zet altijd om naar hoofdletters
    }
    // Probeer te matchen op volledige URL
    const fullUrlMatch = input.match(/marker-scan\?token=([a-zA-Z]{4,})/i);
    if (fullUrlMatch && fullUrlMatch[1]) {
      return fullUrlMatch[1].toUpperCase(); // Zet altijd om naar hoofdletters
    }
  } catch (e) {
    // fallback
  }
  return '';
};

const onDecode = (result) => {
  let raw = '';
  if (Array.isArray(result) && result[0] && result[0].rawValue) {
    raw = result[0].rawValue;
  } else if (typeof result === 'string') {
    raw = result;
  }
  const token = parseToken(raw);
  if (token) {
    showScanner.value = false;
    qrToken.value = token;
    findRound();
    scanWarning.value = false;
    if (scanTimeout.value) clearTimeout(scanTimeout.value);
  } else {
    scanWarning.value = true;
    error.value = 'Ongeldige QR-code. Probeer het opnieuw of voer de code handmatig in.';
  }
};

const onDetect = (detected) => {
  scanWarning.value = false;
  if (scanTimeout.value) clearTimeout(scanTimeout.value);
  scanTimeout.value = setTimeout(() => {
    scanWarning.value = true;
  }, 5000);

  // Fallback: als decode niet wordt getriggerd, probeer handmatig te decoderen
  if (!qrToken.value && Array.isArray(detected) && detected[0]?.rawValue) {
    const token = parseToken(detected[0].rawValue);
    if (token) {
      showScanner.value = false;
      qrToken.value = token;
      findRound();
      scanWarning.value = false;
      if (scanTimeout.value) clearTimeout(scanTimeout.value);
    }
  }
};

const findRound = async () => {
  error.value = '';
  round.value = null;
  if (!qrToken.value) return;
  loading.value = true;
  try {
    const token = parseToken(qrToken.value);
    if (!token) {
      error.value = 'Ongeldige QR-code of token.';
      loading.value = false;
      return;
    }
    // Zoek de ronde op basis van qr_token
    const result = await pb.collection('rounds').getFirstListItem(`qr_token = "${token}"`, {
      expand: 'player,event_round,event_round.event',
    });
    round.value = result;
    if (result.marker) {
      error.value = 'Er is al een marker gekoppeld aan deze ronde.';
    }
  } catch (err) {
    error.value = 'Geen ronde gevonden met deze QR-code/token.';
  } finally {
    loading.value = false;
  }
};

const confirmMarker = async () => {
  if (!round.value) return;
  loading.value = true;
  try {
    await pb.collection('rounds').update(round.value.id, {
      marker: authStore.user?.id,
      qr_token: null,
    });
    successDialog.value = true;
  } catch (err: any) {
    error.value = 'Fout bij koppelen als marker.';
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  round.value = null;
  qrToken.value = '';
  error.value = '';
};

const goToScores = () => {
  if (round.value) {
    router.push(`/rondes/${round.value.id}/scores`);
  } else {
    router.push('/mijn-rondes');
  }
};

onMounted(() => {
  const token = route.query.token;
  if (typeof token === 'string' && token.length > 0) {
    qrToken.value = token;
    findRound();
  }
});
</script>

<style scoped>
.qr-box {
  border: 1px dashed #aaa;
  padding: 16px;
  margin-bottom: 16px;
  background: #fafafa;
}
</style>
