## render & createRoot
共同点
- 通过 [react-dom](https://github.com/MrArky/ReactSourceCode/blob/main/%E5%AD%A6%E4%B9%A0%E6%89%8B%E5%86%8C/Render%EF%BC%88%E6%B8%B2%E6%9F%93%E5%99%A8%EF%BC%89/react-dom.md?plain=1#L14-L26) 中介绍，二者都能够根据传入的 `document.getElementById('root')` 创建根节点，并将渲染内容挂载在上边。

差异点
- 过去 `render` 的方式 `root` 是对外不可见的、黑盒的，如果需要访问根节点只能通过dom操作实现。现在 `createRoot` 创建了 `root` 对象，对外是透明的、可访问的，由 `root` 提供的 `render` 方法实现渲染挂载；

- 相对于 `createRoot` ， `render` 不支持 `Concurrent Mode` ；
   - 什么是 `Concurrent Mode` ？
