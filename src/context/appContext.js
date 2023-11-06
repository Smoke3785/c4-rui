import { createContext, useState, useEffect } from "react";
import useSyncedState from "../hooks/usedSyncedState";
import useRateLimitedState from "../hooks/rateLimitedState";
import socketIOClient from "socket.io-client";

const AppContext = createContext();
const DEFAULT_PORT = 22520;
const ENDPOINT = `http://127.0.0.1:${DEFAULT_PORT}`;

function filterOutliers(someArray) {
  // Copy the values, rather than operating on references to existing values
  var values = someArray.concat();

  // Then sort
  values.sort(function (a, b) {
    return a - b;
  });

  /* Then find a generous IQR. This is generous because if (values.length / 4)
   * is not an int, then really you should average the two elements on either
   * side to find q1.
   */
  var q1 = values[Math.floor(values.length / 4)];
  // Likewise for q3.
  var q3 = values[Math.ceil(values.length * (3 / 4))];
  var iqr = q3 - q1;

  // Then find min and max values
  var maxValue = q3 + iqr * 1.5;
  var minValue = q1 - iqr * 1.5;

  // Then filter anything beyond or beneath these values.
  var filteredValues = values.filter(function (x) {
    return x <= maxValue && x >= minValue;
  });

  // Then return
  return filteredValues;
}

const AppProvider = ({ children }) => {
  // Standard state
  const [socket, setSocket] = useState(null);
  const [requests, setRequests] = useState(0);
  const [totalLatency, setTotalLatency] = useRateLimitedState([0], 100);

  // Server managed state
  //   Vehicle statistics
  const [fakeSpeed, updateFakeSpeed, sync_fakeSpeed] = useSyncedState(0);
  const [resistor33, updateResistor33, sync_resistor33] = useSyncedState(0);
  //   Position
  const [carPosition, updateCarPosition, sync_carPosition] = useSyncedState([
    0, 0,
  ]);

  //   Navigation
  const [navigationSession, updateNavigationSession, sync_navigationSession] =
    useSyncedState(null);
  const [previewRoute, updatePreviewRoute, sync_previewRoute] =
    useSyncedState(null);
  const [currentRoute, updateCurrentRoute, sync_currentRoute] =
    useSyncedState(null);

  const filteredLatencies = filterOutliers(totalLatency);

  //   Derived values
  const averageLatency = (
    Math.round(
      (filteredLatencies.reduce((p, a) => p + a, 0) /
        filteredLatencies.length) *
        100
    ) / 100
  ).toFixed(2);

  const lastLatency = new Number(
    filteredLatencies[filteredLatencies.length - 1]
  ).toFixed(2);

  const initializationStage = determineInitializationStage();

  // Object state store
  const stateStore = {
    // Fake speed
    fakeSpeed,
    updateFakeSpeed,
    sync_fakeSpeed,
    // Internal state
    initializationStage,
    averageLatency,
    lastLatency,
    socket,
    // Resistor 33
    resistor33,
    updateResistor33,
    sync_resistor33,
    // Car position
    carPosition,
    updateCarPosition,
    sync_carPosition,
    // Preview route
    previewRoute,
    updatePreviewRoute,
    sync_previewRoute,
    // Current route
    currentRoute,
    updateCurrentRoute,
    sync_currentRoute,
  };

  //   Functions
  function determineInitializationStage() {
    let stage = "complete";

    function f() {
      stage = "loading";
    }

    function s() {
      stage = "complete";
    }

    if (socket === null) f();

    return stage;
  }

  async function socketRequest(key, timeout = 3000, ...args) {
    if (!socket) {
      throw new Error(
        "Attempted to run socketRequest before socket is initialized"
      );
    }
    let finished = false;

    return new Promise(async (resolve, reject) => {
      function onTimeout() {
        reject("Timed out");
      }

      const timer = setTimeout(() => {
        if (finished) return;
        finished = true;
        onTimeout();
      }, timeout);

      socket.emit(key, ...args, (...responseArgs) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolve(...responseArgs);
      });
    });
  }

  const functions = {
    socketRequest,
  };

  // Use effects
  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);
    setSocket(socket);

    socket.on("stateUpdate", (key, value, timestamp) => {
      //   return; // Temp

      let uk = `sync_${key}`;
      let latency = new Date().getTime() - timestamp;

      let updateFunction = stateStore?.[uk] || null;
      if (updateFunction === null) {
        throw new Error(
          `Recieved state update for un-initialized state ${key}`
        );
      }
      updateFunction(value);
      setRequests((c) => c + 1);

      //   console.log({ latency });
      if (latency !== 0) {
        setTotalLatency((c) => {
          if (c.length >= 1000) {
            c.shift();
          }

          return [...c, latency];
        });
      }
    });

    return () => socket.disconnect();
  }, []);

  //   Render
  return (
    <AppContext.Provider value={{ ...stateStore, ...functions }}>
      {children}
    </AppContext.Provider>
  );
};

const withState = (Child) => (props) =>
  (
    <AppContext.Consumer>
      {(context) => <Child {...props} {...context} />}
    </AppContext.Consumer>
  );

export { AppProvider, withState };
