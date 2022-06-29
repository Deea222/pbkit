import { Command } from "https://deno.land/x/cliffy@v0.19.5/command/mod.ts";
import { createLoader } from "../../../../../../core/loader/deno-fs.ts";
import { build } from "../../../../../../core/schema/builder.ts";
import save from "../../../../../../codegen/save.ts";
import gen, { ServiceType } from "../../../../../../codegen/swift/index.ts";
import { getVendorDir } from "../../../../config.ts";
import expandEntryPaths from "../../expandEntryPaths.ts";

interface Options {
  entryPath?: string[];
  protoPath?: string[];
  messagesDir: string;
  servicesDir: string;
  grpcService?: boolean;
  wrpService?: boolean;
  outDir: string;
}

export default new Command()
  .arguments("[proto-files...:string]")
  .option(
    "--entry-path <dir:string>",
    "Specify the directory containing entry proto files.",
    { collect: true },
  )
  .option(
    "--proto-path <dir:string>",
    "Specify the directory in which to search for imports.",
    { collect: true },
  )
  .option(
    "--messages-dir <dir:string>",
    "Out directory for messages.",
    { default: "messages" },
  )
  .option(
    "--services-dir <dir:string>",
    "Out directory for services.",
    { default: "services" },
  )
  .option(
    "-o, --out-dir <value:string>",
    "Out directory",
    { default: "out" },
  )
  .option(
    "--grpc-service",
    "Generate gRPC service codes.",
  )
  .option(
    "--wrp-service",
    "Generate service codes for wrp (webview/worker request protocol)",
  )
  .description("Generate swift library which is dependent on SwiftProtobuf.")
  .action(async (options: Options, protoFiles: string[] = []) => {
    const entryPaths = options.entryPath ?? [];
    const protoPaths = options.protoPath ?? [];
    const roots = [...entryPaths, ...protoPaths, Deno.cwd(), getVendorDir()];
    const loader = createLoader({ roots });
    const files = [
      ...await expandEntryPaths(entryPaths),
      ...protoFiles,
    ];
    const schema = await build({ loader, files });
    const serviceType = (() => {
      const types: ServiceType[] = [];
      if (options.grpcService) types.push("grpc");
      if (options.wrpService) types.push("wrp");
      return types;
    })();
    await save(
      options.outDir,
      gen(schema, {
        messages: { outDir: options.messagesDir.trim() },
        services: {
          outDir: options.servicesDir.trim(),
          genTypes: serviceType,
        },
      }),
    );
  });
