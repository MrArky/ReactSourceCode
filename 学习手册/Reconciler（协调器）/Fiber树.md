- **return、child、sibling、index**：组件渲染后，由于原（老版本） `虚拟 DOM 树` 被 `Fiber 树` 所替代，这四个属性用于在新的 `Fiber 树` 中与其他的节点建立关系，以 `App` 函数组件为例，它的返回值又由多个其他的组件组成：
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
对应的 `Fiber 树` 为（括号数字为**index**的值）：
``` mermaid
  stateDiagram
  App(index跟fiber在自己父节点位置有关) --> div(0) : child
  div(0) --> App(index跟fiber在自己父节点位置有关) : return
  div(0) --> p(0) : child
  string1: 初探 Fiber 树(0)
  string2: 努力(0)
  string3: 加油(0)
  string4: 上进(0)
  li1 : li(0)
  li2 : li(1)
  li3 : li(2)
  p(0) --> string1 : child
  string1 --> p(0) : return
  p(0) --> ul(1) : sibling
  p(0) --> div(0) : return
  ul(1) --> li1 : child
  ul(1) --> div(0) : return
  li1 --> string2 : child
  li1 --> li2 : sibling
  li1 --> ul(1) : return
  string2 --> li1 : return
  li2 --> string3 : child
  li2 --> li3 : sibling
  li2 --> ul(1) : return
  string3 --> li2 : return
  li3 --> string4 : child
  li3 --> ul(1) : return
  string4 --> li3 : return
```
- 
