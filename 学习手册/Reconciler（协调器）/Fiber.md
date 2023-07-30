## Fiber & Faiber 架构
在源码中，对于 `Fiber` 对象的创建是在 [/react-18.2.0/packages/react-reconciler/src/ReactFiber.new.js](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-reconciler/src/ReactFiber.new.js) 中完成的。
### Fiber 是什么？
> 需要说明的是，它和 `Scheduler（调度器）`一起， `React 16` 才被引入。

`fiber` 这个单词直译过来就叫“纤维”，使用计算机术语可称之为“纤程”，也可将其理解为一种“协程”。在 `JS` 的协程实现便是 `Generator`。

浅显的理解，Fiber 是 `虚拟 DOM` 的全新实现。
### 为什么要引入 Fiber？
`JS` 是单线程的，有一个 `Event Loop` 的概念（即事件循环，在浏览器或者Node环境解决 `JS` 单线程运行时不会阻塞的机制，也是异步的原理。）,存在一个具有优先级的任务队列，但只能按顺序执行队列中的任务，不能同时并发执行。
那么有没有一种机制，能够在多任务中来回切换的机智，模拟类似单核 CUP 的逻辑多进程，使得 `JS` 拥有并发能力，高任务优先级别拥有插队能力？
> 可以通过 [阮一峰](https://www.weibo.com/ruanyf) 的文章 [《 JavaScript 运行机制详解：再谈Event Loop 》](http://www.ruanyifeng.com/blog/2014/10/event-loop.html) 对其做更深入的了解。

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
可以看到，`createElement1` 的执行结束，必须等 `createElement2` 和  `createElement3` 执行结束，而 `createElement3` 的执行结束又必须等 `createElement4` 和 `createElement5` 执行的结束。很显然在实际生产中，一个单页面应用的 `虚拟 DOM 树` 是相当庞大（宽且深）的。完成一次创建，是一个漫长且不可打断的过程。在这期间，由于 `JS` 任务执行和浏览器UI渲染的互斥，浏览器可能处于“假死”状态，严重影响了交互体验。

而在引入 `Fiber` 之前，每次更新都会创建一个新的 `虚拟 DOM 树`，并根据 `diff 算法` 找出与最后一次更新的 `虚拟 DOM 树` 不同的地方实现 `DOM` 的定向更新。这种 `同步代码` 一旦开始执行，就会占据 `JS` 线程直到其完成。

回到之前的问题（可以肯定的回答—— **有** ）：
- 如果希望更新 `DOM` 过程可以根据需要停止 `JS` 执行，那么这个执行过程一定是能切割的（将一个大的任务分割成若干个小任务，每个小任务执行完成后，需要看有没有紧急的其他任务需要执行，有的话就暂时退出 `JS` 堆栈），所以也就可中断；
- 中断后的执行能够在允许的情况下（没有更高优先级的任务需要执行时且当前帧中有剩余的时间）恢复执行，那么上次执行打断时的 **状态** 是需要被保留的；
- 如果这个更新已经过时，可以放弃继续执行即中止。

这，都得益于`Fiber` 的引入。
### Generator（生成器）
在以上的预期里，`Generator` 看似可以满足这些问题的解决（实际上确实也能达到目的）。
- 可以中断执行，且中断执行后会暂时退出 `JS` 堆栈；
- 可以通过 `next` 函数重新回到 `JS` 堆栈继续执行；
- 会保留 **上下文** 信息，同时还能根据 `next` 函数参数控制接下来的执行行为；
- 如果不再调用它的 `next` 函数，它将永远不会回到`JS` 堆栈。
> 可以通过 [阮一峰](https://www.weibo.com/ruanyf) 的著作 [《 ECMAScript 6 入门 》中 Generator 函数的语法 ](https://es6.ruanyifeng.com/#docs/generator) 进行学习。

在源码中，`React` 并没有使用 `Generator`，主要有以下几点原因：

#### 弃用原因一
`Generator` 是 [有颜色的函数](https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/)：使用 `yield*` 调用 `Generator` 函数时，要求 `yield*` 所在的函数必须是 `Generator` 函数，这具有传染性，一旦采用了此方案，开发者不得不掌握 `Generator` 函数，并在自己的代码逻辑中使用它。不使用它，也是 `React` 团队践行 [代数效应](https://github.com/MrArky/ReactSourceCode/blob/main/%E5%AD%A6%E4%B9%A0%E6%89%8B%E5%86%8C/Reconciler%EF%BC%88%E5%8D%8F%E8%B0%83%E5%99%A8%EF%BC%89/Fiber.md#%E6%89%A9%E5%B1%95-%E4%BB%A3%E6%95%B0%E6%95%88%E5%BA%94%E4%BB%A5%E5%8F%8A%E5%AE%83%E4%B8%8E-react-%E7%9A%84%E8%81%94%E7%B3%BB) 的体现。

下面来看一个 `Generator` 处理递归的 🌰 ：
``` TypeScript
var arr = [1, [[2, 3], 4], [5, 6]];

var flat = function* (a: number | number[]) {
  var length = a.length;
  for (var i = 0; i < length; i++) {
    var item = a[i];
    if (typeof item !== 'number') {
      yield* flat(item);
    } else {
      yield item;
    }
  }
};

for (var f of flat(arr)) {
  console.log(f);
}
// 1, 2, 3, 4, 5, 6
```
而下面的的这个 🌰 ,会报错：
``` TypeScript
var arr = [1, [[2, 3], 4], [5, 6]];

var flat = function* (a: number | number[]) {
  a.forEach(function (item) {
    if (typeof item !== 'number') {
      yield* flat(item);
    } else {
      yield item;
    }
  });
};

for (var f of flat(arr)){
  console.log(f);
}
```
因为 `forEach` 不是一个 `Generator` 函数，因此，它的内部不能使用 `yield` 或者 `yield*` ;

#### 弃用原因二
`Generator` 仅储存自身的 **上下文状态**，不同的 `Generator` 之间，状态是私有的、不可访问的。

下面来看一个 `Generator` 执行的 🌰 ：
```  TypeScript
/**
 * 没有优先级的任务
 */
function* task(){
  let a = yield* subTask1();
  let b = yield* subTask2(a);
  let c = yield* subTask3(b);
}
/**
 * 紧急的，需要立即执行的任务
 */
function* ImmediatePriorityTask(){
  let b = yield* subTask2(a);
  let c = yield* subTask3(b);
}
const t = task();
t.next();
t.next();
const ipt = ImmediatePriorityTask();
ipt.next(); // 报错
```
如果继续执行 `t.next()` 将会进入 `subTask3(b)` 的执行。就在这时，一个具有更高优先级的 `subTask2` 需要执行，所以创建了一个 `ipt`任务。由于 `ImmediatePriorityTask` 中 `subTask2` 依赖 `a`,但是这时的 `a` 只存在于 `t` 任务的上下文中，无法直接访问，所以报错。

### 扩展 代数效应以及它与 React 的联系
React核心团队成员Sebastian Markbåge（React Hooks的发明者）曾说：我们在React中做的就是践行代数效应（Algebraic Effects）。
> 这有一篇博文，阅读并快速了解它 [通俗易懂的代数效应](https://overreacted.io/zh-hans/algebraic-effects-for-the-rest-of-us/) ;
### Fiber 在 React 源码中的定义
在 [源码](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-reconciler/src/ReactFiber.new.js#L118) 中定义了 `Fiber` 对象的构造函数，代码如下：
``` TypeScript
function FiberNode(
  tag: WorkTag,
  pendingProps: mixed,
  key: null | string,
  mode: TypeOfMode,
) {
  // Instance
  this.tag = tag;
  this.key = key;
  this.elementType = null;
  this.type = null;
  this.stateNode = null;

  // Fiber
  this.return = null;
  this.child = null;
  this.sibling = null;
  this.index = 0;

  this.ref = null;

  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;
  this.dependencies = null;

  this.mode = mode;

  // Effects
  this.flags = NoFlags;
  this.subtreeFlags = NoFlags;
  this.deletions = null;

  this.lanes = NoLanes;
  this.childLanes = NoLanes;

  this.alternate = null;
  ···
}
```
为了更清楚的了解它，下面对各属性逐一分析：
#### 第一部分（Instance）
- **tag**：工作标签，一共有 26 种 [标签类型](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-reconciler/src/ReactWorkTags.js#L10) ，函数组件标签类型、类组件标签类型、不确定的组件标签类型、宿主环境标签类型（所谓原生，如果是 `web` 环境，指的就是:`a`、`p`、`div` ···）···
  
  在 `Fiber` 架构中，通过这里可以知道：**渲染后，组件和 `Fiber` 对象是一一对应的。**
- **key**：组件定义时，如果指定了 `key` 属性，那么属性值会赋值给它，它将在 `diff` 算法中扮演至关重要的作用。
- **type**：写在 `elementType` 之前描述，主要是大部分时候，`elementType` 的值和 `type` 是一致的，按照 `tag` 的类型来讲：
  - 对于 `FunctionComponent`，`type` 值为函数本身；
  - 对于 `ClassComponent`，`type` 值为类本身；
  - 对于 `HostComponent`，`type` 值为它的标签名（`<div />` --> `'div'`）；

    ···
- **elementType**：React 元素类型，在 `MemoComponent` 、`LazyComponent` 等一些特殊 `tag` 类型，会跟 `type` 有所不同。
- **stateNode**：如果是 `web` 环境，对应该 `Fiber` 节点管理的真实 `DOM`（**通过对真实 `Fiber` 的跟踪，发现这只对原生组件对应的  `Fiber` 对象中的 `stateNode` 描述正确**）。
  - 函数组件的 `stateNode` 为 `null`;
  - 类组件的 `stateNode` 存储了 `context`、`props`、`refs`、`state`、`updater` 等信息。
#### 第二部分（Fiber）
- **return、child、sibling、index**：组件渲染后，由于原有（老版本）的 `虚拟 DOM 树` 被 `Fiber 树` 所替代，这四个属性用于 `Fiber 树` 中各 `Fiber` 节点之间建立关系。 `return` 指向自己的节点, `child` 指向自己的**第一个**子节点，`sibling` 指向自己的兄弟节点，`index` 则为自己在父节点所有子节点中的索引。关系图见 [Fiber 树](https://github.com/MrArky/ReactSourceCode/blob/main/%E5%AD%A6%E4%B9%A0%E6%89%8B%E5%86%8C/Reconciler%EF%BC%88%E5%8D%8F%E8%B0%83%E5%99%A8%EF%BC%89/Fiber.md#fiber-%E6%A0%91);
- **ref**：挂载真实的 `DOM` 对象。如何挂载？见以下代码：
  ``` TypeScript
  const App = () => {
      const ref = useRef<HTMLDivElement>(null)
      return <div ref={ref}>初识React源码</div>
  }
  ```
  浏览器 `DOM` 完成渲染后，`ref` 的值为 `{ current : div(真实dom对象) }`
- **pendingProps**：待处理的 `props`，具有副作用，将会引起组件更新（在函数组件中，通常参数被更新时产生新的 `pendingProps`）。值得注意的是，包括下面 **memoizedProps、updateQueue、memoizedState、dependencies** 几个属性，都是为实现 `函数组件` 状态管理而准备的。
- **memoizedProps**：每次渲染完成后，组件会将当前的 `props` 存起来，即 `memoizedProps`。通俗地讲，抛开 `状态` 影响不说，一个组件需要做哪些更新就是对比 `pendingProps` 和 `memoizedProps` 的差异。
- **updateQueue**：
- **memoizedState**：
- **dependencies**：
- **mode**
#### 第三部分（Effects）
- **flags**：
- **subtreeFlags**：
- **deletions**：
- **lanes**：
- **childLanes**：
- **alternate**：用于实现 **双缓存** 机制下的 `Fiber树` 更新。
### Fiber 树
以 `App` 函数组件为例，它的返回值又由多个其他的组件组成：
``` TypeScript
const App: React.FC = () => {
  return <div>
    <p>初探 Fiber 树</p>
    <ul>
      <li>努力</li>
      <li>加油</li>
      <li>上进</li>
    </ul>
  </div>
}
```
对应的 `Fiber 树` 为（括号数字为**index**的值）：
``` mermaid
  stateDiagram
  App(index跟fiber在自己父节点位置有关) --> div(0) : child
  div(0) --> App(index跟fiber在自己父节点位置有关) : return
  div(0) --> p(0) : child
  %% string1: 初探 Fiber 树(0)
  %% string2: 努力(0)
  %% string3: 加油(0)
  %% string4: 上进(0)
  li1 : li(0)
  li2 : li(1)
  li3 : li(2)
  %% p(0) --> string1 : child
  %% string1 --> p(0) : return
  p(0) --> ul(1) : sibling
  p(0) --> div(0) : return
  ul(1) --> li1 : child
  ul(1) --> div(0) : return
  %% li1 --> string2 : child
  li1 --> li2 : sibling
  li1 --> ul(1) : return
  %% string2 --> li1 : return
  %% li2 --> string3 : child
  li2 --> li3 : sibling
  li2 --> ul(1) : return
  %% string3 --> li2 : return
  %% li3 --> string4 : child
  li3 --> ul(1) : return
  %% string4 --> li3 : return
```
**注意**：像 “努力”、“加油”这样的字符串不会生成 `Fiber` 节点。
