module.exports = () => {
  const start = Date.now();
  return {
    getDuration: () => Date.now() - start,
  };
};
