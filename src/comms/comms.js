import { signal, effect, computed } from "@preact/signals-react";
import socketIOClient from "socket.io-client";
import { filterOutliers, formatNumber } from "./functions";
import { vectorMath } from "../helpers/math";

// Constants
const DEFAULT_PORT = 22520;
const ENDPOINT = `http://localhost:${DEFAULT_PORT}`;

// Signals
const socket = signal(null);

// State signals
const fakeSpeed = signal(0);
const resistor33 = signal(0);
// Position
const fakeCarPosition = signal({ lat: 0, lng: 0 });
const carPosition = signal({ lat: 0, lng: 0 });
// Position - computed
const carLatLng = computed(() => {
  return carPosition.value;
});

// Navigation
const previewRoute = signal(null);
const currentRoute = signal(null);
const currentStep = signal(null);
const nextPoint = signal(null);
const calculating = signal(null);
// Navigation - computed
const currentStepObject = computed(() => {
  if (!currentRoute.value) return null;
  return currentRoute?.value?.steps?.[currentStep?.value] || null;
});
const nextPointCoordinates = computed(() => {
  console.log({
    currentRoute: currentRoute.value,
    currentStepObject: currentStepObject.value,
    nextPoint: nextPoint.value,
    nextPointCoordinates: currentStepObject?.value?.points?.[nextPoint?.value],
  });
  if (!currentRoute.value) return null;
  return currentStepObject?.value?.points?.[nextPoint?.value] || null;
});
const lastPointCoordinates = computed(() => {
  if (nextPoint.value === null) return null;
  if (nextPoint.value === 0) {
    return carLatLng?.value || null;
  }
  return currentStepObject?.value?.points?.[nextPoint?.value - 1] || null;
});
const distanceFromLastPoint = computed(() => {
  if (carLatLng.value === null) return null;
  if (lastPointCoordinates.value === null) return null;
  return formatNumber(
    vectorMath.haversineDistance(carLatLng.value, lastPointCoordinates.value)
  );
});
const distanceFromNextPoint = computed(() => {
  if (carLatLng.value === null) return null;
  if (nextPointCoordinates.value === null) return null;
  return formatNumber(
    vectorMath.haversineDistance(carLatLng.value, nextPointCoordinates.value)
  );
});
const distanceToNextStep = computed(() => {
  if (currentStepPointVectors.value === null) return null;
  if (distanceFromNextPoint.value === null) return null;
  if (nextPoint.value === null) return null;
  let remainingPointVectors = currentStepPointVectors.value.slice(
    nextPoint.value + 1,
    currentStepPointVectors.value.length
  );

  let distances = remainingPointVectors.map(([a, b]) =>
    vectorMath.haversineDistance(a, b)
  );

  distances.push(distanceFromNextPoint.value);

  return formatNumber(distances.reduce((s, a) => a + s, 0));
});

const distanceToDestination = computed(() => {
  if (distanceToNextStep.value === null) return null;
  if (currentRoute.value === null) return null;
  if (currentStep.value === null) return null;

  let remainingStepsDistance = currentRoute.value.steps
    .slice(currentStep.value + 1, currentRoute.value.steps.length - 1)
    .reduce((s, a) => a.distance.value + s, 0);

  return formatNumber(remainingStepsDistance + distanceToNextStep.value);
});

const currentStepPointVectors = computed(() => {
  if (currentStepObject.value == null) return null;
  let temp = currentStepObject.value.points;
  // temp.shift();

  // Group temp into pairs
  let pairs = [];
  for (let i = 0; i < temp.length; i++) {
    let c = temp[i];
    let n = temp[i + 1];
    if (!n) continue;
    pairs.push([c, n]);
  }

  return pairs;
});

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

  return parseFloat(roundedSum.toFixed(2));
});
const lastLatency = computed(() => {
  let mostRecentLatency =
    filteredLatencies.value[filteredLatencies.value.length - 1];

  return parseFloat(parseFloat(mostRecentLatency).toFixed(2));
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
  fakeCarPosition,
  carPosition,
  previewRoute,
  currentRoute,
  currentStep,
  nextPoint,
  calculating,
  // Other
  latencyRecord,
  lastLatency,
  averageLatency,
};

async function initializeComms() {
  let _socket = socketIOClient(ENDPOINT);
  socket.value = _socket;

  socket.value.on("stateUpdate", (key, value, timestamp) => {
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

// NOTE - NEED TO ORGANIZE THESE
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
  currentStepObject,
  nextPoint,
  calculating,
  lastPointCoordinates,
  nextPointCoordinates,
  currentStepPointVectors,
  distanceFromLastPoint,
  distanceFromNextPoint,
  distanceToNextStep,
  distanceToDestination,
  // Derived state
  carLatLng,
  // Other
  latencyRecord,
  lastLatency,
  averageLatency,
};
