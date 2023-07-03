- **return、child、sibling、index**：组件渲染后，由于原有（老版本）的 `虚拟 DOM 树` 被 `Fiber 树` 所替代，这四个属性用于在新的 `Fiber 树` 与其他的节点建立关系，以 `App` 函数组件为例，它的返回值又由多个其他的组件组成：
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
``` mermaid
  stateDiagram
  App --> div : child
  div --> App : return
  div --> p : child
  string1: 初探 Fiber 树
  string2: 努力
  string3: 加油
  string4: 上进
  li1 : li
  li2 : li
  li3 : li
  p --> string1 : child
  p --> ul : sibling
  p --> div : return
  ul --> li1 : child
  ul --> div : return
  li1 --> string2 : child
  li1 --> li2 : sibling
  li1 --> ul : return
  li2 --> string3 : child
  li2 --> li3 : sibling
  li2 --> ul : return
  li3 --> string4 : child
  li3 --> ul : return
```
- 
