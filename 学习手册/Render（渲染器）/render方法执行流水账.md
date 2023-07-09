### 调用 render 方法
需要明确的是—— `render` 方法创建在 `ReactDOMRoot` 的原型链中，所以在方法体里，`this` 指向的是 `ReactDOMRoot` 对象。
- 首先，在 `ReactDOMRoot` 获取到 `root`,即 `FiberRootNode` 对象。
- 如果 `root` 不存在，提示 `Cannot update an unmounted root.` （无法更新已卸载的根目录）。
- `__DEV__` 判断代码内容忽略（生产环境不会执行）。
  #### 调用 updateContainer 方法
  - 四个参数解释：
    - element：类型标记为 `ReactNodeList`, 其实就是 `render` 的第一个参数；
    - container： `FiberRootNode` 对象，其实就是 `Fiber` 根节点；
    - parentComponent：父组件，未传入；
    - callback：更新完成的回调函数，未传入。
  - 取出了 `FiberRootNode` 的 `current` 备用，对应的值为 `uninitializedFiber`。
  - 请求活动时间 `eventTime`，这调用了方法 **requestEventTime**。
    ##### 调用 requestEventTime 方法
    - 在这个方法内部，会进入 **Scheduler（调度器）** ，在 [Scheduler.js](https://github.com/MrArky/ReactSourceCode/blob/main/packages/react-18.2.0/packages/scheduler/src/forks/Scheduler.js#L44-L55) 中获取时间；
    - 可以看到为了兼容性，先判断了浏览器是否支持 `performance`，如果支持，返回 `performance.now()`，否则返回的是 `Date.now() - initialTime`，`initialTime` 是页面初始化时就已经赋值。这么一来，两者都是获取浏览器页面打开时到当前的时间。
      - `performance.now()` 本身由浏览器提供，计算页面初始化到当前时间差。其最小单位为毫秒，但是精度可以精确到小数点后很多位，因此实际可以提供更小的时间单位计算；
      - `Date.now()` 由 `JS` 库提供，计算的是 `1970-01-01 00:00:00` 到当前时间以毫秒为单位的时间戳，兼容性更好，但是精度只能到毫秒。因此 `React` 有限选择了 `performance.now()`。
  - 请求车道 `lane`，并调用了 **requestUpdateLane** （扩展：[车道模型](https://github.com/MrArky/ReactSourceCode/blob/main/%E5%AD%A6%E4%B9%A0%E6%89%8B%E5%86%8C/Scheduler%EF%BC%88%E8%B0%83%E5%BA%A6%E5%99%A8%EF%BC%89/lanes%EF%BC%88%E8%BD%A6%E9%81%93%E6%A8%A1%E5%9E%8B%EF%BC%89.md)）。
    ##### 调用 requestUpdateLane 方法
    - 参数为 `current`，即 `uninitializedFiber`，后简称为 `Fiber`。在该方法中，返回什么样的车道主要分以下几种情况：
      - 第一种情况， `Fiber.mode` 为奇数，那么返回 `SyncLane`;
      - 第二种情况，更新不延迟到下一批并且当前有正在执行的上下文并且当前有正在进行渲染的车道，那么从就从正在渲染的车道中随机选择一个（**这段被官方标记为不只支持的**）。
      - 第三种情况，看当前是否为 `transition`，如果是，需要查看 `currentEventTransitionLane` 值是否为 `NoLane`，不是就直接返回（**同一事件中的所有转换都分配到相同的车道**），否则就认领下一个过渡车道给 `currentEventTransitionLane`，并返回。
      - 第四种情况，获取更新的优先级，如果返回值不为 `NoLane`，那就返回其对应的车道。
      - 第五种情况，获取事件的优先级，返回其对应的车道。
  - 根据执行结果，得到的是事件优先级所对应的车道。但由于这不是因为事件所驱动的更新，所以系统默认返回的是默认级别的车道，十进制表示为 16。
  - 判断是否开启了优先级调度（当看版本的的 `React` 是开启的），如果是，则根据当前车道的值标记 `render` 优先级。接下来调用 **markRenderScheduled** 方法并传入车道 `lane`（其实因为内部判断，什么都没做）。
  - 从父组件获取上下文（这里因为父组件传入为 `null` ，因此获取的上下文是 `emptyContextObject`）。
  - 这时候判断 container 是否存在 `context` ，如果不存在，将获取的 `context` 赋值给他。否则赋值给 `pendingContext` 。猜测后序会拿来更新 `context` ，`context` 
的变化可能会对子组件有影响，因此此处不能直接赋值给 `context`。
  - 创建一个更新 `update`,调用 **createUpdate** 并传入 `eventTime` 和 `lane`。
    ##### 调用 createUpdate 方法
    返回下对象
    ``` TypeScript
    {
      eventTime,
      lane,
      tag: UpdateState, // 值为 0
      payload: null,
      callback: null,
      next: null,
    }
    ```

