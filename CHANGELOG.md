# Change Log

## 0.0.33

### Patch Changes

- chore: 升级依赖及配套修改
- feat: 优化打开文档交互体验
- feat: 拆分yapi相关函数，统一上层数据确保底下拿到的是一致的数据以解决生成不稳定的问题

## 0.0.32

### Patch Changes

- feat: api查看支持点击\右键 复制\插入光标处

## 0.0.31

### Patch Changes

- feat: 修正无法过滤链接的问题，优化 tree 交互性能（拼音、状态分离等）

## 0.0.30

### Patch Changes

- feat: 设置支持跳转到 workspace settings, 修正配置内容

## 0.0.29

### Patch Changes

- feat: 改善生产类型的代码逻辑,支持更多的配置项: banner customKey useTab

## 0.0.28

### Patch Changes

- feat: 登录的host支持配置, 登录信息支持读取缓存结果

## 0.0.26

### Patch Changes

- fix: 过滤无效

## 0.0.22

### Patch Changes

- fix: 修复分组下包含子分组时的右键重新请求异常

## 0.0.22

### Patch Changes

- feat: 可以通过在 tree 组件上按右键进行数据刷新、清除

## 0.0.21

### Patch Changes

- feat: menus 支持添加\预览配置文件
- feat: 默认使用 rspack 打包

## 0.0.20

### Patch Changes

- feat: 调整检测待补全接口范围为当前工作区的.ts/.tsx文件,且不包含.d.ts文件
- chore: 调整 storage.clearAll 清除范围
- 添加 rspack 打包（未完成）

## 0.0.17

### Patch Changes

- feat: 支持初级配置能力

## 0.0.14

### Patch Changes

- fix: some error

## 0.0.8

### Patch Changes

- fix: publish some resources was missing
- chore: upgrade deps, adjust webview vscode types, adjust UI

## 0.0.7

### Patch Changes

- 支持接口预览 TS
- 优化接口请求
- 修复接口请求超时的问题
