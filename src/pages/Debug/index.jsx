// Styles
import styles from "./debug.module.scss";

import {
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
} from "../../comms/comms";

const states = {
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

const Debug = () => {
  return (
    <div className={styles.mainContainer}>
      <h1>DEBUG</h1>
      <div className={styles.table}>
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(states).map(([key, value], idx) => {
              let f;

              try {
                f = JSON.stringify(value.value);
              } catch (e) {
                f = "Cannot convert";
              }

              return (
                <tr
                  onClick={() => {
                    console.log({ key: value });
                  }}
                  key={idx}
                >
                  <td className={styles.key}>{key}</td>
                  <td>{f.slice(0, 100)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Debug;
