### 调用 render 方法
需要明确的是—— `render` 方法创建在 `ReactDOMRoot` 的原型链中，所以在方法体里，`this` 指向的是 `ReactDOMRoot` 对象。
- 首先，在 `ReactDOMRoot` 获取到 `root`,即 `FiberRootNode` 对象。
- 如果 `root` 不存在，提示 `Cannot update an unmounted root.` （无法更新已卸载的根目录）。
- `__DEV__` 判断代码内容忽略（生产环境不会执行）。
  #### 调用 updateContainer 方法
  - 四个参数解释：
    - element：类型标记为 `ReactNodeList`, 其实就是 `render` 的第一个参数；
    - container： `FiberRootNode` 对象，其实就是 `Fiber` 根节点；
    - parentComponent：父组件；
    - callback：更新完成的回调函数。
    
    当传入了 `element` 和 `container`。
  - 取出了 `FiberRootNode` 的 `current` 备用，对应的值为 `uninitializedFiber`。
  - 请求活动时间 `eventTime`，这调用了方法 **requestEventTime**。
    ##### 调用 requestEventTime 方法
      - 在这个方法内部，会进入 **Scheduler（调度器）** ，在 [Scheduler.js](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/scheduler/src/forks/Scheduler.js#L44-L55) 中获取时间；
      - 可以看到为了兼容性，先判断了浏览器是否支持 `performance`，如果支持，返回 `performance.now()`，否则返回的是 `Date.now() - initialTime`，`initialTime` 是页面初始化时就已经赋值。这么一来，两者都是获取浏览器页面打开时到当前的时间。
        - `performance.now()` 本身由浏览器提供，计算页面初始化到当前时间差。其最小单位为毫秒，但是精度可以精确到小数点后很多位，因此实际可以提供更小的时间单位计算；
        - `Date.now()` 由 `JS` 库提供，计算的是 `1970-01-01 00:00:00` 到当前时间以毫秒为单位的时间戳，兼容性更好，但是精度只能到毫秒。因此 `React` 有限选择了 `performance.now()`。
  - 请求车道 `lane`，并调用了 **requestUpdateLane** （扩展：[车道模型]()）。
    
    
  
