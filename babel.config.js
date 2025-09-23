module.exports = function (api) {
  api.cache(true);

  const plugins = [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './',
          'tailwind.config': './tailwind.config.js',
        },
      },
    ],
  ];

  // Windows 환경에서 worklets 문제가 있으므로 조건부로 추가
  try {
    require.resolve('react-native-reanimated/plugin');
    plugins.push('react-native-reanimated/plugin');
  } catch (e) {
    console.log('react-native-reanimated/plugin not found, skipping...');
  }

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
        },
      ],
      'nativewind/babel',
    ],
    plugins,
  };
};
