import { socket } from "./comms";

// Helpers
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

function formatNumber(number) {
  return parseFloat((Math.round(parseFloat(number) * 100) / 100).toFixed(2));
}

// Actual comms
async function socketRequest(key, timeout = 3000, ...args) {
  const _socket = socket.value;

  if (!_socket) {
    throw new Error(
      "Attempted to run socketRequest before socket is initialized"
    );
  }
  let finished = false;

  return new Promise(async (resolve, reject) => {
    function onTimeout() {
      reject(`Timed out: ${key}`);
    }

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      onTimeout();
    }, timeout);

    _socket.emit(key, ...args, (...responseArgs) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve(...responseArgs);
    });
  });
}

export { filterOutliers, socketRequest, formatNumber };
