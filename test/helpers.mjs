import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function makeCatalog() {
  const root = mkdtempSync(join(tmpdir(), "arckit-catalog-"));

  writeSkill(root, "entry/using-arckit", "using-arckit", "状态驱动入口");
  writeSkill(root, "definition/arckit-spec", "arckit-spec", "需求规格");
  writeSkill(root, "definition/arckit-tech", "arckit-tech", "技术方案");
  writeSkill(root, "code/demo-code", "demo-code", "示例代码");

  const shared = join(root, "definition", "_arckit_shared");
  mkdirSync(shared, { recursive: true });
  writeFileSync(join(shared, "content-spec.md"), "# 共享规范\n");
  writeFileSync(
    join(root, "definition", "arckit-spec", "SKILL.md"),
    "---\nname: arckit-spec\ndescription: 需求规格\n---\n\n完整规范见 [内容规范](../_arckit_shared/content-spec.md)。\n",
  );

  return root;
}

function writeSkill(root, relative, name, description) {
  const dir = join(root, ...relative.split("/"));
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "SKILL.md"),
    `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n`,
  );
}

export function makeTempDir(prefix = "arckit-target-") {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function cleanup(...dirs) {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
}
