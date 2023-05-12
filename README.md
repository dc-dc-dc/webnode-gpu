# nodegpu, bringing the bindings of webgpu to node

Brings over the webgpu spec into node, initially done to test compute shader code.

## Installation

- cmake >= 3.19

## Usage

```js
import nodegpu from "webnode-gpu";
const gpu = nodegpu.create([]);
const adapter = await gpu.requestAdapter();
const adapterInfo = await adapter.requestAdapterInfo();
console.log(adapterInfo.description);
```