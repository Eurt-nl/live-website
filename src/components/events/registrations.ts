import { ref } from 'vue';
import { usePocketbase } from 'src/composables/usePocketbase';
import type { Registration } from 'src/components/models';

const pb = usePocketbase();

export function useRegistrations() {
  const registrations = ref<Registration[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchRegistrationsByEvent(eventId: string) {
    loading.value = true;
    error.value = null;
    try {
      const result = await pb.collection('registrations').getList(1, 100, {
        filter: `event = "${eventId}"`,
        expand: 'user,status,category',
      });
      registrations.value = result.items;
    } catch (err: any) {
      error.value = err.message || 'Fout bij laden inschrijvingen';
    } finally {
      loading.value = false;
    }
  }

  async function addRegistration(
    eventId: string,
    userId: string,
    status?: string,
    category?: string,
    notitie?: string,
  ) {
    loading.value = true;
    error.value = null;
    try {
      const data: any = { event: eventId, user: userId };
      if (status) data.status = status;
      if (category) data.category = category;
      if (notitie) data.notitie = notitie;
      const reg = await pb.collection('registrations').create(data);
      return reg;
    } catch (err: any) {
      error.value = err.message || 'Fout bij inschrijven';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function removeRegistration(registrationId: string) {
    loading.value = true;
    error.value = null;
    try {
      await pb.collection('registrations').delete(registrationId);
    } catch (err: any) {
      error.value = err.message || 'Fout bij uitschrijven';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    registrations,
    loading,
    error,
    fetchRegistrationsByEvent,
    addRegistration,
    removeRegistration,
  };
}
