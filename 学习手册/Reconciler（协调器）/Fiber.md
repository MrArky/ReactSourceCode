## Fiber & Faiber 架构
在源码中，对于 `Fiber` 对象的创建是在 [/react-18.2.0/packages/react-reconciler/src/ReactFiber.new.js](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-reconciler/src/ReactFiber.new.js) 中完成的。
### Fiber 是什么？
`fiber` 这个单词直译过来就叫“纤维”，使用计算机术语可称之为“纤程”，也可将其理解为“协程”。在 `JS` 的协程实现便是 `Generator`。

~~浅显的理解，Fiber 是 `虚拟 DOM` 的全新实现。~~
### 为什么要引入 Fiber？
`JS` 是单线程的，有一个 `Event Loop` 的概念（即事件循环，在浏览器或者Node环境解决 `JS` 单线程运行时不会阻塞的机制，也就是异步的原理。）,存在一个具有优先级的任务队列，只能按顺序执行队列中的任务，不能同时并发执行。
那么有没有一种机制，能够在多任务中来回切换的机智，模拟类似单核 CUP 的逻辑多进程，使得 `JS` 拥有并发能力，高任务优先级别拥有插队能力？

首先来回顾一下，在使用 `Fiber` 重构 `Reconciler（协调器）` 之前，是以递归的方式创建和更新 `虚拟 DOM`，假如有如下 `JSX` 结构：
``` JSX
<Layout>
  <Header>初识React源码</Header>
  <Content>
    <Sider></Sider>
    <Content></Content>
  </Content>
<Layout>
```
