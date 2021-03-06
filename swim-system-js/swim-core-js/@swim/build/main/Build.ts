// Copyright 2015-2020 Swim inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as path from "path";
import * as ts from "typescript";
import * as rollup from "rollup";

import {OutputSettings, OutputStyle, Unicode} from "@swim/codec";
import {ProjectConfig, Project} from "./Project";
import {Target} from "./Target";

export interface BuildConfig {
  version?: string;
  projects: ProjectConfig[];
  devel?: boolean;
  tests?: string;
  compilerOptions?: ts.CompilerOptions;
  gaID?: string;
}

export class Build {
  readonly baseDir: string;
  readonly version: string | undefined;
  readonly projects: {[id: string]: Project | undefined};
  readonly projectList: Project[];
  readonly compilerOptions: ts.CompilerOptions;
  readonly gaID: string | undefined;

  constructor(config: BuildConfig) {
    this.baseDir = process.cwd();
    this.version = config.version;
    this.projects = {};
    this.projectList = [];
    this.compilerOptions = config.compilerOptions || {};
    this.gaID = config.gaID;

    for (let i = 0; i < config.projects.length; i += 1) {
      const projectConfig = config.projects[i];
      if (config.devel !== void 0) {
        projectConfig.devel = config.devel;
      }
      if (config.tests !== void 0) {
        projectConfig.tests = config.tests;
      }
      const project = new Project(this, projectConfig);
      this.projects[project.id] = project;
      this.projectList.push(project);
    }

    for (let i = 0; i < config.projects.length; i += 1) {
      const projectConfig = config.projects[i];
      const project = this.projects[projectConfig.id]!;
      project.initTargets(projectConfig);
    }

    for (let i = 0; i < config.projects.length; i += 1) {
      const projectConfig = config.projects[i];
      const project = this.projects[projectConfig.id]!;
      project.initDeps(projectConfig);
    }
  }

  initBundle(i: number = 0): Promise<unknown> {
    if (i < this.projectList.length) {
      const project = this.projectList[i];
      return project.initBundle().then(this.initBundle.bind(this, i + 1));
    } else {
      return Promise.resolve(void 0);
    }
  }

  init(): Promise<Build> {
    return this.initBundle().then(() => {
      return this;
    });
  }

  transitiveProjects(specifiers: string[] | string | undefined, targetId: string | undefined): Project[] {
    if (specifiers === void 0) {
      specifiers = Object.keys(this.projects);
    } else if (typeof specifiers === "string") {
      specifiers = specifiers.split(",");
    }
    let projects: Project[] = [];
    for (let i = 0; i < specifiers.length; i += 1) {
      const projectId = specifiers[i];
      const project = this.projects[projectId];
      if (project !== void 0) {
        if (targetId !== void 0) {
          const target = project.targets[targetId];
          if (target !== void 0) {
            projects = target.transitiveProjects(projects);
          }
        } else {
          for (let j = 0; j < project.targetList.length; j += 1) {
            const target = project.targetList[j];
            projects = target.transitiveProjects(projects);
          }
        }
      } else {
        const output = Unicode.stringOutput(OutputSettings.styled());
        OutputStyle.redBold(output);
        output.write("unknown project");
        OutputStyle.reset(output);
        output.write(" ");
        OutputStyle.yellow(output);
        output.write(projectId);
        OutputStyle.reset(output);
        console.log(output.bind());
      }
    }
    return projects;
  }

  targets(specifiers: string[] | string | undefined): Target[] {
    if (specifiers === void 0) {
      specifiers = Object.keys(this.projects);
    } else if (typeof specifiers === "string") {
      specifiers = specifiers.split(",");
    }
    const targets: Target[] = [];
    for (let i = 0; i < specifiers.length; i += 1) {
      const specifier = specifiers[i];
      const [projectId, targetId] = specifier.split(":");
      if (projectId !== void 0) { // <project>(:<target>)?
        const project = this.projects[projectId];
        if (project !== void 0) {
          if (targetId !== void 0) { // <project>:<target>
            const target = project.targets[targetId];
            if (target !== void 0) {
              target.selected = true;
              if (targets.indexOf(target) < 0) {
                targets.push(target);
              }
            }
          } else { // <project>(:?)
            for (let j = 0; j < project.targetList.length; j += 1) {
              const target = project.targetList[j];
              target.selected = true;
              if (targets.indexOf(target) < 0) {
                targets.push(target);
              }
            }
          }
        } else {
          const output = Unicode.stringOutput(OutputSettings.styled());
          OutputStyle.redBold(output);
          output.write("unknown project");
          OutputStyle.reset(output);
          output.write(" ");
          OutputStyle.yellow(output);
          output.write(projectId);
          OutputStyle.reset(output);
          console.log(output.bind());
        }
      } else if (targetId !== void 0) { // :<target>
        for (let j = 0; j < this.projectList.length; j += 1) {
          const target = this.projectList[j].targets[targetId];
          if (target !== void 0) {
            target.selected = true;
            if (targets.indexOf(target) < 0) {
              targets.push(target);
            }
          }
        }
      }
    }
    return targets;
  }

  transitiveTargets(specifiers: string[] | string | undefined): Target[] {
    if (specifiers === void 0) {
      specifiers = Object.keys(this.projects);
    } else if (typeof specifiers === "string") {
      specifiers = specifiers.split(",");
    }
    let targets: Target[] = [];
    for (let i = 0; i < specifiers.length; i += 1) {
      const specifier = specifiers[i];
      const [projectId, targetId] = specifier.split(":");
      if (projectId !== void 0) { // <project>(:<target>)?
        const project = this.projects[projectId];
        if (project !== void 0) {
          if (targetId !== void 0) { // <project>:<target>
            const target = project.targets[targetId];
            if (target !== void 0) {
              target.selected = true;
              targets = target.transitiveTargets(targets);
            }
          } else { // <project>(:?)
            for (let j = 0; j < project.targetList.length; j += 1) {
              const target = project.targetList[j];
              target.selected = true;
              targets = target.transitiveTargets(targets);
            }
          }
        } else {
          const output = Unicode.stringOutput(OutputSettings.styled());
          OutputStyle.redBold(output);
          output.write("unknown project");
          OutputStyle.reset(output);
          output.write(" ");
          OutputStyle.yellow(output);
          output.write(projectId);
          OutputStyle.reset(output);
          console.log(output.bind());
        }
      } else if (targetId !== void 0) { // :<target>
        for (let j = 0; j < this.projectList.length; j += 1) {
          const target = this.projectList[j].targets[targetId];
          if (target !== void 0) {
            target.selected = true;
            targets = target.transitiveTargets(targets);
          }
        }
      }
    }
    return targets;
  }

  forEachProject(specifiers: string[] | string | undefined,
                 callback: (project: Project) => Promise<unknown> | void,
                 i: number = 0): Promise<unknown> {
    if (specifiers === void 0) {
      specifiers = Object.keys(this.projects);
    } else if (typeof specifiers === "string") {
      specifiers = specifiers.split(",");
    }
    if (i < specifiers.length) {
      const specifier = specifiers[i];
      const [projectId] = specifier.split(":");
      const project = this.projects[projectId];
      if (project !== void 0) {
        const result = callback(project);
        if (result !== void 0) {
          return result.then(this.forEachProject.bind(this, specifiers, callback, i + 1));
        }
      } else {
        const output = Unicode.stringOutput(OutputSettings.styled());
        OutputStyle.redBold(output);
        output.write("unknown project");
        OutputStyle.reset(output);
        output.write(" ");
        OutputStyle.yellow(output);
        output.write(projectId);
        OutputStyle.reset(output);
        console.log(output.bind());
      }
      return Promise.resolve(void 0).then(this.forEachProject.bind(this, specifiers, callback, i + 1));
    } else {
      return Promise.resolve(void 0);
    }
  }

  forEachTransitiveProject(projects: Project[] | string | undefined,
                           callback: (project: Project) => Promise<unknown> | void,
                           targetId: string | undefined,
                           i: number = 0): Promise<unknown> {
    if (!Array.isArray(projects)) {
      projects = this.transitiveProjects(projects, targetId);
    }
    if (i < projects.length) {
      const project = projects[i];
      const result = callback(project);
      if (result !== void 0) {
        return result.then(this.forEachTransitiveProject.bind(this, projects, callback, targetId, i + 1));
      } else {
        return Promise.resolve(void 0).then(this.forEachTransitiveProject.bind(this, projects, callback, targetId, i + 1));
      }
    } else {
      return Promise.resolve(void 0);
    }
  }

  forEachTarget(targets: Target[] | string | undefined,
                callback: (target: Target) => Promise<unknown> | void,
                i: number = 0): Promise<unknown> {
    if (!Array.isArray(targets)) {
      targets = this.targets(targets);
    }
    if (i < targets.length) {
      const target = targets[i];
      const result = callback(target);
      if (result !== void 0) {
        return result.then(this.forEachTransitiveTarget.bind(this, targets, callback, i + 1));
      } else {
        return Promise.resolve(void 0).then(this.forEachTransitiveTarget.bind(this, targets, callback, i + 1));
      }
    } else {
      return Promise.resolve(void 0);
    }
  }

  forEachTransitiveTarget(targets: Target[] | string | undefined,
                          callback: (target: Target) => Promise<unknown> | void,
                          i: number = 0): Promise<unknown> {
    if (!Array.isArray(targets)) {
      targets = this.transitiveTargets(targets);
    }
    if (i < targets.length) {
      const target = targets[i];
      const result = callback(target);
      if (result !== void 0) {
        return result.then(this.forEachTransitiveTarget.bind(this, targets, callback, i + 1));
      } else {
        return Promise.resolve(void 0).then(this.forEachTransitiveTarget.bind(this, targets, callback, i + 1));
      }
    } else {
      return Promise.resolve(void 0);
    }
  }

  printProjects(): void {
    const output = Unicode.stringOutput(OutputSettings.styled());
    OutputStyle.greenBold(output);
    output.write("projects");
    OutputStyle.reset(output);
    console.log(output.bind());
    for (let i = 0; i < this.projectList.length; i += 1) {
      const project = this.projectList[i];
      const output = Unicode.stringOutput(OutputSettings.styled());
      output.write(" - ");
      OutputStyle.yellow(output);
      output.write(project.id);
      OutputStyle.reset(output);
      console.log(output.bind());
    }
  }

  printTargets(targets: Target[] | string | undefined): void {
    if (!Array.isArray(targets)) {
      targets = this.transitiveTargets(targets);
    }
    const output = Unicode.stringOutput(OutputSettings.styled());
    OutputStyle.greenBold(output);
    output.write("targets");
    OutputStyle.reset(output);
    console.log(output.bind());
    for (let i = 0; i < targets.length; i += 1) {
      const target = targets[i];
      const output = Unicode.stringOutput(OutputSettings.styled());
      output.write(" - ");
      if (target.selected) {
        OutputStyle.yellow(output);
      }
      output.write(target.uid);
      if (target.selected) {
        OutputStyle.reset(output);
      }
      console.log(output.bind());
    }
  }

  static importScript(scriptFile: string): Promise<unknown> {
    return rollup
      .rollup({
        input: scriptFile,
        external: function (id: string): boolean {
          return id[0] !== "." && !path.isAbsolute(id) || id.slice(-5, id.length) === ".json";
        },
        onwarn(warning: rollup.RollupWarning, warn?: any): void {
          if (warning.code === "MIXED_EXPORTS") {
            return; // suppress
          }
          warn(warning);
        },
      })
      .then((build: rollup.RollupBuild): Promise<rollup.RollupOutput> => {
        return build.generate({
          format: "cjs",
        });
      })
      .then((bundle: rollup.RollupOutput): Promise<unknown> => {
        // temporarily override require to inject config script
        const defaultLoader = require.extensions[".js"];
        require.extensions[".js"] = function (module: NodeModule, fileName: string): void {
          if (fileName === scriptFile) {
            (module as { _compile?: any })._compile(bundle.output[0].code, fileName);
          } else {
            defaultLoader(module, fileName);
          }
        };

        delete require.cache[scriptFile];
        const config = require(scriptFile);
        require.extensions[".js"] = defaultLoader;
        return config;
      });
  }

  static load(configFile: string, devel?: boolean, tests?: string): Promise<Build> {
    configFile = path.resolve(process.cwd(), configFile);
    return Build.importScript(configFile)
      .then((config: any): Promise<Build> => {
        if (devel !== void 0) {
          config.devel = devel;
        }
        if (tests !== void 0) {
          config.tests = tests;
        }
        return new Build(config).init();
      });
  }
}
