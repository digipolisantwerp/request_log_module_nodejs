const pick = (object, keys) => keys.reduce((obj, key) => {
  const newObj = { ...obj };
  if (object && key in object) {
    newObj[key] = object[key];
  }
  return newObj;
}, {});

module.exports = {
  pick,
};
