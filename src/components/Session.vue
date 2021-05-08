<template>
  <section v-if="date > yesterday">
    <b-collapse
            class="card"
            :open="false"
            animation="slide"
            aria-id="contentIdForA11y1"
            :class="!spaceLeft? 'has-background-primary-light' : 'has-background-warning-light'"
    >
      <template #trigger="props">
        <header class="card-header">
          <div class="text">
            <h1 class="card-header-title">
              {{ niceDate }}
            </h1>
            <div class="icons">
              <div class="info">
                <b-icon :icon="!spaceLeft? 'account-group' : 'account-group-outline'"/>
                {{ players.length }}/{{ session['Max players'] }}
              </div>
              <div class="info">
                <b-icon icon="map-marker"/>
                {{ session.Location }}
              </div>
              <div class="info">
                <b-icon icon="clock-outline"/>
                {{ niceTime }}
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
          <li v-for="player in players" :key="player" class="player">
            <b-button @click="evt => removePlayer(player)"
                      icon-left="close"
                      rounded
                      size="is-small"
                      class="remove"
            />
            {{ player }}
          </li>
        </ul>
      </div>
      <footer v-if="spaceLeft" class="card-footer">
        <b-field>
          <b-autocomplete icon-right="plus"
                          :data="nonPlayers_filtered"
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
      const match = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4}) ([0-9]{2}):([0-9]{2})/.exec(this.session.Date);
      if(!match)
        return new Date(0);
      return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]), parseInt(match[4]), parseInt(match[5]));
    },
    players() {
      return this.$store.state.players.filter(p => p.Session === this.session.id)
              .map(p => p.Player);
    },
    nonPlayers() {
      return this.$store.state.players.filter(p => p.Session !== this.session.id)
              .map(p => p.Player);
    },
    nonPlayers_filtered() {
      if(!this.newPlayerName.length)
        return this.nonPlayers;
      const np = this.newPlayerName.toLowerCase();
      const out = this.nonPlayers.filter(p => {
        let n = p.toLowerCase();
        console.log({n, np})
        for(let i = 0; i < np.length; i++) {
          const n_old = n;
          n = n.replace(np[i], '');
          if(n.length === n_old.length)
            return false;
        }
        return true;
      });
      out.sort((a, b) => {
        a = a.toLowerCase();
        b = b.toLowerCase();
        const ai = a.indexOf(np);
        const bi = b.indexOf(np);
        // Sort alphabetically if indexes match
        if(ai === bi)
          return a < b? -1 : a === b? 0 : 1;
        // Sort by first occurrence of (whole) target string
        if(ai !== -1 && bi !== -1)
          return ai < bi? -1 : 1;
        if(ai)
          return -1;
        if(bi)
          return 1;
      });
      return out;
    },
    spaceLeft() {return this.players.length < parseInt(this.session['Max players'])},
    niceDate() {
      const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
      return this.date.toLocaleDateString("en-UK", options);
    },
    niceTime() {
      const options = {hour: '2-digit', minute:'2-digit'};
      return this.date.toLocaleTimeString("en-UK", options);
    }
  },
  methods: {
    async addPlayer(sessionId = null, playerName = null) {
      if(playerName === null && (!this.newPlayerName || !this.nonPlayers.includes(this.newPlayerName))) {
        this.newPlayerName = "";
        return false;
      }
      console.log(`[${this.session.id}] ${this.session.Date} <- ${this.newPlayerName}`);

      try {
        this.$store.commit('setItemsLoading', true);
        const body = JSON.stringify({
          sessionId: sessionId === ""? sessionId : this.session.id,
          playerName: sessionId === ""? playerName : this.newPlayerName
        });
        console.log(body)
        const response = await fetch('/.netlify/functions/sheets', {
          method: 'POST', headers: {task: 'addPlayer'}, body
        });
        const json = await response.json();
        if(!json || json.error)
          throw new Error(json? json.error : 'No legible server response');
        this.$buefy.toast.open({
          type: 'is-success',
          message: sessionId === ''? 'Left session.' : 'Joined session.'
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
    },
    removePlayer(player) {
      this.addPlayer('', player);
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
  .text {width: 100%;}
  .icons {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-evenly;
    width: 100%;
  }
  .card-header {
    display: flex;
    width: 100%;
    align-content: center;
    flex-direction: row;
    justify-content: space-between;
  }

  .players {
    padding: .5em;
    .player {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      min-height: 2em;
      user-select: none;
      .remove {
        border: none;
      }
    }
  }

  footer .field {
    width: 100%;
  }
</style>
