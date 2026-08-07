# TopoLens 维护与部署指南

这份说明面向没有代码基础的项目负责人。日常维护时，先确认“想改变什么”，再修改对应区域，不要同时调整评分、数据结构和页面布局。

## 一、最常用的维护入口

| 想修改的内容 | 主要位置 | 注意事项 |
|---|---|---|
| 通用评分维度、等级和计算 | `src/config/rule.js`、`src/config/rubrics/universal/` | 修改后必须运行完整检查 |
| 专项流程、资产、平台和规则 | `src/config/evaluation/` | 保持“先通用、后专项” |
| 硬性门槛 | `src/services/deliveryGateEngine.js` | 不能直接篡改质量分 |
| 单模型评测页面 | `src/pages/EvaluatePage.jsx` | 优先复用现有组件 |
| 3D 查看与 Overlay | `src/components/ModelViewer/` | 切换模型时必须释放资源 |
| PK 规则与岗位反馈 | `src/config/comparison/`、`src/services/*Engine.js` | 不建立第二套评分体系 |
| 统计分析 | `src/modules/analytics/` | 区分真实记录和 Mock 数据 |
| 全局颜色和间距 | `src/styles/theme.css` | 不要逐页写死颜色 |
| 内置演示模型 | `public/models/` | 只放允许公开的文件 |

## 二、每次修改的安全流程

1. 先说明要修改什么、为什么修改、完成后页面会出现什么。
2. 一次只改一个能够独立验证的模块。
3. 运行：

   ```bash
   npm run check
   ```

4. 在浏览器中实际检查 `/home`、`/evaluate`、`/pk`、`/statistics`。
5. 导入健康模型和问题模型，确认结果不同且原因可解释。
6. 截图记录最终页面，并注明哪些是自动检测、人工确认或 Mock 数据。

`npm run check` 会依次检查代码规范、真实模型案例、自动评测、通用闭环、专项规则、完整交付闭环、PK、统计和正式构建。

## 三、数据与隐私

- 评测记录和设置保存在浏览器 `localStorage`。
- 换浏览器、换设备或清理浏览器数据后，记录不会自动同步。
- GLB、GLTF、OBJ、FBX 和图片不能转成 Base64 存入 localStorage。
- 本地上传模型只用于当前会话预览，不会被项目自动上传。
- GitHub 公共仓库中的所有文件都可能被任何人查看；不要把未公开作品、商业模型、密钥或账号信息放入项目。

## 四、第一次上传到 GitHub

推荐零代码用户使用 **GitHub Desktop**，因为它可以通过按钮完成提交和同步。

### 准备工作

1. 注册或登录 [GitHub](https://github.com/)。
2. 安装并登录 [GitHub Desktop](https://desktop.github.com/)。
3. 项目文件夹应选择：

   ```text
   C:\Users\Robin-Home\Desktop\3DmodelReview_WebD\web-demo
   ```

### 发布步骤

1. 在 GitHub Desktop 选择 `File → Add local repository`。
2. 选择上面的 `web-demo` 文件夹。
3. 确认当前改动，填写简短说明，例如 `Complete core evaluation demo`。
4. 点击 `Commit to main`。
5. 点击顶部的 `Publish repository`。
6. 推荐仓库名：`ai-3d-topology-review`。
7. 如果这是作品集项目，可以取消勾选 `Keep this code private`，设为公开；如果包含未公开内容则保持私有。
8. 发布后复制类似下面的地址，填写回 README：

   ```text
   https://github.com/你的用户名/ai-3d-topology-review
   ```

重要：如果由 Codex 继续代为完成上传，请先明确告诉 Codex：

- 仓库名称；
- 公开还是私有；
- GitHub 已经登录。

## 五、部署到公网

推荐使用 Vercel。Vite 项目连接 GitHub 后可以自动构建，以后每次更新 `main` 分支都会重新部署。

### Vercel 操作

1. 打开 [Vercel](https://vercel.com/) 并使用 GitHub 登录。
2. 点击 `Add New → Project`。
3. 找到刚发布的 `ai-3d-topology-review`，点击 `Import`。
4. Framework Preset 选择或保持自动识别的 `Vite`。
5. Build Command 使用 `npm run build`。
6. Output Directory 使用 `dist`。
7. 点击 `Deploy`。
8. 部署成功后复制 `https://项目名.vercel.app` 地址，填写回 README 的“在线体验”。

项目根目录中的 `vercel.json` 已处理单页路由。部署后直接打开 `/evaluate`、`/pk` 或 `/statistics`，也应该返回正确页面，而不是 404。

### “任意网络访问”的实际含义

部署成功后，不需要和开发电脑处在同一局域网，任何能够正常访问 Vercel 的电脑或手机都可以打开网站。但是公司防火墙、地区网络策略或 Vercel 自身服务状态仍可能限制访问，因此无法承诺字面意义上的所有网络都可访问。

## 六、发布后的验收

使用手机流量或另一台不在同一局域网的设备完成以下检查：

- 首页可以打开；
- 刷新 `/evaluate` 不出现 404；
- 四个导航入口都能进入；
- 内置 OBJ 测试模型可以加载；
- 问题模型能生成阻断结论；
- PK 和统计页面可以显示；
- 本地上传的模型不会出现在另一台设备上。

## 七、更新网站

以后修改完成并通过 `npm run check` 后：

1. 在 GitHub Desktop 填写本次修改说明；
2. 点击 `Commit to main`；
3. 点击 `Push origin`；
4. 等待 Vercel 自动部署；
5. 打开线上地址检查主要页面。

如果线上版本出现问题，可在 Vercel 的 Deployments 页面找到上一个成功版本进行回退。

## 八、官方参考

- [GitHub：添加本地项目](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
- [GitHub Desktop：发布已有项目](https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop)
- [Vite：静态站点部署](https://vite.dev/guide/static-deploy.html)
- [Vercel：Vite 项目与 SPA 路由](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel：连接 Git 仓库](https://vercel.com/docs/git)
