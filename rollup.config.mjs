import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';
import serve from 'rollup-plugin-serve';
import commonjs from '@rollup/plugin-commonjs';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import {resolve} from 'path';
import packageJson from './package.json' assert {type: 'json'};
import * as url from 'url';

/**
 * @typedef {import('rollup').RollupOptions} RollupOptions
 */

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const browserFetch = () =>
    alias({
        entries: [
            {
                find: 'cross-fetch',
                replacement: resolve(__dirname, './bundle/browser-fetch.ts'),
            },
        ],
    });

const tsPlugin = () =>
    typescript({
        useTsconfigDeclarationDir: true,
    });

const versionReplace = () =>
    replace({
        preventAssignment: true,
        'process.env.PKG_VERSION': JSON.stringify(packageJson.version),
    });

/**
 * @satisfies {RollupOptions}
 */
const coveouaConfig = {
    input: './src/coveoua/browser.ts',
    output: [
        {
            file: './dist/coveoua.js',
            format: 'umd',
            name: 'coveoua',
            sourcemap: true,
            plugins: [terser({format: {comments: false}})],
        },
        {
            file: './dist/coveoua.browser.js',
            format: 'iife',
            name: 'coveoua',
            sourcemap: true,
            plugins: [terser({format: {comments: false}})],
        },
        {
            file: './dist/coveoua.debug.js',
            format: 'umd',
            name: 'coveoua',
            sourcemap: true,
        },
    ],
    plugins: [
        browserFetch(),
        nodeResolve({preferBuiltins: true, browser: true}),
        versionReplace(),
        tsPlugin(),
        process.env.SERVE
            ? serve({
                  contentBase: ['dist', 'public'],
                  port: 9001,
                  open: true,
                  headers: {
                      'Access-Control-Allow-Origin': 'http://localhost:9001',
                  },
              })
            : null,
    ],
};

/**
 * @satisfies {RollupOptions}
 */
const nodeModulesConfig = {
    input: './src/coveoua/library.ts',
    output: /** @type {const} */ (['cjs', 'es']).map((format) => ({
        file: `./dist/library.${format === 'cjs' ? 'cjs' : 'mjs'}`,
        format,
    })),
    plugins: [
        nodeResolve({mainFields: ['main'], preferBuiltins: true}),
        versionReplace(),
        commonjs(),
        tsPlugin(),
        json(),
    ],
};

/**
 * @satisfies {RollupOptions}
 */
const browserModulesConfig = {
    input: './src/coveoua/headless.ts',
    output: {
        file: `./dist/browser.mjs`,
        format,
    },
    plugins: [
        browserFetch(),
        nodeResolve({preferBuiltins: true}),
        versionReplace(),
        typescript({
            useTsconfigDeclarationDir: true,
            tsconfigOverride: {compilerOptions: {target: 'es6'}},
        }),
    ],
};

/**
 * @satisfies {RollupOptions}
 */
const reactNativeConfig = {
    external: ['react-native', 'cross-fetch'],
    input: './src/react-native/index.ts',
    output: {
        file: './dist/react-native.es.js',
        format: 'es',
    },
    plugins: [
        nodeResolve({preferBuiltins: true}),
        versionReplace(),
        commonjs(),
        json(),
        typescript({
            useTsconfigDeclarationDir: true,
            tsconfigOverride: {compilerOptions: {target: 'es6'}},
        }),
    ],
};

export default [coveouaConfig, nodeModulesConfig, browserModulesConfig, reactNativeConfig];
