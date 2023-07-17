### 调用 render 方法
需要明确的是—— `render` 方法创建在 `ReactDOMRoot` 的原型链中，所以在方法体里，`this` 指向的是 `ReactDOMRoot` 对象。
- 首先，在 `ReactDOMRoot` 获取到 `root`,即 `FiberRootNode` 对象
- 调用 `updateContainer` 方法
  - 获取当前的 `Fiber` 对象
  - 获取请求活动时间：

    这个时间指的是浏览器窗口大开至当前的时间：
    - 兼容性比较好的浏览器使用 `performance.now()` 获得，精度高。
    - 否则使用 `Date` 对象获得，精度低。
  - 根据 `Fiber` 对象 `mode` 获取车道 `lane`
  - 获取到一个 `DefaultEventPriority` 车道：16 即：`0000000000000000000000000010000`
  - 获取父组件带来的 `context` （因为父组件为null，所以得到空对象）：{}
  - 根据请求活动时间和车道创建一个 `update`，如下：
    ``` TypeScript
    {
      eventTime,
      lane,
      tag: UpdateState,
      payload: null,
      callback: null,
      next: null,
    }
    ```
  - 将 render 的第一个参数，`ReactNode` 入口组件赋值给 `payload`
  - 调用 `enqueueUpdate` 方法排队更新
    - 将更新放入 `Fiber` 的更新队列（如果更新是Class组件不安全的阶段，那么直接将 `update` 放入了 `fiber.updateQueue.shared.pending`；否则将 `update` 放入了 `fiber.updateQueue.shared.interleaved`，并将整个 `interleaved` 加入全局队列 `concurrentQueues` 中实现并发更新）
    - 调用 markUpdateLaneFromFiberToRoot 重新标记从当前 `Fiber` 一直到 `root` 所有 `FiberNode` 的车道 `lane`
      1. `lanes`: `Fiber` 的更新总共占了哪些车道
      2. `childLanes`: `Fiber` 自己孩子的所有更新总共占了哪些车道
      所以此时需要将当前更新对应优先级的车道 `lane` 与 `Fiber` 的 `lanes` 以及 `Fiber` 的所有父级节点的 `childLanes` 进行合并（这也包含父节点的 `alternate` 所对应的 `childLanes`）

      直至递归值 `node.tag === HostRoot`
  - 调用 scheduleUpdateOnFiber 方法，调度更新 `Fiber` —— 既然是并发更新，就需要考虑优先级
    - 检查嵌套更新，最多只能嵌套 `50` 层：
 
      主要避免在组件 `componentWillUpdate` 反复调用setState，防止无限循环
    - 调用 markRootUpdated 方法标记根 `root` 有一个代办的更新
      - 在 `root` 中代办道 `pendingLanes` 中加入当前更新所占用的车道：`pendingLanes |= updateLane`
        
        其实代办车道不止 `pendingLanes`，其实还有 `suspendedLanes` 和 `pingedLanes`，他们主要用于处理 `suspense` 类型组件的异步加载，优先级很低
      - 如果当前的车道不是空闲车道 `IdleLane`（可以理解为优先级很低执行的车道），那么将 `suspendedLanes` 和 `pingedLanes` 设置为 `NoLanes` ，即没有代办车道，实际上就是继续挂起这些更新
      - 把当前更新的活动时间标记在 `root.eventTimes` 上：`root.eventTimes` 是个数组，长度和 `root` 的总车道数一致是 `31`,如果使用的是 `0000000000000000000000000010000` 车道，那么就在 `root.eventTimes[4]` 的位置存储活动时间，他们的关系是相对的
        > 之所以车道数设置为 `31`，是因为在 `JS` 中，`32位` 的二进制数是带符号的，所以避免计算问题，只使用了 `31位` 二进制数来标记车道
    - 调用 ensureRootIsScheduled 方法，确保 `root` 更新被调度安排
      - 将所有的代办车道（`pendingLanes`、`suspendedLanes` 和 `pingedLanes`）以及活动时间 `expirationTimes` 准备好
      - 
    
