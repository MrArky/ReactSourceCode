## react-dom 渲染器
基于Web浏览器端渲染开发，所以着重分析 `react-dom` 。众所周知 React 的入口都是调用如下代码：
``` html
<!DOCTYPE html>
<html>
  <head>
      <title>React 源码学习</title>
  </head>
  <body>
      <div id="root" />
  </body>
</html>
```
``` TypeScript
import { render } from 'react-dom';
render(<App />, document.getElementById('root'));
```
在这个版本的 [CHANGELOG.md](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/CHANGELOG.md) 中 `334` 行有这么一句话：
> Remove `unstable_createRoot` and `unstable_createSyncRoot` experimental APIs. (These are available in the Experimental channel as `createRoot` and `createSyncRoot`.) ([@acdlite](http://github.com/acdlite) in [#17088](https://github.com/facebook/react/pull/17088))

意思就是 `createRoot` 替代了实验性的 `unstable_createRoot` API，可以在生产环境中使用（[In our testing, we’ve upgraded thousands of components to React 18. What we’ve found is that nearly all existing components “just work” with concurrent rendering, without any changes.](https://react.docschina.org/blog/2022/03/29/react-v18#gradually-adopting-concurrent-features)），这就有了在 React18+ 中，入口调用通常是这么写：
``` TypeScript
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);
```
实际上在 React18 继续使用 `ReactDom.render` 会触发如下警告：
![image](https://github.com/MrArky/ReactSourceCode/assets/32703528/027a9fdf-7ed8-4baa-8594-76e0da5be140)
具体二者共同点及差异见 [render & createRoot.md](https://github.com/MrArky/ReactSourceCode/blob/main/%E5%AD%A6%E4%B9%A0%E6%89%8B%E5%86%8C/Render%EF%BC%88%E6%B8%B2%E6%9F%93%E5%99%A8%EF%BC%89/render%26createRoot.md)

便于观察使用 `createRoot` 创建根节点并执行 `root.render` 经历了什么，接下来在 App 组件中添加最简单的一段代码，让 React 项目运行起来，如下：
``` TypeScript
import * as React from 'react';
const App = () =><div>初识React源码</div>；
export default App;
```
最直接的方式是在浏览器中查看调用栈：

![image](https://github.com/MrArky/ReactSourceCode/assets/32703528/e3cb738f-6a51-4476-87a2-fcdee718af75)
### createRoot 阶段
从图中可以看到 `createRoot` 调用栈可以还原成以下代码（参数和各方法中的其他逻辑均已忽略）：
``` TypeScript
createRoot(){
  createRoot(){
    createRoot(){
      createContainer(){
        createFiberRoot(){
          createHostRootFiber(){
            createFiber();
          }
        }
      }
      listenToAllSupportedEvents(){
        (
          /** 匿名 */
          ()=>listenToNativeEven()
        )();
      }
    }
  }
}
```
根据代码可以看到，执行包含了两个重要的阶段：
1. **createContainer** 阶段 —— 真正的逻辑实际从 `createFiberRoot` 开始（为了方便源码阅读，这里将代码串联一下：
   [createRoot](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-dom/client.js#L25)->[createRoot](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-dom/src/client/ReactDOM.js#L150)->[createRoot](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-dom/src/client/ReactDOMRoot.js#L166)->[createContainer](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-reconciler/src/ReactFiberReconciler.old.js#L247)->[createFiberRoot](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-reconciler/src/ReactFiberRoot.old.js#L134)->[createHostRootFiber](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-reconciler/src/ReactFiber.old.js#L428)->[createFiber](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-reconciler/src/ReactFiber.old.js#L210)）：
   - 首先，创建了 `FiberRootNode` 对象 `root`；
   - 再用 `createHostRootFiber` 创建了 `uninitializedFiber`；
   - 将 `root` 的 `current` 指向了 `uninitializedFiber`；
   - 将 `uninitializedFiber` 的 `stateNode` 指向了 `root`；
   - 最后，调用 [initializeUpdateQueue](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-reconciler/src/ReactFiberClassUpdateQueue.old.js#L170) 方法为 `uninitializedFiber` 初始化 **更新队列**。
     
   `createHostRootFiber` 内部又调用了 `createFiber` 并返回了 `createFiber` 的返回值，所以 `uninitializedFiber` 其实是个 [Fiber](https://github.com/MrArky/ReactSourceCode/blob/main/%E5%AD%A6%E4%B9%A0%E6%89%8B%E5%86%8C/Scheduler%EF%BC%88%E8%B0%83%E5%BA%A6%E5%99%A8%EF%BC%89/Fiber.md) 对象。

   到目前为止，`React` 已经构建了以下对象结构：
   ```mermaid
   classDiagram
   root <|-- uninitializedFiber:stateNode
   uninitializedFiber <|-- root:current
   class root{
     current: FiberNode
     …
   }
   class uninitializedFiber{
     stateNode: FiberRootNode
     updateQueue: UpdateQueue<State>
     …
   }
   ```
   为什么叫 `uninitializedFiber(未初始化的Fiber)` —— 因为到这里为止，Fiber 还未与任何 `ReactNode` 建立联系，接下来还需要看在 `render` 函数里又发生了什么。
   
   **注意**：在第三个 [createRoot](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-dom/src/client/ReactDOMRoot.js#L166) 中，最后 `return` 时又将 [createContainer](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-reconciler/src/ReactFiberReconciler.old.js#L247) 的返回值 `root` 传入 `ReactDOMRoot` 构造函数，返回了 `ReactDOMRoot` 实例（在这个实例中将 `root` 放入了它的 `_internalRoot` 属性中。由于 `ReactDOMRoot` 原型链上添加了 `render` 和 `unmount` 方法，所以被返回的 `ReactDOMRoot` 实例才是真正提供 `render` 和 `unmount` 方法的对象）。
3. **listenToAllSupportedEvents** 阶段 —— 注册所有支持的事件，暂不做讨论。
### render 阶段
回到图中函数调用栈，`render` 函数执行可以还原为以下代码（参数和各方法中的其他逻辑均已忽略）：
``` TypeScript
ReactDOMHydrationRoot.render.ReactDOMRoot.render(){
  updateContainer(){
    requestUpdateLane();
    scheduleUpdateOnFiber();
  }
}
```
同样，为了方便源码阅读，这里将代码大概串联一下：[ReactDOMHydrationRoot.render.ReactDOMRoot.render](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-dom/src/client/ReactDOMRoot.js#L92)->[updateContainer](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-reconciler/src/ReactFiberReconciler.old.js#L321)->[requestUpdateLane](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-reconciler/src/ReactFiberWorkLoop.old.js#L452)-继续执行-[scheduleUpdateOnFiber](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-reconciler/src/ReactFiberWorkLoop.old.js#L533)

这个过程比较繁琐，以下是执行流水账：
