module.exports = {
  plugins: [
    require('postcss-preset-env')({
      stage: 1,
      features: {
        'custom-properties': true,
        'nesting-rules': true,
        'custom-media-queries': true
      }
    })
  ]
}; 