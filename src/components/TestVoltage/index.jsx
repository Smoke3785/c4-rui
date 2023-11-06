import { withState } from "../../context/appContext";

import { resistor33 } from "../../comms/comms";

const TestVoltage = () => {
  let av = resistor33 / 204.6;

  return <p>A0 Voltage: {av.toFixed(2)}v</p>;
};

export default TestVoltage;
