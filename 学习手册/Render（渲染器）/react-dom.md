## react-dom 渲染器
基于Web开发，所以着重分析 `react-dom` 。众所周知 React 的入口都是调用如下代码：
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
1. **createContainer** 阶段 —— 真正的逻辑实际从 `createFiberRoot` 开始（[源码](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/react-reconciler/src/ReactFiberRoot.new.js#L167)）：
   - 首先，创建了 `FiberRootNode` 对象 `root`；
   - 再用 `createHostRootFiber` 创建了 `uninitializedFiber`；
   - 将 `root` 的 `current` 指向了 `uninitializedFiber`；
   - 将 `uninitializedFiber`  指向了 `root`；
   - 最后，调用 `initializeUpdateQueue` 方法初始化 **更新队列**。
3. **listenToAllSupportedEvents** 阶段 ——
