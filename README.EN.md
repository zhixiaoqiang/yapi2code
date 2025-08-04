# YAPI TO CODE

![YAPI TO CODE](https://socialify.git.ci/zhixiaoqiang/yapi2code/image?description=1&descriptionEditable=%E4%B8%80%E4%B8%AA%20VS%20Code%20%E6%89%A9%E5%B1%95%EF%BC%8C%E6%94%AF%E6%8C%81%E5%9F%BA%E4%BA%8E%20YAPI%20%E7%94%9F%E6%88%90%20JS%2FTS%2FDart%20%E4%BB%A3%E7%A0%81%EF%BC%8C%E5%BC%80%E7%AE%B1%E5%8D%B3%E7%94%A8%EF%BC%8C%E6%94%AF%E6%8C%81%E8%87%AA%E5%AE%9A%E4%B9%89&font=Inter&forks=1&issues=1&language=1&name=1&owner=1&pattern=Plus&stargazers=1&theme=Light)

[marketplace.visualstudio](https://marketplace.visualstudio.com/items?itemName=zhixiaoqiang.yapi-to-code)

<center>
<a href="./README.md">中文</a>|ENGLISH
</center>

## Features

1. 🙈 Zero configuration, ready to use out of the box
2. 🔥 Full interface preview
3. ✨ Available for internal network
4. 😼 Multiple login methods
5. ⚡️ High performance
6. ✍️ Supports js configuration for custom output
7. ⚡️ Rapid development experience - Rspack
8. ...

## TODO

- [x] 1. Customizable template generation & template switch preview
- [ ] 2. Optional project group - Speed up requests & improve performance
- [ ] 3. Asynchronous request loading
- [ ] 4. Optimize page performance
- [ ] 5. Support for custom parsing
- [x] 6. Replace yarn with pnpm
- [x] 7. Migrate to Rspack
- [ ] 8. Replace function type detection from `typescript` to `ts-morph`, effectively reducing 90% of the volume
- [ ] 9. Support for detecting interface definition updates
- [ ] ...

## Login to YAPI

For the first time use, enter the service address & account password of YAPI to log in.

<img src="./public/login.png" width="300" alt=""/>

## Usage

After logging in, vscode has the ability to access YAPI interfaces and can automatically convert any interface into a type.

#### Code Diagnosis Function

Yapi To Code warns of undefined parameter types or return value types in the document in a wavy form, and can directly add interface types to the project through quick fixes.

<img src="https://qnm.hunliji.com/FnOC3c1bW5bzpRu23iArFXKTrMZH" width="800" alt=""/>

#### Interface Browser

Yapi To Code also provides an interface preview function. You can preview the interface type by searching and selecting the interface, and then copy the type to the project.

<img src="https://qnm.hunliji.com/FtK9IFJlRvKdPCA4jLNoEXs1xyKO" width="800" alt=""/>

##### Open in New Window

By default, interfaces are previewed in the same window. If you need to preview in a new window, you can click on the following Icon:

<img src="./public/api-blank.png" width="300" alt=""/>

##### Refresh & Clear Directives

Sometimes, when certain interfaces are updated, you may need to refresh specific interfaces. Right-click on the tree to perform a re-request operation.

The clear operation only deletes the content of child items permanently.

<img src="./public/tree-contextMenu.png" width="300" alt=""/>

#### Custom Rendering

Workspace configuration: You can modify the output fields, the position of the type filling, etc.

<img src="./public/config.png" width="300" alt="" />

</br>

Config file：`yapi-to-code.config.cjs` **priority**

```js
module.exports = () => {
 return {
  /** 域名：优先取工作区缓存的域名(登录成功的域名) */
  host: 'http://yapi.internal.com',
  /** banner 头部内容，可以填写导入的请求实例等 */
  banner: '',
  /** 生成 res 包含的属性，默认 all, 可指定为 data、custom
   * 'all' | 'data' | 'custom' 
   */
  responseKey: 'all',
  /** 生成 res 指定的属性值，仅当 responseKey 选择 custom 是有效，默认 data, 可指定为任意 key(支持链式：data.result) */
  responseCustomKey: 'data',
  /** resDataTypeContent 放置的位置是外层的 Promise<T> 还是作为请求方法的泛型 post<T>
   * 'outerFunction' | 'fetchMethodGeneric'
   */
  responseTypePosition: 'outerFunction',
  /** 开启自动格式化 */
  format: false,
  /** 缩进使用 tab，或者 双空格 */
  useTab: false,
  /** 自定义生成 request 方法 */
  genRequest(
   {
    comment,
    fnName,
    IReqTypeName,
    IResTypeName,
    requestFnName,
    apiPath,
   },
   data
  ) {
  const params = IReqTypeName ? `data: ${IReqTypeName}` : ''
  const dataContent = IResTypeName ? 'data' : ''
   return (
    `\n${comment}\n
export async function ${fnName}(${params}) {
  return request.${requestFnName}<${IResTypeName}>('${apiPath}', ${dataContent})
}`
   )
  }
 }
}

```

## Webview & VS Code Data Flow.png

<img src="./public/webview-vscode-data-flow.png" alt="Webview & VS Code Data Flow" />

## Development Debugging

> Dependencies on src/server src/webview resources are required

### Compile Pre-Dependencies

#### Rspack ⚡️⚡️⚡️

```bash
pnpm i
cd src/server && pnpm start
cd src/webview && pnpm start
```

### Select Client + Server

<img src="./public/debug.png" alt="debug" />

> Tips: Node logs can be viewed in the debug console of the source code editor, and webview logs can be viewed in the invoked editor's devtool.

### Package Release

> Package and publish VS Code Extension through vsce

```bash
pnpm package

pnpm pub
```
