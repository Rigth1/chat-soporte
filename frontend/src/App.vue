<template>
  <div class="app-shell">
    <LoginPage v-if="!isAuthenticated" @login-success="onLoginSuccess" />
    <ChatPage v-else :user="currentUser" @logout="onLogout" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import LoginPage from './pages/LoginPage.vue';
import ChatPage from './pages/ChatPage.vue';

const currentUser = ref(JSON.parse(localStorage.getItem('chat-soportee-user') || 'null'));
const authToken = ref(localStorage.getItem('chat-soportee-token') || '');

const isAuthenticated = computed(() => Boolean(authToken.value && currentUser.value));

function onLoginSuccess(payload) {
  currentUser.value = payload.user;
  authToken.value = payload.token;
  localStorage.setItem('chat-soportee-user', JSON.stringify(payload.user));
  localStorage.setItem('chat-soportee-token', payload.token);
}

function onLogout() {
  currentUser.value = null;
  authToken.value = '';
  localStorage.removeItem('chat-soportee-user');
  localStorage.removeItem('chat-soportee-token');
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fb 0%, #eaf0ff 100%);
}
</style>
