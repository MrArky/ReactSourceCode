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
import * as React from 'react';
const App = () =><div>初识React源码</div>；
export default App;
```

``` TypeScript
import { render } from 'react-dom';
render(<App />, document.getElementById('root'));
```
在这个版本的 [CHANGELOG.md](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/CHANGELOG.md) 中 `334` 行有这么一句话：
> Remove `unstable_createRoot` and `unstable_createSyncRoot` experimental APIs. (These are available in the Experimental channel as `createRoot` and `createSyncRoot`.) ([@acdlite](http://github.com/acdlite) in [#17088](https://github.com/facebook/react/pull/17088))

意思就是 `createRoot` 替代了实验性的 `unstable_createRoot` API，可以在生产环境中使用，这就有了在 React18+ 中，入口调用通常是这么写：
``` TypeScript
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);
```
具体二者共同点及差异见 [render & createRoot.md](https://github.com/MrArky/ReactSourceCode/blob/main/%E5%AD%A6%E4%B9%A0%E6%89%8B%E5%86%8C/Render%EF%BC%88%E6%B8%B2%E6%9F%93%E5%99%A8%EF%BC%89/render%26createRoot.md)
