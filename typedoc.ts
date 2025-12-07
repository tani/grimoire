import * as td from "typedoc";

export interface TypeDocConfig<A, B> {
  prehook: () => Promise<A>;
  createCliArgs: (state: A) => string[];
  posthook: (state: A) => Promise<B>;
}

export async function typedoc<A, B>(config: TypeDocConfig<A, B>): Promise<B> {
  const state = await config.prehook();
  const cliArgs = config.createCliArgs(state);
  const app = await td.Application.bootstrapWithPlugins({ lang: "en" }, [
    new td.ArgumentsReader(0, cliArgs),
    new td.TypeDocReader(),
    new td.PackageJsonReader(),
    new td.TSConfigReader(),
    new td.ArgumentsReader(300, cliArgs).ignoreErrors(),
  ]);
  app.options.setValue("disableGit", true);
  app.options.setValue("sourceLinkTemplate", true);
  const exitCode = await runTypeDocApp(app);
  if (exitCode !== ExitCodes.Ok) {
    throw new Error(`typedoc failed with exit code ${exitCode}`);
  }
  return await config.posthook(state);
}

const ExitCodes = {
  Ok: 0,
  CompileError: 3,
  ValidationError: 4,
  OutputError: 5,
} as const;

async function runTypeDocApp(app: td.Application): Promise<number> {
  const project = await app.convert();
  if (!project) {
    return ExitCodes.CompileError;
  }

  app.validate(project);

  if (app.logger.hasErrors()) {
    return ExitCodes.ValidationError;
  }

  await app.generateOutputs(project);

  if (app.logger.hasErrors()) {
    return ExitCodes.OutputError;
  }

  return ExitCodes.Ok;
}
