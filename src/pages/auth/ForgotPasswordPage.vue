<template>
  <div class="auth-container">
    <q-card class="auth-card">
      <q-card-section>
        <div class="text-h5 text-center q-mb-md">Wachtwoord vergeten</div>
        <div class="text-subtitle2 text-center q-mb-lg">
          Vul je e-mailadres in om een wachtwoord reset link te ontvangen
        </div>

        <q-form @submit="onSubmit" class="q-gutter-md">
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

          <div>
            <q-btn
              type="submit"
              color="primary"
              class="full-width"
              :loading="loading"
              label="Reset link aanvragen"
            />
          </div>

          <div class="text-center q-mt-md">
            <span class="text-body2">Terug naar </span>
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

const email = ref('');
const loading = ref(false);

const onSubmit = async () => {
  try {
    loading.value = true;
    const success = await authStore.requestPasswordReset(email.value);

    if (success) {
      $q.notify({
        color: 'positive',
        message: 'Reset link is verzonden naar je e-mailadres',
        icon: 'check',
      });
      router.push('/auth/login');
    } else {
      throw new Error('Reset link aanvragen mislukt');
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: 'Reset link aanvragen mislukt. Probeer het opnieuw.',
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
