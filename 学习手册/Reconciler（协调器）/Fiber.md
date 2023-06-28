## Fiber & Faiber 架构
在源码中，对于 `Fiber` 对象的创建是在 [/react-18.2.0/packages/react-reconciler/src/ReactFiber.new.js](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-reconciler/src/ReactFiber.new.js) 中完成的。但是介于 `Fiber` 与 `Scheduler（调度器）` 的关系，以及讲解连贯性，我想放在这里更合适一点。
### Fiber是什么？
