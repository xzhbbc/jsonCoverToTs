import { defineConfig } from 'umi';

const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

const chainWebpack = (config, { webpack }) => {
  config.plugin('monaco-editor').use(MonacoWebpackPlugin, [
    {
      languages: ['typescript', 'json']
    }
  ])
};
export default defineConfig({
  locale: { antd: true },
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [
    { path: '/', component: '@/pages/index' },
  ],
  sass: {},
  fastRefresh: {},
  chainWebpack
});
