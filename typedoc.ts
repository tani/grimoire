import * as td from "typedoc";
import mock from "mock-fs";

export interface TypeDocConfig<A, B> {
  prehook: () => Promise<A>;
  createCliArgs: (state: A) => string[];
  posthook: (state: A) => Promise<B>;
}

export async function typedoc<A, B>(config: TypeDocConfig<A, B>): Promise<B> {
  try {
    mock({
      'node_modules': mock.load("./node_modules")
    });
    const state = await config.prehook();
    const cliArgs = config.createCliArgs(state);
    const app = await td.Application.bootstrapWithPlugins({}, [
      new td.ArgumentsReader(0, cliArgs),
      new td.TypeDocReader(),
      new td.PackageJsonReader(),
      new td.TSConfigReader(),
      new td.ArgumentsReader(300, cliArgs).ignoreErrors(),
    ]);
    const exitCode = await runTypeDocApp(app);
    if (exitCode !== ExitCodes.Ok && exitCode !== ExitCodes.Watching) {
      throw new Error(`typedoc failed with exit code ${exitCode}`);
    }
    return await config.posthook(state);
  } finally {
    mock.restore();
  }
}

const ExitCodes = {
  Ok: 0,
  OptionError: 1,
  CompileError: 3,
  ValidationError: 4,
  OutputError: 5,
  ExceptionThrown: 6,
  Watching: 7,
} as const;

async function runTypeDocApp(app: td.Application): Promise<number> {
  if (app.options.getValue("version")) {
    console.log(app.toString());
    return ExitCodes.Ok;
  }

  if (app.options.getValue("help")) {
    console.log(app.options.getHelp());
    return ExitCodes.Ok;
  }

  if (app.options.getValue("showConfig")) {
    console.log(app.options.getRawValues());
    return ExitCodes.Ok;
  }

  if (app.logger.hasErrors()) {
    return ExitCodes.OptionError;
  }

  if (
    app.options.getValue("treatWarningsAsErrors") && app.logger.hasWarnings()
  ) {
    return ExitCodes.OptionError;
  }

  if (app.options.getValue("watch")) {
    const continueWatching = await app.convertAndWatch(async (project) => {
      app.validate(project);
      await app.generateOutputs(project);
    });

    return continueWatching ? ExitCodes.Watching : ExitCodes.OptionError;
  }

  const project = await app.convert();
  if (!project) {
    return ExitCodes.CompileError;
  }

  if (
    app.options.getValue("treatWarningsAsErrors") && app.logger.hasWarnings()
  ) {
    return ExitCodes.CompileError;
  }

  const preValidationWarnCount = app.logger.warningCount;
  app.validate(project);

  const hadValidationWarnings =
    app.logger.warningCount !== preValidationWarnCount ||
    app.logger.validationWarningCount !== 0;
  if (app.logger.hasErrors()) {
    return ExitCodes.ValidationError;
  }

  if (
    hadValidationWarnings &&
    (app.options.getValue("treatWarningsAsErrors") ||
      app.options.getValue("treatValidationWarningsAsErrors"))
  ) {
    return ExitCodes.ValidationError;
  }

  if (app.options.getValue("emit") !== "none") {
    await app.generateOutputs(project);

    if (app.logger.hasErrors()) {
      return ExitCodes.OutputError;
    }

    if (
      app.options.getValue("treatWarningsAsErrors") && app.logger.hasWarnings()
    ) {
      return ExitCodes.OutputError;
    }
  }

  return ExitCodes.Ok;
}
