// vite.config.ts
import { wgslObfuscate } from "vite-plugin-wgsl-obfuscate";
import {defineConfig} from "vite";

export default defineConfig({
    plugins: [
        wgslObfuscate(),
    ],
    base: process.env.NODE_ENV === 'production' ? '/webgpu-app/' : '/'
});