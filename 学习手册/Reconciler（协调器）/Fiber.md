## Fiber & Faiber 架构
在源码中，对于 `Fiber` 对象的创建是在 [/react-18.2.0/packages/react-reconciler/src/ReactFiber.new.js](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-reconciler/src/ReactFiber.new.js) 中完成的。
### Fiber是什么？
浅显的理解，Fiber 是 `虚拟 DOM` 的全新实现。
### 为什么要引入Fiber？
在使用 `Fiber` 重构 `Reconciler（协调器）` 之前，是以递归的方式创建 `虚拟 DOM`，类似于以下的方法调用：
```
```
