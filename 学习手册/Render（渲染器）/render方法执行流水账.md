### 调用 render 方法
需要明确的是—— `render` 方法创建在 `ReactDOMRoot` 的原型链中，所以在方法体里，`this` 指向的是 `ReactDOMRoot` 对象。
- 首先，在 `ReactDOMRoot` 获取到 `root`,即 `FiberRootNode` 对象。
- 如果 `root` 不存在，提示 `Cannot update an unmounted root.` （无法更新已卸载的根目录）。
- 再从 `root` 拿到 `containerInfo`，这里的 `containerInfo` 就是创建根节点的 `DOM` 对象。
  <details>
  <summary>index.html</summary>
  
  ```
  <!DOCTYPE html>
  <html>
    <head>
        <title>React 源码学习</title>
    </head>
    <body>
        <-- containerInfo -->
        <div id="root" />
    </body>
  </html>
  ```
  
  </details>
- 接下来判断 `container.nodeType !== COMMENT_NODE`：

  了解 **HTML DOM Element nodeType** 属性（[参考资料](https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nodeType) ）。

  `COMMENT_NODE` 代表一个 `Comment` 节点，通常来讲 `container.nodeType !== COMMENT_NODE` 是一定成立的。如上 `container` 是 `div` 元素对象，它是一个 `元素` 节点。
  #### 调用 findHostInstanceWithNoPortals 方法
- 666
