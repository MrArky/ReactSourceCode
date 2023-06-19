## react-dom 渲染器
众所周知 React 的入口都是调用如下代码：
``` html[]
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
在这个版本的 [CHANGELOG.md](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/CHANGELOG.md) 中`334`行有这么一句话：
> Remove `unstable_createRoot` and `unstable_createSyncRoot` experimental APIs. (These are available in the Experimental channel as `createRoot` and `createSyncRoot`.) ([@acdlite](http://github.com/acdlite) in [#17088](https://github.com/facebook/react/pull/17088))

意思就是`createRoot`替代了实验性的`unstable_createRoot`API，可以在生产环境中使用，这就有了在React18+中，入口调用通常是这么写：
``` TypeScript
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);
```
