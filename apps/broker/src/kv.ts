interface PutKvTokenOptions {
  namespaceId: string;
  key: string;
  value: unknown;
}

export async function putKvToken({
  namespaceId,
  key,
  value,
}: PutKvTokenOptions): Promise<void> {
  const proc = Bun.spawn(
    [
      "npx",
      "wrangler",
      "kv:key",
      "put",
      key,
      JSON.stringify(value),
      "--namespace-id",
      namespaceId,
    ],
    {
      stdout: "pipe",
      stderr: "pipe",
    },
  );

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`wrangler kv:key put failed (exit ${exitCode}): ${stderr}`);
  }
}
