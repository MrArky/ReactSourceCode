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
      1. 当前 `fiber` 及其缓存节点 `alternate` 更新 `lanes`
      2. 当前 `fiber` 的所有父 `fiber` 更新自己和缓存节点  `alternate` 的 `childLanes`

      所以此时需要将当前更新对应优先级的车道 `lane` 与 `Fiber` 的 `lanes` 以及 `Fiber` 的所有父级节点的 `childLanes` 进行合并（这也包含父节点的 `alternate` 所对应的 `childLanes`）
      
      在 mergeLanes 方法源码中可以看到，使用了或运算 |

      直至递归至 `node.tag === HostRoot`
  - 调用 scheduleUpdateOnFiber 方法，调度更新 `Fiber` —— 既然是并发更新，就需要考虑优先级
    - 检查嵌套更新，最多只能嵌套 `50` 层：
 
      主要避免在组件 `componentWillUpdate` 反复调用setState，防止无限循环
    - 调用 markRootUpdated 方法标记根 `root` 有一个待办的更新
      - 在 `root` 中待办道 `pendingLanes` 中加入当前更新所占用的车道：`pendingLanes |= updateLane`
        
        其实待办车道不止 `pendingLanes`，其实还有 `suspendedLanes` 和 `pingedLanes`，他们主要用于处理 `suspense` 类型组件的异步加载，优先级很低
      - 如果当前的车道不是空闲车道 `IdleLane`（可以理解为优先级更低执行的车道），那么将 `suspendedLanes` 和 `pingedLanes` 设置为 `NoLanes` ，即没有车道，实际上就是继续挂起这些更新
      - 把当前更新的活动时间标记在 `root.eventTimes` 上：`root.eventTimes` 是个数组，长度和 `root` 的总车道数一致是 `31`,如果使用的是 `0000000000000000000000000010000` 车道，那么就在 `root.eventTimes[4]` 的位置存储活动时间，他们的关系是相对的
        > 之所以车道数设置为 `31`，是因为在 `JS` 中，`32位` 的二进制数是带符号的，所以避免计算问题，只使用了 `31位` 二进制数来标记车道
    - 调用 ensureRootIsScheduled 方法，确保 `root` 更新被调度安排：使用此函数为根调度任务，每个根只有一个任务。如果一个任务已经被调度，我们将检查以确保现有任务的优先级与根用户正在处理的下一级任务的优先级相同。此函数在每次更新时调用，并在退出任务之前调用。
      - 调用 markStarvedLanesAsExpired 方法，给所有的车道标记过期时间
        - 将所有的待办车道（`pendingLanes`、`suspendedLanes` 和 `pingedLanes`）以及活动时间 `expirationTimes` 准备好
        - 依次从 `pendingLanes` 中按照优先级从低到高，找到每一个存在的车道，取出它在 `expirationTimes` 对应的过期时间：
          1. 如果过期时间是未设置，找到一个没有过期时间的待处理通道。 如果它没有挂起，或者如果它被ping通，使用更新活动开始时间计算一个过期时间，这个过期时间跟车道的优先级有关系，优先级越高，过期时间越靠近活动开始时间，这样它在调度过程中将会优先被处理
          2. 否则（有过期时间）看过期时间是否小于等于当前更新的活动时间，如果是，将该车道标记为过期车道 `root.expiredLanes |= lane`
        - 将该车道从 `pendingLanes` 中移除
      - 调用 getNextLanes 方法获取下一个执行的车道 `nextLanes`，以及它的优先级，这个方法传入了两个参数 `root` 和 `workInProgressRootRenderLanes`：
        - 首先是在 `root` 中找到优先级最高的车道，如果这时已经在调度 `root` 上的更新了，即 `workInProgressRootRenderLanes` 存在，那么有必要比较当前 `root` 上的更新的最高优先级车道和 `workInProgressRoot` 上的最高优先级车道的优先级。如果正在调度的更新的优先级更高，那么就不能打断当前的更新
        - 有一种情况时更新默认为同步时，那么默认车道需要添加进 `nextLanes` 中，以便它能在再次更新中得到处理
        - 在最后之前需要了解，在 `root` 中有一个 `entangledLanes`，直译过来叫“纠缠车道”，源码中有一长段文字对它进行了解释，大致的意思是：
          > 需要检查纠缠的车道，将其加入到当前批处理中。如果一个车道被称之为纠缠车道，他在一个批处理中不允许被渲染是因为这个批次中还不包含另一个车道。通常多个更新来自于同一个源，我们只希望源为最新时对这些更新进行响应

          那么这么理解，如果之前的某些车道因为纠缠了当前的 `nextLanes` 中的车道没有被渲染，那么现在就需要把这些车道添加至这次的批处理中进行渲染
      - 如果 `nextLanes` 中没有车道，同时 `existingCallbackNode` 不为空，那么执行 `cancelCallback(existingCallbackNode)` 取消当前的任务回调
      - 使用 `nextLanes` 中最该优先级车道作为回调的优先级
      - 从 `root.callbackPriority` 检查现在是否有任务，如果优先级与 `nextLanes` 回调的优先级相同，就重用现有的任务
      - 否则如果现存任务（没有就不管），就要将其取消掉
      - 然后安排一个新的回调任务
      - 调用 `lanesToEventPriority(nextLanes)` 获取调度级别，调度级别有五个， [开始引言](https://github.com/MrArky/ReactSourceCode/blob/main/%E5%AD%A6%E4%B9%A0%E6%89%8B%E5%86%8C/%E5%BC%80%E5%A7%8B.md#%E5%BC%95%E8%A8%80) 中已经介绍过
      - 调用 `scheduleCallback` 方法安排回调，传入了一个重要的方法 `performConcurrentWorkOnRoot`
        - 首先根据调度级别，计算了出了任务的过期时间
        - 创建任务，以下是任务对象
          ``` TypeScript
          {
            id: taskIdCounter++,
            callback,
            priorityLevel,
            startTime,
            expirationTime,
            sortIndex: -1,
          }
          ```
        - 将任务入队 `taskQueue`
        - 调度一个主机回调，执行 requestHostCallback(flushWork)
      - 设置当前 `root` 的回调优先级和新创建的 `callbackNode`
    - 完成 `callbackNode` 方法执行
  - 执行 `entangleTransitions` 执行缠绕的转换
- 完成 `updateContainer` 执行，并返回更新车道
- 开始执行 `performWorkUntilDeadline` 方法，这个方法是在之前执行 `requestHostCallback` 方法时通过 `MessageChannel` 通知执行的
  - 在这方法中主要是调度主机回调执行 `scheduledHostCallback` 方法，这个方法其实就是 `flushWork` 方法，在这个方法中的核心是执行 `workLoop` 方法
    - 在`workLoop` 方法中，首先会去全局 `taskQueue` 取出最先需要处理任务，通过 `while` 循环逐一处理任务
    - 约束：如果这个任务的过期时间比当前时间大、没有更多地处理时间否则就退出
    - 接着取出任务中的回调即 `performConcurrentWorkOnRoot` 方法，就是从根节点开始执行并发工作
    - 取出任务优先级
    - 获取当前任务是否已经过时标志
    - 如果标志为 `true`，那么执行这个回调，这个回调时所有并发任务的入口点，在此方法内，最终会根据优先级、车道情况执行 `renderRootConcurrent` 或者 `renderRootSync`,便是所谓的同步渲染或者并发渲染
    - 最终进入 `renderRootSync` 方法
      - 调用 `prepareFreshStack` 方法创建 `workInProgress`
      - 调用 `workLoopSync` 方法，这个方法实际上也是一个 `while` 递归，以当前 `fiber` 节点创建（更新）子 `fiber` 节点的过程，对于 `workInProgress` 的更新方案，主要就取决于其 `tag` 类型
