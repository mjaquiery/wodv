import Vue
    from "vue";
import Vuex
    from "vuex";

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        sessions: [],
        players: [],
        metadata: [],
        items_loading: false
    },
    mutations: {
        setItemsLoading(state, value) {state.items_loading = value;},
        setItem(state, {name, value}) {state[name] = value;}
    },
    getters: {
    },
    actions: {
        async refresh(context) {
            if(context.state.items_loading)
                return;
            context.commit('setItemsLoading', true);
            try {
                const response = await fetch('/.netlify/functions/sheets');
                const json = await response.json();
                context.commit('setItem', {name: 'players', value: json[0]});
                context.commit('setItem', {name: 'sessions', value: json[1]});
                context.commit('setItem', {name: 'metadata', value: json[2]});
                console.log('Refreshed sheet info')
            } catch(e) {
                console.error(e);
            }
            context.commit('setItemsLoading', false);
        }
    }
});

export default store;