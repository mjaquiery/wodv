<template>
  <div id="app">
    <div v-if="!$store.state.sessions.length" class="retry">
      <b-button label="Load resource list"/>
    </div>
    <div v-else class="sessions">
      <Session
              v-for="session in $store.state.sessions"
              :key="session.id"
              :session="session"
      />
    </div>
    <b-loading :active="$store.state.items_loading"/>
  </div>
</template>

<script>
import store from './store.js'
import Session from "./components/Session";

export default {
  name: 'App',
  components: {Session},
  computed: {},
  methods: {},
  mounted: function() {
    this.$store.dispatch('refresh');
  },
  store: store
}
</script>

<style lang="scss">
#app {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  margin: 1em auto;
}
.retry {
  width: 100%;
  padding: 0 1em;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.sessions {
  margin: 0 .5em;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
}
</style>
