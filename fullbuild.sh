make build
cd packages/webassemblyjs/
npm install .

#npm install --save-dev @babel/core @babel/cli @babel/preset-env
#npm install @babel/preset-env @babel/preset-flow @babel/plugin-proposal-export-default-from @babel/plugin-proposal-object-rest-spread babel-plugin-mamacro

./node_modules/.bin/babel src --out-dir lib

cd lib

browserify --standalone webassemblyjs . > ../../../site/bundle.js
