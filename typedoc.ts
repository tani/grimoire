import * as td from "typedoc";
import mock from "mock-fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

export interface TypeDocConfig<A, B> {
  prehook: () => Promise<A>;
  createCliArgs: (state: A) => string[];
  posthook: (state: A) => Promise<B>;
}

export async function typedoc<A, B>(config: TypeDocConfig<A, B>): Promise<B> {
  try {
    mock({
      "node_modules/typedoc/dist": mock.load(path.dirname(require.resolve("typedoc"))),
      "node_modules/typedoc/static": mock.load(path.resolve(path.dirname(require.resolve("typedoc")), "../static/")),
      "node_modules/@gerrit0/mini-shiki/dist": mock.load(path.dirname(require.resolve("@gerrit0/mini-shiki"))),
      "node_modules/@shikijs/themes/dist": mock.load(path.dirname(require.resolve("@shikijs/themes"))),
      "node_modules/@shikijs/langs/dist": mock.load(path.dirname(require.resolve("@shikijs/langs")))
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
    if (exitCode !== ExitCodes.Ok) {
      throw new Error(`typedoc failed with exit code ${exitCode}`);
    }
    return await config.posthook(state);
  } finally {
    mock.restore();
  }
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
