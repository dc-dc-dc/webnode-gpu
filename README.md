# nodegpu, bringing the bindings of webgpu to node

Brings over the webgpu spec into node, initially done to test compute shader code.

## Installation

Make sure you have the following dependencies as they are needed to build dawn from source. The build process takes a while, npm install looks like its hanging but thats cmake running.

- cmake >= 3.19
- [ninja](https://github.com/ninja-build/ninja/wiki/Pre-built-Ninja-packages)
- [depot_tools](https://commondatastorage.googleapis.com/chrome-infra-docs/flat/depot_tools/docs/html/depot_tools_tutorial.html#_setting_up)

## Usage

```js
import nodegpu from "webnode-gpu";
const gpu = nodegpu.create([]);
const adapter = await gpu.requestAdapter();
const adapterInfo = await adapter.requestAdapterInfo();
console.log(adapterInfo.description);
```

## Tested on

- MacOS ✅
- Windows ❌
- Linux ❌
