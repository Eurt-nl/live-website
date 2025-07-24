<template>
  <div class="q-pa-md">
    <h2>Capacitor Voorbeeld</h2>

    <div class="q-mb-md">
      <h3>Platform Info</h3>
      <p>Platform: {{ platform }}</p>
      <p>Is Native: {{ isNative }}</p>
      <p>Device Info: {{ deviceInfo }}</p>
    </div>

    <div class="q-mb-md">
      <h3>Toasts</h3>
      <q-btn color="primary" label="Toon Toast" @click="showToast" />
    </div>

    <div class="q-mb-md">
      <h3>Camera</h3>
      <q-btn color="primary" label="Check Camera Permissie" @click="checkCameraPermission" />
      <p v-if="cameraPermission">Camera Permissie: {{ cameraPermission }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Capacitor } from '@capacitor/core';
import { Device, type DeviceInfo } from '@capacitor/device';
import { Toast } from '@capacitor/toast';
import { Camera } from '@capacitor/camera';

const platform = ref<string>('');
const isNative = ref<boolean>(false);
const deviceInfo = ref<DeviceInfo | null>(null);
const cameraPermission = ref<string>('');

const loadDeviceInfo = async (): Promise<void> => {
  try {
    const info = await Device.getInfo();
    deviceInfo.value = info;
  } catch (error) {
    console.error('Fout bij het ophalen van device info:', error);
  }
};

const showToast = async (): Promise<void> => {
  try {
    await Toast.show({
      text: 'Dit is een test toast bericht!',
      duration: 'short',
      position: 'bottom',
    });
  } catch (error) {
    console.error('Fout bij het tonen van toast:', error);
  }
};

const checkCameraPermission = async (): Promise<void> => {
  try {
    const permission = await Camera.checkPermissions();
    cameraPermission.value = permission.camera;
  } catch (error) {
    console.error('Fout bij het controleren van camera permissie:', error);
  }
};

onMounted(() => {
  platform.value = Capacitor.getPlatform();
  isNative.value = Capacitor.isNativePlatform();
  void loadDeviceInfo();
});
</script>

<style scoped>
.q-pa-md {
  padding: 16px;
}
.q-mb-md {
  margin-bottom: 16px;
}
</style>
