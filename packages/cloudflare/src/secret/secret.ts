interface PutSecretTokenOptions {
  storeId: string;
  name: string;
  value: string;
  remote?: boolean;
}

interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

async function runWrangler(args: string[]): Promise<RunResult> {
  const proc = Bun.spawn(["bunx", "wrangler", ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  return { exitCode, stdout, stderr };
}

async function listStores(remote?: boolean): Promise<string> {
  const args = ["secrets-store", "store", "list"];
  if (remote) args.push("--remote");

  const result = await runWrangler(args);
  if (result.exitCode !== 0) {
    throw new Error(
      `wrangler secrets-store store list failed (exit ${result.exitCode}): ${result.stderr}`,
    );
  }
  return result.stdout;
}

async function deleteStore(
  storeId: string,
  remote?: boolean,
): Promise<void> {
  const args = ["secrets-store", "store", "delete", storeId];
  if (remote) args.push("--remote");

  const result = await runWrangler(args);
  if (result.exitCode !== 0) {
    throw new Error(
      `wrangler secrets-store store delete failed (exit ${result.exitCode}): ${result.stderr}`,
    );
  }
}

export async function putSecretToken({
  storeId,
  name,
  value,
  remote,
}: PutSecretTokenOptions): Promise<void> {
  const storeListOutput = await listStores(remote);

  if (storeListOutput.includes(storeId)) {
    await deleteStore(storeId, remote);
  }

  const args = [
    "secrets-store",
    "secret",
    "create",
    storeId,
    "--name",
    name,
    "--scopes",
    "workers",
    "--value",
    value,
  ];

  if (remote) {
    args.push("--remote");
  }

  const result = await runWrangler(args);
  if (result.exitCode !== 0) {
    throw new Error(
      `wrangler secrets-store secret create failed (exit ${result.exitCode}): ${result.stderr}`,
    );
  }
}
