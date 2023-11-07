// Given two vectors, calculate the distance between them
function distance(a, b) {
  console.log({ a, b });
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}
// Get the midpoint between two vectors
function midpoint(a, b) {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
// Get the angle between two vectors
function angle(a, b) {
  return Math.atan2(b[1] - a[1], b[0] - a[0]);
}

// Get the vector between two vectors
function vector(a, b) {
  return [b[0] - a[0], b[1] - a[1]];
}

// Get the magnitude of a vector
function magnitude(a) {
  return Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2));
}

// Get the unit vector of a vector
function unit(a) {
  return [a[0] / magnitude(a), a[1] / magnitude(a)];
}

// Get the dot product of two vectors
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

// Get the cross product of two vectors
function cross(a, b) {
  return a[0] * b[1] - a[1] * b[0];
}

// Get the projection of a onto b
function projection(a, b) {
  return dot(a, b) / magnitude(b);
}

const vectorMath = {
  distance,
  midpoint,
  angle,
  vector,
  magnitude,
  unit,
  dot,
  cross,
  projection,
};

export { vectorMath };
