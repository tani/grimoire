import * as typedoc from "typedoc";

export async function execTypeDoc(...args: string[]): Promise<void> {
    const app = await typedoc.Application.bootstrapWithPlugins({}, [
        new typedoc.ArgumentsReader(0, args),
        new typedoc.TypeDocReader(),
        new typedoc.PackageJsonReader(),
        new typedoc.TSConfigReader(),
        new typedoc.ArgumentsReader(300, args).ignoreErrors(),
    ]);

    const exitCode = await runTypeDocApp(app);

    if (exitCode !== ExitCodes.Ok && exitCode !== ExitCodes.Watching) {
        throw new Error(`TypeDoc failed with exit code ${exitCode}`);
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

async function runTypeDocApp(app: typedoc.Application): Promise<number> {
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

    if (app.options.getValue("treatWarningsAsErrors") && app.logger.hasWarnings()) {
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

    if (app.options.getValue("treatWarningsAsErrors") && app.logger.hasWarnings()) {
        return ExitCodes.CompileError;
    }

    const preValidationWarnCount = app.logger.warningCount;
    app.validate(project);

    const hadValidationWarnings =
        app.logger.warningCount !== preValidationWarnCount || app.logger.validationWarningCount !== 0;
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

        if (app.options.getValue("treatWarningsAsErrors") && app.logger.hasWarnings()) {
            return ExitCodes.OutputError;
        }
    }

    return ExitCodes.Ok;
}
