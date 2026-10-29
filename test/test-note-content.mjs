import assert from "node:assert/strict";
import esbuild from "esbuild";

await esbuild.build({
	bundle: true,
	entryPoints: ["src/note-content.ts"],
	format: "esm",
	outfile: "test/.tmp-note-content-test.mjs",
	platform: "node",
	target: "node20"
});

const { prepareNoteContentForLark } = await import("./.tmp-note-content-test.mjs");

const file = { basename: "File Name Title" };

assert.equal(
	prepareNoteContentForLark(file, "# Markdown Title\n\nBody", "file-name"),
	"# File Name Title\n\n# Markdown Title\n\nBody"
);

assert.equal(
	prepareNoteContentForLark(file, "# Markdown Title\n\nBody", "first-heading"),
	"# Markdown Title\n\n# Markdown Title\n\nBody"
);

assert.equal(
	prepareNoteContentForLark(file, "Body", "file-name"),
	"# File Name Title\n\nBody"
);

assert.equal(
	prepareNoteContentForLark(file, "Body", "first-heading"),
	"# File Name Title\n\nBody"
);

const htmlListTable = [
	"| 方案 | 做法 | 优点 |",
	"| --- | --- | --- |",
	"| **推荐** | <ul><li>查询 **模式**</li><li>[调用](https://example.com) 与 `OPT`</li></ul> | <ul><li>保留<br>换行</li></ul> |"
].join("\n");
const compatibleTable = [
	"| 方案 | 做法 | 优点 |",
	"| --- | --- | --- |",
	"| **推荐** | • 查询 **模式**<br>• [调用](https://example.com) 与 `OPT` | • 保留<br>换行 |"
].join("\n");
assert.equal(
	prepareNoteContentForLark(file, htmlListTable, "file-name"),
	`# File Name Title\n\n${compatibleTable}`
);
assert.equal(
	prepareNoteContentForLark(file, compatibleTable, "file-name"),
	`# File Name Title\n\n${compatibleTable}`
);

const unchangedContent = [
	"",
	"<ul><li>表格外列表</li></ul>",
	"| 普通 | 表格 |\n| --- | --- |\n| A | B<br>C |",
	"| 代码 |\n| --- |\n| `<ul><li>字面量</li></ul>` |",
	"| 代码 |\n| --- |\n| ``<ul><li>`字面量`</li></ul>`` |",
	"| 嵌套 |\n| --- |\n| <ul><li>父<ul><li>子</li></ul></li></ul> |",
	"| 不完整 |\n| --- |\n| <ul><li>未闭合 |",
	"| 转义 |\n| --- |\n| \\<ul><li>字面量</li></ul> |",
	"    | 缩进代码 |\n    | --- |\n    | <ul><li>字面量</li></ul> |",
	...['```', '~~~', '````'].map((fence) => `${fence}md\n${htmlListTable}\n${fence}`)
];
for (const content of unchangedContent) {
	assert.equal(prepareNoteContentForLark(file, content, "file-name"), `# File Name Title\n\n${content}`);
}
assert.equal(
	prepareNoteContentForLark(file, `${htmlListTable}\r\n`, "file-name"),
	`# File Name Title\n\n${compatibleTable}\r\n`
);

console.log("note content tests passed");
