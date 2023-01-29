"use strict";

const path = require("path");
const fs = require("fs");
const userHome = require("user-home");
const inquirer = require("inquirer");
const Command = require("@febutler/command");
const Package = require("@febutler/package");
const getTemplateList = require("./getTemplate");
const fse = require("fs-extra");
const log = require("@febutler/log");
const ejs = require("ejs");
const semver = require("semver");
const { info } = require("console");
const { listenerCount } = require("process");
const { spinnerStart, spawnExec, spawnExecAsync } = require("@febutler/utils");

const TYPE_PROJECT = "project";
const TYPE_COMPONENT = "component";

const TEMPLATE_TYPE_NORMAL = "normal";
const TEMPLATE_TYPE_CUSTOM = "custom";

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ""; // 拿到项目名称
    this.forceExits = !!this._options.force; // 查看参数中是否传入了 --force
    this.projectPath = null;
    this.projectInfo = null;
    this.templateList = null;
    this.templatePackage = null;
    log.verbose("project name: " + this.projectName);
    log.verbose("force exit: " + this.forceExits);
  }
  async exec() {
    try {
      // 1. 准备阶段：确保安装目录存在并收集项目信息，返回项目信息
      this.projectInfo = await this.prepare();
      // 2. 下载模板
      await this.downloadTemplate();
      // 3. 安装模板
      await this.installTemplate();
    } catch (error) {
      log.error(error.message);
      console.log(error);
    }
  }
  async prepare() {
    // 验证是否存在模板,不存在就不继续了
    const templateList = await getTemplateList();
    if (!templateList || !templateList.length > 0)
      throw new Error("there has no template");
    this.templateList = templateList;

    // 确保安装目录存在
    if (!this.projectName)
      throw new Error("init command: projectName is necessary");
    // 查看当前目录中是否存在名为 projectName 的目录
    this.projectPath = path.resolve(process.cwd(), this.projectName);
    if (fs.existsSync(this.projectPath)) {
      // 有则判断此目录是否为空
      if (!this.isDirEmpty(this.projectPath)) {
        // 不为空则查看是否有强制创建参数--force
        if (this.forceExits) {
          // 有 --force 则删除目录中的内容，并将此目录作为项目目录
          fse.emptyDirSync(this.projectPath);
        } else {
          // 没有则询问用户是否继续创建
          const { isContinue } = await inquirer.prompt([
            {
              type: "confirm",
              name: "isContinue",
              default: false,
              message: `Some files already exist in the ${this.projectName} directory, Are you sure you want to continue ? (These files will be deleted)`,
            },
          ]);
          if (isContinue) {
            const { isDelete } = await inquirer.prompt([
              {
                type: "confirm",
                name: "isDelete",
                default: false,
                message: `Confirm again, The files in the ${this.projectName} directory will be deleted!!!`,
              },
            ]);
            if (isDelete) {
              // 继续则删除目录中的内容，并将此目录作为项目目录
              fse.emptyDirSync(this.projectPath);
            } else {
              // 否则退出脚手架
              throw new Error(`Failed to create project`);
            }
          } else {
            // 否则退出脚手架
            throw new Error(`Failed to create project`);
          }
        }
      }
    } else {
      // 没有则创建名为 projectName 的目录，并将此目录作为项目目录
      fse.ensureDirSync(this.projectPath);
    }
    return await this.getProjectInfo();
  }
  isDirEmpty(dirPath) {
    let fileList = fs.readdirSync(dirPath);
    return fileList.length === 0;
  }
  async getProjectInfo() {
    // 收集所创建的项目的信息
    const projectInfo = {};

    // 1. 让用户选择是创建项目还是组件
    const { type } = await inquirer.prompt([
      {
        type: "list",
        name: "type",
        default: TYPE_PROJECT,
        message: `请选择创建项目还是组件`,
        choices: [
          {
            name: "项目",
            value: TYPE_PROJECT,
          },
          {
            name: "组件",
            value: TYPE_COMPONENT,
          },
        ],
      },
    ]);
    // 2. 根据选择过滤出项目或组件模板
    this.templateList = this.templateList.filter((t) => t.tag.includes(type));

    // 3. 选择项目或组件的版本和模板
    const { version, projectTemplate } = await inquirer.prompt([
      {
        type: "input",
        name: "version",
        default: "1.0.0",
        message: `请输入项目版本号`,
        validate: function (value) {
          // 使用semver校验用户是否输入了合法的版本号，是则返回解析后的版本号否则返回null所以需要使用!!做隐式转换为布尔值
          const done = this.async();
          if (!!semver.valid(value)) {
            done(null, true); // 满足条件时推出validate函数，并将value值向下传递
          } else {
            done("please enter a valid version, such as 0.0.1 or v0.0.1"); // 不满足条件则做出提示，继续让用户输入
            return;
          }
        },
        filter: function (value) {
          return semver.valid(value) || value;
        },
      },
      {
        type: "list",
        name: "projectTemplate",
        message: "请选择创建项目的模板",
        choices: this.createTemplateChoices(),
      },
    ]);
    projectInfo.type = type;
    projectInfo.version = version;
    projectInfo.projectTemplate = projectTemplate;

    // 将首字母大写、驼峰、-连接符写法的项目名称统一转为-连接符写法，为什么？
    // 项目名称会通过ejs生成到模板的文件中，如package.json的name属性，那又怎么样？package.json有规定name的格式吗？
    let kebabName = require("kebab-case")(this.projectName);
    if (kebabName.startsWith("-")) kebabName = kebabName.replace("-", "");
    projectInfo.className = kebabName;

    // 3. 根据选择执行不同的流程
    if (type === TYPE_COMPONENT) {
      const { descriptionPrompt } = await inquirer.prompt([
        {
          type: "input",
          name: "descriptionPrompt",
          default: "",
          message: `请为组件输入描述信息，1-20个字符`,
          validate: function (value) {
            const done = this.async();
            if (
              typeof value === "string" &&
              value.length > 0 &&
              value.length <= 20
            ) {
              done(null, true); // 满足条件时推出validate函数，并将value值向下传递
            } else {
              done("请为组件输入描述信息，1-20个字符"); // 不满足条件则做出提示，继续让用户输入
              return;
            }
          },
        },
      ]);
      projectInfo.descriptionPrompt = descriptionPrompt;
    }
    return projectInfo;
  }
  async downloadTemplate() {
    // 1. 将模板下载到缓存目录
    const templatePackage = new Package({
      targetPath: path.resolve(userHome, ".febutler", "template"),
      storeDir: path.resolve(userHome, ".febutler", "template", "node_modules"),
      packageName: this.projectInfo.projectTemplate.packageName,
      packageVersion: this.projectInfo.projectTemplate.version,
    });

    if (await templatePackage.exists()) {
      const updateSpinner = spinnerStart("template Updating");
      try {
        await templatePackage.update();
        log.success("缓存模板更新成功！");
        this.templatePackage = templatePackage;
      } catch (error) {
        throw new Error(error);
      } finally {
        updateSpinner.stop(true);
      }
    } else {
      const installSpinner = spinnerStart("template Installing");
      try {
        await templatePackage.install();
        log.success("模板下载成功！");
        this.templatePackage = templatePackage;
      } catch (error) {
        throw new Error(error);
      } finally {
        installSpinner.stop(true);
      }
    }

    // TODO: 模板更新下，loading不会消失
    // TODO: 在version设置为'^1.0.0'时，使用npmInstall创建的项目目录名为1.0.0导致 Package.exists()方法匹配不到已下载的目录
  }
  createTemplateChoices() {
    return this.templateList.map((t) => {
      return {
        name: t.name,
        value: t,
      };
    });
  }
  async installTemplate() {
    if (!this.projectInfo.projectTemplate)
      throw new Error("The template you selected does not exist!");
    if (!this.projectInfo.projectTemplate.type)
      throw new Error("The template you selected does not have a type field!");

    // 安装模板
    if (this.projectInfo.projectTemplate.type === TEMPLATE_TYPE_NORMAL) {
      // 标准安装
      await this.installNormalTemplate();
    } else if (this.projectInfo.projectTemplate.type === TEMPLATE_TYPE_CUSTOM) {
      // 自定义安装
      await this.installCustomTemplate();
    } else {
      throw new Error("The type of template you selected does not exist!");
    }
  }
  async installNormalTemplate() {
    // 1. 将缓存的模板安装到项目目录
    const spinner = spinnerStart("template Installing");
    try {
      // 获取选择的模板的缓存路径，加 template 是因为实际模板是在 template目录中
      const templateCachePath = path.resolve(
        this.templatePackage.cacheFilePath,
        "template"
      );
      fse.ensureDirSync(templateCachePath);
      fse.copySync(templateCachePath, this.projectPath);
      log.success("项目初始化成功！");
    } catch (error) {
      throw new Error(error);
    } finally {
      spinner.stop(true);
    }

    // 2. 使用ejs
    const ignoreFiles = [
      "**/node_nodules/**",
      ...(this.projectInfo.projectTemplate.ignore || []),
    ];
    const { version, className } = this.projectInfo;
    await this.ejsRender({
      ignore: ignoreFiles,
      renderFields: { version, className },
    });

    // 3. 安装项目依赖
    const { installCmd, startCmd } = this.projectInfo.projectTemplate;
    if (installCmd) {
      const installCmdArray = installCmd.split(" ");
      const cmd = installCmdArray[0];
      const args = installCmdArray.slice(1);
      const installRet = await spawnExecAsync(cmd, args, {
        stdio: "inherit",
        cwd: this.projectPath,
      });
      if (!installRet === 0)
        throw new Error(
          "failed to install the dependencies. Please try to install manually"
        );
    } else {
      throw new Error(
        "The project template has not predefined install command, failed to install automatically. Please try to install manually"
      );
    }

    // 4. 运行项目
    if (startCmd) {
      const startCmdArray = startCmd.split(" ");
      const cmd = startCmdArray[0];
      const args = startCmdArray.slice(1);
      const startRet = await spawnExecAsync(cmd, args, {
        stdio: "inherit",
        cwd: this.projectPath,
      });
      if (!startRet === 0)
        throw new Error(
          "failed to start the project. Please try to start manually"
        );
    } else {
      throw new Error(
        "The project template has not predefined start command, failed to start automatically. Please try to start manually"
      );
    }
  }
  async installCustomTemplate() {
    if (await this.templatePackage.exists()) {
      const rootFile = this.templatePackage.getRootFilePath();
      if (fs.existsSync(rootFile)) {
        log.notice("开始执行自定义模板");
        const templateCachePath = path.resolve(
          this.templatePackage.cacheFilePath,
          "template"
        );
        const options = {
          projectInfo: this.projectInfo,
          sourcePath: templateCachePath,
          targetPath: this.projectPath,
        };
        const code = `require('${rootFile}')(${JSON.stringify(options)})`;
        log.verbose("code", code);
        await execAsync("node", ["-e", code], {
          stdio: "inherit",
          cwd: process.cwd(),
        });
        log.success("自定义模板安装成功");
      } else {
        throw new Error("自定义模板入口文件不存在");
      }
    }
    // const spinner = spinnerStart('template Installing')
    // try {
    //   // 获取选择的模板的缓存路径，加 template 是因为实际模板是在 template目录中
    //   const templateCachePath = path.resolve(this.templatePackage.cacheFilePath, 'template')
    //   fse.ensureDirSync(templateCachePath)
    //   fse.copySync(templateCachePath, this.projectPath);
    //   log.success('模板安装成功！');
    // } catch (error) {
    //   throw new Error(error);
    // } finally {
    //   spinner.stop(true);
    // }
  }
  ejsRender(options) {
    return new Promise((resolve, reject) => {
      require("glob")(
        "**",
        {
          cwd: this.projectPath,
          ignore: options.ignore || "",
          nodir: true,
        },
        (err, files) => {
          if (err) reject(err);
          Promise.all(
            files.map((file) => {
              const filePath = path.join(this.projectPath, file);

              return new Promise((resolve1, reject1) => {
                ejs.renderFile(
                  filePath,
                  options.renderFields,
                  {},
                  (err, res) => {
                    if (err) reject1(err);
                    resolve1({ res, filePath });
                  }
                );
              });
            })
          )
            .then((res) => {
              // 将渲染结果覆盖原文件
              res.forEach(({ filePath, res }) => {
                fse.writeFileSync(filePath, res);
              });
              resolve(res);
            })
            .catch((err) => {
              reject(err);
            });
        }
      );
    });
  }
}

function init(argv) {
  log.verbose("init command argv: " + argv);
  return new InitCommand(argv);
  // 为什么新建子类实例时传入的参数可以被父类直接拿到，不用像java一样在子类中传入父类的 constructor ??
  // 在新建子类实例时父类的 constructor 相当于在子类中 constructor 之前执行一遍，作用域是子类，所以可以拿到
}

module.exports = init;
