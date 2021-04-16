<template>
  <section v-if="date >= yesterday">
    <b-collapse
            class="card"
            :open="false"
            animation="slide"
            aria-id="contentIdForA11y1"
            :class="spaceLeft? 'has-background-primary-light' : 'has-background-warning-light'"
    >
      <template #trigger="props">
        <header class="card-header">
          <div class="text">
            <h1 class="card-header-title">
              {{ niceDate }}
            </h1>
            <div class="icons">
              <div class="info">
                <b-icon :icon="spaceLeft? 'account-group' : 'account-group-outline'"/>
                {{ players.length }}/{{ session['Max players'] }}
              </div>
              <div class="info">
                <b-icon icon="map-marker"/>
                {{ session.Location }}
              </div>
            </div>
          </div>
          <a class="card-header-icon">
            <b-icon :icon="props.open ? 'menu-up' : 'menu-down'"/>
          </a>
        </header>
      </template>

      <div v-if="players.length"
           class="players has-background-white">
        <ul>
          <li v-for="player in players" :key="player">
            {{ player }}
          </li>
        </ul>
      </div>
      <footer v-if="spaceLeft" class="card-footer">
        <b-field>
          <b-autocomplete icon-right="plus"
                          :data="nonPlayers"
                          v-model="newPlayerName"
                          placeholder="Type your name"
                          expanded
          />
          <p class="control">
            <b-button class="button" @click="addPlayer">Join!</b-button>
          </p>
        </b-field>
      </footer>
    </b-collapse>

  </section>
</template>

<script>
export default {
  name: 'Session',
  props: {
    session: {type: Object, required: true}
  },
  data: function() {
    return {
      newPlayerName: ""
    }
  },
  computed: {
    yesterday() {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      return yesterday;
    },
    date() {
      const match = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(this.session.Date);
      if(!match)
        return new Date(0);
      return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
    },
    players() {
      return this.$store.state.players.filter(p => p.Session === this.session.id)
              .map(p => p.Player);
    },
    nonPlayers() {
      return this.$store.state.players.filter(p => p.Session !== this.session.id)
              .map(p => p.Player);
    },
    spaceLeft() {return this.players.length < parseInt(this.session['Max players'])},
    niceDate() {
      const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
      return this.date.toLocaleDateString("en-UK", options);
    }
  },
  methods: {
    async addPlayer() {
      if(!this.newPlayerName || !this.nonPlayers.includes(this.newPlayerName)) {
        this.newPlayerName = "";
        return false;
      }
      console.log(`[${this.session.id}] ${this.session.Date} <- ${this.newPlayerName}`);

      try {
        this.$store.commit('setItemsLoading', true);
        const response = await fetch('/.netlify/functions/sheets', {
          method: 'POST',
          headers: {task: 'addPlayer'},
          body: JSON.stringify({
            sessionId: this.session.id,
            playerName: this.newPlayerName
          })
        });
        const json = await response.json();
        if(!json || json.error)
          throw new Error(json? json.error : 'No legible server response');
        this.$buefy.toast.open({
          type: 'is-success',
          message: 'Joined session.'
        });
      } catch(e) {
        this.$buefy.toast.open({
          type: 'is-warning',
          message: 'An error occurred while joining.'
        });
        console.error(e);
      }
      this.$store.commit('setItemsLoading', false);
      this.newPlayerName = "";
      this.$store.dispatch('refresh');
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  section {
    max-width: 300px;
    width: 100%;
    margin-bottom: 1.5em;
  }
  .icons {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-evenly;
  }

  .players {
    padding: .5em;
  }

  footer .field {
    width: 100%;
  }
</style>
