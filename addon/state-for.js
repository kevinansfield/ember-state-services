import Ember from 'ember';
import WeakMap from 'ember-weakmap/weak-map';

var {
  computed,
  assert
} = Ember;

/*
 * Each key in this POJO is a name of a state with the value
 * for that key being a WeakMap.
 */
var weakMaps = {};

/*
* Returns a computed property if called like: stateFor('state-name', 'property-name') or
* returns the WeakMap if called like stateFor('state-name'). The most common case will be 
* the former but the latter allows advanced options like:
*
* stateFor('state-name').delete(this.get('property-name'));
* stateFor('state-name').has(this.get('some-other-prop'));
* stateFor('state-name').set(this.get('property-name'), {}); // Overrides the state
* stateFor('state-name').get(this.get('property-name'));
*/
export default function stateFor(stateName, propertyName) {
  if (!propertyName) {
    return weakMaps[stateName];
  }

  assert('The second argument must be a string', typeof(propertyName) === 'string');

  return computed(propertyName, function() {
    let propertyValue = this.get(propertyName);

    if (!weakMaps[stateName]) {
      weakMaps[stateName] = new WeakMap();
    }

    let state = weakMaps[stateName];

    if (!state.has(propertyValue)) {
      let newState = createStateFor(this, stateName, this.container);
      state.set(propertyValue, newState);
    }

    return state.get(propertyValue);
  });
}

/*
 * Looks up the state factory on the container and sets initial state
 * on the instance if desired.
 */
function createStateFor(context, stateName, container) {
  let defaultState  = {};
  let containerName = `state:${stateName}`;
  let StateFactory  = container.lookupFactory(containerName);

  if (!StateFactory) {
    throw new TypeError(`Unknown StateFactory: ${containerName}`);
  }

  if (typeof(StateFactory.initialState) === 'function') {
    defaultState = StateFactory.initialState.call(context);
  }
  else if (StateFactory.initialState) {
    throw new TypeError('initialState property must be a function');
  }

  if (StateFactory.create) {
    return StateFactory.create(defaultState);
  }

  return Ember.Object.create(StateFactory);
}
