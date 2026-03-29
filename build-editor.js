const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
    entryPoints: [path.join(__dirname, 'src/editor/main.js')],
    bundle: true,
    outfile: path.join(__dirname, 'public/vendor/editor.js'),
    format: 'iife',
    globalName: 'EditorBundle',
    minify: false,
    sourcemap: false,
    define: {
        'process.env.NODE_ENV': '"production"'
    }
}).then(() => {
    console.log('Editor bundle built successfully!');
}).catch((error) => {
    console.error('Build failed:', error);
    process.exit(1);
});
