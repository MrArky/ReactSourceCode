## Fiber & Faiber 架构
在源码中，对于 `Fiber` 对象的创建是在 [/react-18.2.0/packages/react-reconciler/src/ReactFiber.new.js](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-reconciler/src/ReactFiber.new.js) 中完成的。
### Fiber 是什么？
> 需要说明的是，它和 `Scheduler（调度器）`一起， `React 16` 才被引入。

`fiber` 这个单词直译过来就叫“纤维”，使用计算机术语可称之为“纤程”，也可将其理解为一种“协程”。在 `JS` 的协程实现便是 `Generator`。

浅显的理解，Fiber 是 `虚拟 DOM` 的全新实现。
### 为什么要引入 Fiber？
`JS` 是单线程的，有一个 `Event Loop` 的概念（即事件循环，在浏览器或者Node环境解决 `JS` 单线程运行时不会阻塞的机制，也是异步的原理。）,存在一个具有优先级的任务队列，但只能按顺序执行队列中的任务，不能同时并发执行。
那么有没有一种机制，能够在多任务中来回切换的机智，模拟类似单核 CUP 的逻辑多进程，使得 `JS` 拥有并发能力，高任务优先级别拥有插队能力？
> 可以通过 [阮一峰](https://www.weibo.com/ruanyf) 的文章 [《JavaScript 运行机制详解：再谈Event Loop》](http://www.ruanyifeng.com/blog/2014/10/event-loop.html) 对其做更深入的了解。

在使用 `Fiber` 重构 `Reconciler（协调器）` 之前，是以递归的方式创建和更新 `虚拟 DOM`，假如有如下 `JSX` 结构：
``` JSX
<div className='layout'>
  <div className='header'>初识React源码</div>
  <div className='content'>
    <div className='sider'</div>
    <div className='content'></div>
  </div>
<div>
```
创建 `虚拟 DOM` 的过程可以还原为以下代码：
``` TypeScript
React.createElement1('div', { className: 'layout' },
  React.createElement2({'div', { className: 'header' },'初识React源码'}),
  React.createElement3({'div', { className: 'content' },
    React.createElement4({'div', { className: 'sider' }}),
    React.createElement5({'div', { className: 'content' }}),
  }),
)
```
可以看到，`createElement1` 的执行结束，必须等 `createElement2` 和  `createElement3` 执行结束，而 `createElement3` 的执行结束又必须等 `createElement4` 和 `createElement5` 执行的结束。很显然在实际生产中，一个单页面应用的 `虚拟 DOM 树` 是相当庞大（宽且深）的。完成一次创建，是一个漫长且不可打断的过程，在这期间，由于 `JS` 任务执行和浏览器UI渲染的互斥，浏览器可能处于“假死”状态，严重影响了交互体验。

而在引入 `Fiber` 之前，每次更新都会创建一个新的 `虚拟 DOM 树`，并根据 `diff 算法` 找出与最后一次更新的 `虚拟 DOM 树` 不同的地方实现 `DOM` 的定向更新。这种 `同步代码` 一旦开始执行，就会占据 `JS` 线程直到其完成。
