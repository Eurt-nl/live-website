<template>
  <div class="auth-container">
    <q-card class="auth-card">
      <q-card-section>
        <div class="text-h5 text-center q-mb-md">Welkom bij Pitch & Putt</div>
        <div class="text-subtitle2 text-center q-mb-lg">Log in om verder te gaan</div>

        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="email"
            type="email"
            label="E-mailadres"
            id="email"
            name="email"
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
            id="password"
            name="password"
            :rules="[(val) => !!val || 'Wachtwoord is verplicht']"
            lazy-rules
          />

          <div class="row justify-between items-center">
            <q-checkbox
              v-model="rememberMe"
              label="Onthoud mij"
              id="rememberMe"
              name="rememberMe"
            />
            <q-btn flat color="primary" label="Wachtwoord vergeten?" to="/auth/forgot-password" />
          </div>

          <div>
            <q-btn
              type="submit"
              color="primary"
              class="full-width"
              :loading="loading"
              label="Inloggen"
            />
          </div>

          <div class="text-center q-mt-md">
            <div class="text-body2 text-grey-7">
              <span class="text-weight-bold">Nog geen account?</span> Registreren kan met de
              <a
                href="https://app.pitch-putt.live"
                target="_blank"
                class="text-primary text-weight-medium"
                >app van Pitch-Putt.live</a
              >
            </div>
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

const router = useRouter();
const authStore = useAuthStore();
const $q = useQuasar();

const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const loading = ref(false);

const onSubmit = async () => {
  try {
    loading.value = true;
    const success = await authStore.login(email.value, password.value);

    if (success) {
      $q.notify({
        color: 'positive',
        message: 'Succesvol ingelogd!',
        icon: 'check',
      });
      router.push('/');
    } else {
      throw new Error('Inloggen mislukt');
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: 'Inloggen mislukt. Controleer je gegevens.',
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
