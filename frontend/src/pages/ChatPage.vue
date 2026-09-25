<template>
  <div class="chat-page">
    <q-layout view="lHh Lpr lFf" class="chat-layout">
      <q-header elevated>
        <q-toolbar>
          <q-toolbar-title>Chat de soporte</q-toolbar-title>

          <q-badge color="secondary" class="q-mr-sm">
            {{ user.role }}
          </q-badge>

          <q-btn flat round icon="logout" @click="handleLogout" />
        </q-toolbar>
      </q-header>

      <q-page-container>
        <q-page class="chat-container">
          <div class="chat-panel">
            <div class="chat-header">
              <div>
                <strong>Soporte</strong>
              </div>
              <div class="chat-status">En línea</div>
            </div>

            <div class="messages" ref="messagesRef">
              <div
                v-for="message in messages"
                :key="message.id || message.message_uuid"
                :class="['message-row', message.sender_id === user.id ? 'sent' : 'received']"
              >
                <q-chat-message
                  :sent="message.sender_id === user.id"
                  :text="[message.content]"
                  :stamp="formatTime(message.created_at)"
                />
              </div>
            </div>

            <div class="composer">
              <q-input
                v-model="draft"
                outlined
                dense
                placeholder="Escribe un mensaje..."
                @keyup.enter="sendMessage"
              />

              <q-btn
                color="primary"
                icon="send"
                round
                @click="sendMessage"
              />
            </div>
          </div>
        </q-page>
      </q-page-container>
    </q-layout>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from 'vue';
import { io } from 'socket.io-client';
import { Notify } from 'quasar';

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['logout']);
const messages = ref([]);
const draft = ref('');
const messagesRef = ref(null);

const socketToken = localStorage.getItem('chat-soportee-token') || '';

const socket = io('http://localhost:4000', {
  auth: {
    token: socketToken
  }
});

onMounted(() => {
  socket.on('connect', () => {
    socket.emit('message:history', { withUserId: props.user.role === 'customer' ? 2 : 1 });
  });

  socket.on('message:history', (history) => {
    messages.value = history;
    scrollToBottom();
  });

  socket.on('message:new', (message) => {
    messages.value.push(message);
    scrollToBottom();
  });

  socket.on('message:error', ({ message }) => {
    Notify.create({ type: 'negative', message, position: 'top-right' });
  });

  socket.on('message:ack', ({ status, duplicate, message_uuid }) => {
    if (status === 'duplicate') {
      Notify.create({ type: 'info', message: `Mensaje duplicado: ${message_uuid}`, position: 'top-right' });
    }
  });
});

function handleLogout() {
  socket.disconnect();
  emit('logout');
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
}

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function sendMessage() {
  const trimmed = draft.value.trim();

  if (!trimmed) {
    return;
  }

  const targetUserId = props.user.role === 'customer' ? 2 : 1;
  const payload = {
    toUserId: targetUserId,
    content: trimmed,
    message_uuid: crypto.randomUUID()
  };

  socket.emit('message:send', payload);
  draft.value = '';
}
</script>

<style scoped src="../styles/ChatPage.css"></style>
