<template>
  <div class="login-page">
    <q-card class="login-card" flat bordered>
      <q-card-section class="text-center">
        <div class="brand">Chat Soporte</div>
        <div class="subtitle">Inicia sesión para continuar</div>
      </q-card-section>

      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="handleSubmit">
          <q-input
            v-model="form.email"
            label="Correo electrónico"
            type="email"
            outlined
            dense
            :rules="[val => !!val || 'El correo es obligatorio']"
          />

          <q-input
            v-model="form.password"
            label="Contraseña"
            type="password"
            outlined
            dense
            :rules="[val => !!val || 'La contraseña es obligatoria']"
          />

          <q-btn
            :loading="loading"
            color="primary"
            label="Ingresar"
            class="full-width"
            type="submit"
          />
        </q-form>
      </q-card-section>

      <q-card-section v-if="error" class="text-negative text-center">
        {{ error }}
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Notify } from 'quasar';

const emit = defineEmits(['login-success']);

const form = ref({
  email: 'customer@demo.com',
  password: 'customer123'
});

const loading = ref(false);
const error = ref('');

async function handleSubmit() {
  loading.value = true;
  error.value = '';

  try {
    const response = await fetch('http://localhost:4000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form.value)
    });

    const result = await response.json();

    if (!response.ok) {
      const detail = result.detail ? ` (${result.detail})` : '';
      throw new Error(`${result.message || 'No se pudo iniciar sesión'}${detail}`);
    }

    localStorage.setItem('chat-soportee-token', result.token);
    localStorage.setItem('chat-soportee-user', JSON.stringify(result.user));

    Notify.create({
      type: 'positive',
      message: 'Sesión iniciada correctamente',
      position: 'top-right'
    });

    emit('login-success', result);
  } catch (err) {
    error.value = err.message;
    Notify.create({
      type: 'negative',
      message: err.message,
      position: 'top-right'
    });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped src="../styles/LoginPage.css"></style>
