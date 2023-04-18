# YAPI TO CODE

一个基于 YAPI 生成 TS/Dart 的 VS Code 扩展，支持浏览整个 Yapi 组，支持自定义模板

[marketplace.visualstudio](https://marketplace.visualstudio.com/items?itemName=zhixiaoqiang.yapi-to-code)

**TODO:**

- [ ] 1. 自定义生成模版 & 切换模版预览
- [ ] 2. 项目组可选 - 加快请求 & 提高性能
- [ ] 3. 请求异步加载
- [ ] 4. 优化页面性能
- [ ] 5. 支持自定义解析
- [x] 6. yarn 替换为 pnpm
- [ ] ...

## 登录 YAPI

初次使用，输入 yapi 的服务地址 & 账号密码，进行登录

<img src="/public/login.png" width="300" />

## 使用

登录后，vscode 便拥有了访问 yapi 接口的能力，能够自动把任意接口转化为类型

#### 代码诊断功能

Yapi To Code 对文档中未定义参数类型或返回值类型的接口进行波浪形警告，可以通过快速修复（quick fix）直接添加接口类型到项目中。

<img src="https://qnm.hunliji.com/FnOC3c1bW5bzpRu23iArFXKTrMZH" width="800" />

#### 接口浏览器

Yapi To Code 还提供了接口预览的功能，可以通过搜索选择接口对接口类型进行预览，然后把类型复制到项目中。

这种方式比较笨拙，推荐使用代码诊断功能，一条龙完成

<img src="https://qnm.hunliji.com/FtK9IFJlRvKdPCA4jLNoEXs1xyKO" width="800" />

#### 自定义渲染

工作区配置：可以修改 输出的字段、类型填充的位置等

<img src="/public/config.png" width="300" />

</br>
</br>

配置文件：`yapi-to-code.config.cjs` **优先级更高**

```js
module.exports = () => {
  return {
    // resType 放置的位置 是外层的 Promise<T> 还是作为请求方法的泛型
    // 'outerFunction' | 'fetchMethodGeneric'
    responseTypePosition: 'outerFunction',
    // 生成 res 包含的属性，默认 all, 可指定为 data
    responseKey: 'all',
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
  return (
      `\n${comment}\n` +
      `export async function ${fnName}(params: I${IReqTypeName}) {
  return request.${requestFnName}<${IResTypeName}>('${apiPath}', params)
}`
      )
    }
  }
}

```

## Webview & VS Code Data Flow.png

![Webview & VS Code Data Flow](public/Webview%20&%20VS%20Code%20Data%20Flow.png)
## 开发调试

> 需要依赖 src/server src/webview 的资源

### 编译前置依赖

```bash
pnpm i
cd src/server && pnpm start
cd src/webview && pnpm start
```

### 选择 Client + Server

![debug](/public/debug.png)

> Tips: node 日志在源码编辑器的调试控制台查看，webview 日志在唤起的编辑器唤起 devtool 查看

## 打包发布

> 通过 vsce 打包发布 VS Code Extension

```bash
pnpm package

pnpm pub
```
