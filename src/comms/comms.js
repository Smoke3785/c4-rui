import { signal, effect, computed } from '@preact/signals-react';
import socketIOClient from 'socket.io-client';
import { filterOutliers } from './functions';

// Constants
const DEFAULT_PORT = 22520;
const ENDPOINT = `http://localhost:${DEFAULT_PORT}`;

// Signals
const socket = signal(null);

// State signals
const fakeSpeed = signal(0);
const resistor33 = signal(0);
// Position
const carPosition = signal(null);
const carLatLng = computed(() => {
  if (!carPosition.value)
    return {
      lat: 0,
      lng: 0,
    };
  let [lat, lng] = carPosition.value;
  return {
    lat,
    lng,
  };
});

// Navigation
const previewRoute = signal(null);
const currentRoute = signal(null);
const currentStep = signal(null);

// Networks stats
const requests = signal(0);
const latencyRecord = signal([0]);
const filteredLatencies = computed(() => {
  return filterOutliers(latencyRecord.value);
});
const averageLatency = computed(() => {
  let summedLatencies =
    filteredLatencies.value.reduce((p, a) => p + a, 0) /
    filteredLatencies.value.length;
  let roundedSum = (Math.round(summedLatencies) * 100) / 100;

  return roundedSum.toFixed(2);
});
const lastLatency = computed(() => {
  let mostRecentLatency =
    filteredLatencies.value[filteredLatencies.value.length - 1];

  return new Number(mostRecentLatency).toFixed(2);
});

// Update functions
function logLatency(latency) {
  if (latency === 0) return;

  let c = latencyRecord.value;
  if (c.length >= 1000) c.shift();

  latencyRecord.value = [...c, latency];
  return;
}

// Computed
// const

// Signal store
const signalStore = {
  // State
  fakeSpeed,
  resistor33,
  carPosition,
  previewRoute,
  currentRoute,
  currentStep,
  // Other
  latencyRecord,
  lastLatency,
  averageLatency,
};

async function initializeComms() {
  let _socket = socketIOClient(ENDPOINT);
  socket.value = _socket;

  socket.value.on('stateUpdate', (key, value, timestamp) => {
    let latency = new Date().getTime() - timestamp;

    let _signal = signalStore?.[key] || null;

    if (_signal === null) {
      throw new Error(`Recieved state update for un-initialized signal ${key}`);
    }

    signalStore[key].value = value;
    requests.value++;
    logLatency(latency);
  });
}

export default initializeComms;

export {
  // Socket
  socket,
  // State
  fakeSpeed,
  resistor33,
  carPosition,
  previewRoute,
  currentRoute,
  currentStep,
  // Derived state
  carLatLng,
  // Other
  latencyRecord,
  lastLatency,
  averageLatency,
};
