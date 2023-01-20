import typescript from 'rollup-plugin-typescript2';
import {terser} from 'rollup-plugin-terser';
import serve from 'rollup-plugin-serve';
import commonjs from '@rollup/plugin-commonjs';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import {resolve} from 'path';
import versionInjector from 'rollup-plugin-version-injector';

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

const browserUMD = {
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
        nodeResolve({preferBuiltins: true, only: ['uuid']}),
        versionInjector({logLevel: 'warn'}),
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

const nodeCJS = {
    input: './src/coveoua/library.ts',
    output: {
        file: './dist/library.js',
        format: 'cjs',
    },
    plugins: [
        nodeResolve({mainFields: ['main'], preferBuiltins: true, only: ['uuid']}),
        versionInjector({logLevel: 'warn'}),
        commonjs(),
        tsPlugin(),
        json(),
    ],
};

const browserESM = {
    input: './src/coveoua/headless.ts',
    output: {
        file: './dist/library.es.js',
        format: 'es',
    },
    plugins: [
        browserFetch(),
        nodeResolve({preferBuiltins: true, only: ['uuid']}),
        versionInjector({logLevel: 'warn'}),
        typescript({
            useTsconfigDeclarationDir: true,
            tsconfigOverride: {compilerOptions: {target: 'es6'}},
        }),
    ],
};

const libRN = {
    input: './src/react-native/index.ts',
    output: {
        file: './dist/react-native.es.js',
        format: 'es',
    },
    plugins: [
        nodeResolve({preferBuiltins: true, only: ['uuid']}),
        versionInjector({logLevel: 'warn'}),
        commonjs(),
        json(),
        typescript({
            useTsconfigDeclarationDir: true,
            tsconfigOverride: {compilerOptions: {target: 'es6'}},
        }),
    ],
};

export default [browserUMD, nodeCJS, browserESM, libRN];
