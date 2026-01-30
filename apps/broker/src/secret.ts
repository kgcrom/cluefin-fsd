interface PutSecretTokenOptions {
  storeId: string;
  name: string;
  value: string;
  remote?: boolean;
}

export async function putSecretToken({
  storeId,
  name,
  value,
  remote,
}: PutSecretTokenOptions): Promise<void> {
  const args = [
    "bunx",
    "wrangler",
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

  const proc = Bun.spawn(args, {
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;
  const stderr = await new Response(proc.stderr).text();

  if (exitCode !== 0) {
    throw new Error(
      `wrangler secrets-store secret create failed (exit ${exitCode}): ${stderr}`,
    );
  }
}
