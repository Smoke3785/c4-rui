// Styles
import styles from "./test-speedometer.module.scss";
import { withState } from "../../context/appContext";

// Signals
import { fakeSpeed } from "../../comms/comms";

const TestSpeedometer = () => {
  function rd(n) {
    return Math.round((n * 100) / 100).toFixed(2);
  }

  function generateDialLabels() {
    const dpmr = rangeDeg / rangeMph;

    const labels = [];

    let lc = rangeMph / labelInterval;

    for (let i = 0; i < lc + 1; i++) {
      let ln = labelInterval * i;
      let sln = i == 0 || !(i % 2);
      let r = ln * dpmr;
      let tr = r + dialZero - dialElementOrigin;

      let o = {
        sln,
        tr,
        ln,
        lc,
        r,
        i,
      };

      labels.push(o);
    }

    return labels;
  }

  const sensorPercentage = Math.round((fakeSpeed / 1023) * 100);
  const percentageInt = sensorPercentage / 100;

  const rangeMph = 160;
  const rangeDeg = 240;
  const dialZero = (360 - rangeDeg) / 2;
  const dialElementOrigin = 180;

  const mph = rd(rangeMph * percentageInt);
  const dialRotation = (
    rangeDeg * percentageInt +
    dialZero -
    dialElementOrigin
  ).toFixed(2);

  const labelInterval = 10;
  const labels = generateDialLabels();

  return (
    <div className={styles.mainContainer}>
      <div className={styles.labelNumbersCont}>
        {labels.map((label, idx) => {
          //   console.log(label.ln.toString());
          let sw = 17 * label.ln.toString.length;

          return (
            <div
              className={styles.label}
              key={idx}
              style={{
                "--lr": `${label.tr}deg`,
                "--ds": `${sw}px`,
                "--dsm": `${sw / 2}px`,
              }}
            >
              {label.sln && <p className={styles.ln}>{label.ln}</p>}
            </div>
          );
        })}
      </div>
      <div className={styles.labelsCont}>
        {labels.map((label, idx) => {
          //   console.log(label.ln.toString());
          let sw = 17 * label.ln.toString.length;

          return (
            <div
              className={styles.label}
              key={idx}
              style={{
                "--lr": `${label.tr}deg`,
                "--ds": `${sw}px`,
                "--dsm": `${sw / 2}px`,
              }}
            >
              <div className={styles.line}></div>
            </div>
          );
        })}
      </div>
      <div className={styles.statsCont}>
        {sensorPercentage}% <br />
        {mph}mph <br />
        {dialRotation}deg
      </div>
      <div className={styles.dialCont}>
        <div style={{ "--r": `${dialRotation}deg` }} className={styles.dial} />
      </div>
    </div>
  );
};

export default TestSpeedometer;
