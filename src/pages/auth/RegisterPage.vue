<template>
  <div class="auth-container">
    <q-card class="auth-card">
      <q-card-section>
        <div class="text-h5 text-center q-mb-md">Account aanmaken</div>
        <div class="text-subtitle2 text-center q-mb-lg">Vul je gegevens in om te beginnen</div>

        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="name"
            label="Naam"
            :rules="[(val) => !!val || 'Naam is verplicht']"
            lazy-rules
          />

          <q-input
            v-model="email"
            type="email"
            label="E-mailadres"
            :rules="[
              (val) => !!val || 'E-mailadres is verplicht',
              (val) => /.+@.+\..+/.test(val) || 'Ongeldig e-mailadres',
            ]"
            lazy-rules
          />

          <q-input
            v-model="password"
            type="password"
            label="Wachtwoord"
            :rules="[
              (val) => !!val || 'Wachtwoord is verplicht',
              (val) => val.length >= 8 || 'Wachtwoord moet minimaal 8 tekens lang zijn',
            ]"
            lazy-rules
          />

          <q-input
            v-model="confirmPassword"
            type="password"
            label="Bevestig wachtwoord"
            :rules="[
              (val) => !!val || 'Bevestig je wachtwoord',
              (val) => val === password || 'Wachtwoorden komen niet overeen',
            ]"
            lazy-rules
          />

          <q-input
            v-model="birthyear"
            type="number"
            label="Geboortejaar"
            :rules="[
              (val) => !!val || 'Geboortejaar is verplicht',
              (val) => (val >= 1900 && val <= new Date().getFullYear()) || 'Ongeldig geboortejaar',
            ]"
            lazy-rules
          />

          <div>
            <q-btn
              type="submit"
              color="primary"
              class="full-width"
              :loading="loading"
              label="Registreren"
            />
          </div>

          <div class="text-center q-mt-md">
            <span class="text-body2">Al een account? </span>
            <q-btn flat color="primary" label="Log in" to="/auth/login" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const birthyear = ref<number | null>(null);
const loading = ref(false);

const onSubmit = async () => {
  try {
    loading.value = true;
    const data = {
      name: name.value,
      email: email.value,
      password: password.value,
      passwordConfirm: confirmPassword.value,
      birthyear: birthyear.value,
      emailVisibility: true,
    };

    const success = await authStore.register(data);

    if (success) {
      $q.notify({
        color: 'positive',
        message: 'Account succesvol aangemaakt! Je kunt nu inloggen.',
        icon: 'check',
      });
      router.push('/auth/login');
    } else {
      throw new Error('Registreren mislukt');
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: 'Registreren mislukt. Probeer het opnieuw.',
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-container {
  width: 100%;
  max-width: 400px;
  padding: 16px;
}

.auth-card {
  width: 100%;
}
</style>
