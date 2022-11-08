# YAPI-TO-CODE

一个基于 YAPI 生成 TS/Dart的 VS Code 扩展，支持浏览整个 Yapi 组，支持自定义模板

## 登录 YAPI

初次使用，输入 yapi 的账号密码，进行登录

<img src="https://qnm.hunliji.com/Fsv8vNWD-xUNyTlwtlKpeKIQAwCj" width="250" />

## 使用

登录后，vscode 便拥有了访问 yapi 接口的能力，能够自动把任意接口转化为类型

#### 代码诊断功能

Yapi-To-Code 对文档中未定义参数类型或返回值类型的接口进行波浪形警告，可以通过快速修复（quick fix）直接添加接口类型到项目中。

<img src="https://qnm.hunliji.com/FnOC3c1bW5bzpRu23iArFXKTrMZH" width="800" />

#### 接口浏览器

Yapi-To-Code 还提供了接口预览的功能，可以通过搜索选择接口对接口类型进行预览，然后把类型复制到项目中。

这种方式比较笨拙，推荐使用代码诊断功能，一条龙完成

<img src="https://qnm.hunliji.com/FtK9IFJlRvKdPCA4jLNoEXs1xyKO" width="800" />

<!-- ## 更新说明 -->

<!-- 0.0.1-0.0.5

    【新增】代码诊断，通过修复进行接口补全
    【新增】yapi接口树查看，接口查询
    -
    【优化】接口智能查询和缓存，提高查询速度和稳定性
    -
    【修改】根据业务实际需要，把Response作为YapiResponse的泛型，可以通过修改YapiResponse修改其类型，或通过引入的方式修改
    【新增】检查更新
    -
    【修改】responseBody的类型可选性由判断required为1时必选，改为判断required为0时可选
    【优化】yapi所有接口请求时间超时设置为3秒，避免接口长时间阻塞
    【修改】接口树搜索由关键词indexOf查询，修改为===查询
    【修改】接口树查询可直接使用yapi接口查询
    -
    【优化】YapiResponse优化为类型推导，以适应各种各样的场景
    【修复】修复 import 的插入节点存在插入代码之间的问题
    【修复】接口请求的队列会因为登录失败一直阻塞，增加登录重试
    【优化】注释从“//”修改为“/** */”，因为后者拥有悬浮提示
    【优化】体验更智能化

0.0.6

    【修复】同一个文件中的不同接口具有相同2段路径的位置插入错误的问题
    【修复】类型中含有特殊字符的键，进行转义
    【新增】含有多个待修复类型时，可选择[全部修复]

0.0.7

    【修复】同一个interface重复写入的问题
    【新增】增加项目配置文件，指定名为yapi.config.json,需与最近的package.json文件同级，该配置指定对当前项目yapi类型生成的自定义内容
    【新增】配置的 filePath 指定类型文件生成路径，默认为同级目录下types.ts
    【新增】配置的 responseType 为 methodGeneric 时生成的响应类型以请求方法泛型形式插入（@core/fetch需升级到1.2.4支持方法泛型）

0.0.8

    【修复】修复插入类型后提示未消失问题
    【修复】修复any插入类型问题

0.0.9

    【新增】兼容@core/fetch createApi并兼容大部分主流写法
    【新增】增加接口类型待办清单视图，仅扫描api文件夹下或api.ts文件
    【更新】去除yapi.config.json配置方式，减少文件频繁读写，默认methodGeneric方式，若需要使用YapiResponse方式，需要在settings.json配置为："yapi.responseType":""
    【修复】反引号、环境变量不识别 -->

## 开发调试

> 需要依赖 src/server src/webview 的资源

### 编译前置依赖

```bash
yarn
cd src/server && yarn && yarn start
cd src/webview && yarn && yarn start
```

### 选择 Client + Server

![debug](/public/debug.png)

> Tips: node 日志在源码编辑器的调试控制台查看，webview 日志在唤起的编辑器唤起 devtool 查看

## 打包发布

> 通过 vsce 打包发布 VS Code Extension

```bash
yarn package

yarn pub
```
