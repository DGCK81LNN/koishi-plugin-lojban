# koishi-plugin-lojban

[![npm](https://img.shields.io/npm/v/koishi-plugin-lojban?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-lojban)

逻辑语工具


## 指令

以下指令均注册为 `lojban` 的层级式子指令。

- `lujvo <input...>`：复合词合成/分解

  输入一个 *lujvo* 来分解；输入空格分隔的若干个 *gismu*、*cmavo* 或 *rafsi*（开头和/或末尾须加横杠）来合成 *lujvo*。输入单个 *gismu*、*cmavo* 或 *rafsi* 可查询 *rafsi* 信息。

- `jboski <input...>`：*jbofi'e* 语法解析

  使用 [*jboski*](https://jboski.lojban.org) 进行语法解析和逐词翻译，返回 HTML 结果。

  需要 `component:html` 服务。

- `camxes <input...>`：*camxes* 语法解析

  使用 [web-*camxes*](https://camxes.lojban.org) 进行语法解析，返回 HTML 结果。

  需要 `component:html` 服务。

- `gentufa <input...>`：*jbotci gentufa* 语法解析

  使用 [*jbotci gentufa*](https://lojban.int19h.org/cgi-bin/parse.cgi) 进行语法解析和逐词翻译，返回 HTML 结果。

  若存在 `component:html` 就会使用，若不存在则直接向服务器请求 PNG 图片。

  选项：

  - `-E`, `--no-english`：显示语法结构的逻辑语名称
  - `-l`, `--elided`：显示省略的终止词
