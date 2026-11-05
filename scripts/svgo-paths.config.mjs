// Only rewrite individual path geometry. No element removal, merging,
// transform rewriting, gradient cleanup, ID changes, or viewBox changes.
export default {
  multipass: false,
  plugins: [
    { name: "convertPathData", params: { floatPrecision: 4 } },
  ],
};
